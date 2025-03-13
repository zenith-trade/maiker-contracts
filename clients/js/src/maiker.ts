import { Connection, PublicKey, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, SYSVAR_CLOCK_PUBKEY, AccountMeta } from '@solana/web3.js';
import { getAssociatedTokenAddressSync as getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getMint, Mint, AccountLayout, MintLayout } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import Decimal from 'decimal.js';
import DLMM, {
  deriveLbPair2,
  BinAndAmount,
  calculateSpotDistribution,
  calculateBidAskDistribution,
  calculateNormalDistribution,
  binIdToBinArrayIndex,
  deriveBinArray,
  isOverflowDefaultBinArrayBitmap,
  deriveBinArrayBitmapExtension,
  toWeightDistribution,
  LbPair,
  TokenReserve,
  PositionData,
  PositionVersion,
  getBinArrayLowerUpperBinId,
  getPriceOfBinByBinId,
  BinLiquidity,
  BinArray,
  Position,
  PositionBinData,
  ClmmProgram,
  SwapFee,
  getBinFromBinArray,
  SCALE_OFFSET,
  LMRewards,
} from '@meteora-ag/dlmm';
import * as maiker from './generated-maiker/accounts';
import * as maikerInstructions from './generated-maiker/instructions';
import * as maikerTypes from './generated-maiker/types';
import { PROGRAM_ID as maikerProgramId } from './generated-maiker/programId';
import * as dlmm from './generated-dlmm/accounts';
import * as dlmmInstructions from './generated-dlmm/instructions';
import * as dlmmTypes from './generated-dlmm/types';
import { PROGRAM_ID as dlmmProgramId } from './generated-dlmm/programId';
import { simulateAndGetTxWithCUs } from './utils/buildTxAndCheckCu';
import { DLMM_EVENT_AUTHORITY_PDA, SHARE_PRECISION } from './constants';
import { getOrCreateBinArraysInstructions } from './meteora/utils';
import {
  StrategyContext,
  PositionValue,
  UserPositionInfo,
  PendingWithdrawalInfo,
  WithdrawalWindow,
  DepositParams,
  WithdrawParams,
  PositionLiquidityParams,
  TransactionResult,
  StrategySetupParams,
  PositionInfo
} from './types';
import { deriveGlobalConfig, derivePendingWithdrawal, deriveStrategy, deriveUserPosition } from './utils';
import { chunkedGetMultipleAccountInfos, getOrCreateATAInstruction, mulShr, Rounding } from './helpers';

/**
 * Main SDK class for the Maiker strategy contracts
 */
export class MaikerSDK {
  /** Connection to use for fetching data */
  public readonly connection: Connection;

  /** PublicKey of the global config account */
  public readonly globalConfig: PublicKey;

  /** PublicKey of the strategy account */
  public readonly strategy: PublicKey;

  /** X token mint */
  public readonly xMint: Mint;

  /** Y token mint */
  public readonly yMint: Mint;

  /** Strategy account data */
  public strategyAcc: maiker.StrategyConfig;

  /** Global config account data */
  public globalConfigAcc: maiker.GlobalConfig;

  /** Map of position addresses to their info */
  public positions: Map<string, PositionInfo> = new Map();

  public lbPairs: Map<string, dlmm.lbPair> = new Map();

  /**
   * Private constructor - use static factory methods to create instances
   */
  private constructor(
    connection: Connection,
    globalConfig: PublicKey,
    strategy: PublicKey,
    xMint: Mint,
    yMint: Mint,
    strategyAcc: maiker.StrategyConfig,
    globalConfigAcc: maiker.GlobalConfig,
  ) {
    this.connection = connection;
    this.globalConfig = globalConfig;
    this.strategy = strategy;
    this.xMint = xMint;
    this.yMint = yMint;
    this.strategyAcc = strategyAcc;
    this.globalConfigAcc = globalConfigAcc;
  }

  /**
   * Creates a new MaikerSDK instance for an existing strategy
   */
  public static async create(
    connection: Connection,
    strategy: PublicKey
  ): Promise<MaikerSDK> {
    // Fetch strategy data
    const strategyData = await maiker.StrategyConfig.fetch(connection, strategy);

    if (!strategyData) {
      throw new Error(`Strategy not found at address ${strategy.toBase58()}`);
    }

    // Find global config
    const globalConfig = deriveGlobalConfig();

    // Fetch global config data
    const globalConfigData = await maiker.GlobalConfig.fetch(connection, globalConfig);

    if (!globalConfigData) {
      throw new Error(`Global config not found at address ${globalConfig.toBase58()}`);
    }

    // Fetch mint info to get decimals
    const [xMintInfo, yMintInfo] = await Promise.all([
      getMint(connection, strategyData.xMint),
      getMint(connection, strategyData.yMint)
    ]);

    if (!xMintInfo || !yMintInfo) {
      throw new Error("Failed to fetch mint info");
    }

    // Create instance
    const instance = new MaikerSDK(
      connection,
      globalConfig,
      strategy,
      xMintInfo,
      yMintInfo,
      strategyData,
      globalConfigData
    );

    // TODO: How will we handle Position Data?

    // If there are positions, set up DLMM instance
    // if (strategyData.positionCount > 0) {
    //   const [lbPair] = deriveLbPair2(
    //     strategyData.xMint,
    //     strategyData.yMint,
    //     new BN(10), // Default bin step, can be adjusted if needed
    //     new BN(10000), // Default base factor
    //     dlmmProgramId
    //   );

    //   instance.lbPair = lbPair;
    //   instance.dlmmInstance = await DLMM.create(connection, lbPair);
    // }

    return instance;
  }

  /**
   * Creates a new strategy and returns an SDK instance to interact with it
   */
  public static async createStrategy(
    connection: Connection,
    params: StrategySetupParams
  ): Promise<TransactionInstruction[]> {
    const { creator, xMint, yMint } = params;

    // Find strategy PDA
    const strategy = deriveStrategy(creator);

    const preIxs: TransactionInstruction[] = [];

    // Vaults
    const [xVault, yVault] = await Promise.all([
      getOrCreateATAInstruction(connection, xMint, strategy, params.creator, true),
      getOrCreateATAInstruction(connection, yMint, strategy, params.creator, true),
    ]);

    // Create Native Mint SOL ATA for sol escrow
    if (xVault.ix) preIxs.push(xVault.ix);
    if (yVault.ix) preIxs.push(yVault.ix);

    // Create instruction
    const createStrategyIx = maikerInstructions.createStrategy(
      {
        creator,
        xMint,
        yMint,
        xVault: xVault.ataPubKey,
        yVault: yVault.ataPubKey,
        strategy,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }
    );

    return [...preIxs, createStrategyIx];
  }

  /**
   * Refreshes the strategy data
   */
  public async refresh(): Promise<void> {
    const strategyData = await maiker.StrategyConfig.fetch(this.connection, this.strategy);
    if (strategyData) {
      this.strategyAcc = strategyData;
    }

    await this.fetchPositions();
  }

  public async fetchPositions(): Promise<Map<string, PositionInfo>> {
    const binArrayPubkeySetV2 = new Set<string>();
    const lbPairSetV2 = new Set<string>();

    // Filter out default positions
    const strategyPositions = this.strategyAcc.positions.filter((position) => !position.equals(PublicKey.default));

    const strategyPositionInfos = await chunkedGetMultipleAccountInfos(this.connection, [
      ...strategyPositions
    ]);

    const positionsV2 = strategyPositionInfos.map((accInfo, idx) => ({
      account: dlmm.positionV2.decode(accInfo.data),
      publicKey: this.strategyAcc.positions[idx]
    }));

    positionsV2.forEach(({ account: { upperBinId, lowerBinId, lbPair } }) => {
      const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
      const upperBinArrayIndex = binIdToBinArrayIndex(new BN(upperBinId));

      const [lowerBinArrayPubKey] = deriveBinArray(
        lbPair,
        lowerBinArrayIndex,
        dlmmProgramId
      );
      const [upperBinArrayPubKey] = deriveBinArray(
        lbPair,
        upperBinArrayIndex,
        dlmmProgramId
      );
      binArrayPubkeySetV2.add(lowerBinArrayPubKey.toBase58());
      binArrayPubkeySetV2.add(upperBinArrayPubKey.toBase58());
      lbPairSetV2.add(lbPair.toBase58());
    });

    const binArrayPubkeyArrayV2 = Array.from(binArrayPubkeySetV2).map(
      (pubkey) => new PublicKey(pubkey)
    );
    const lbPairArrayV2 = Array.from(lbPairSetV2).map(
      (pubkey) => new PublicKey(pubkey)
    );

    const [clockAccInfo, ...binArraysAccInfo] =
      await chunkedGetMultipleAccountInfos(this.connection, [
        SYSVAR_CLOCK_PUBKEY,
        ...binArrayPubkeyArrayV2,
        ...lbPairArrayV2,
      ]);

    const positionBinArraysMapV2 = new Map<string, dlmm.binArray>();

    for (
      let i = 0;
      i < binArrayPubkeyArrayV2.length;
      i += 1
    ) {
      const binArrayPubkey =
        binArrayPubkeyArrayV2[
        i
        ];
      const binArrayAccInfoBufferV2 = binArraysAccInfo[i];
      if (binArrayAccInfoBufferV2) {
        const binArrayAccInfo = dlmm.binArray.decode(
          binArrayAccInfoBufferV2.data
        );
        positionBinArraysMapV2.set(binArrayPubkey.toBase58(), binArrayAccInfo);
      }
    }

    const lbPairArraysMapV2 = new Map<string, dlmm.lbPair>();
    for (
      let i =
        binArrayPubkeyArrayV2.length;
      i < binArraysAccInfo.length;
      i += 1
    ) {
      const lbPairPubkey =
        lbPairArrayV2[
        i - binArrayPubkeyArrayV2.length
        ];
      const lbPairAccInfoBufferV2 = binArraysAccInfo[i];
      if (!lbPairAccInfoBufferV2)
        throw new Error(`LB Pair account ${lbPairPubkey.toBase58()} not found`);
      const lbPairAccInfo = dlmm.lbPair.decode(
        lbPairAccInfoBufferV2.data
      );
      lbPairArraysMapV2.set(lbPairPubkey.toBase58(), lbPairAccInfo);
    }

    // Add Lb Pairs map to self, adding to any existing values
    this.lbPairs = new Map([...this.lbPairs, ...lbPairArraysMapV2]);

    const reservePublicKeysV2 = Array.from(lbPairArraysMapV2.values())
      .map(({ reserveX, reserveY, tokenXMint, tokenYMint }) => [
        reserveX,
        reserveY,
        tokenXMint,
        tokenYMint,
      ])
      .flat();

    const reserveAccountsInfo = await chunkedGetMultipleAccountInfos(
      this.connection,
      reservePublicKeysV2
    );

    const lbPairReserveMapV2 = new Map<
      string,
      { reserveX: bigint; reserveY: bigint }
    >();

    lbPairArrayV2.forEach((lbPair, idx) => {
      const index = idx * 4;
      const reserveAccBufferXV2 =
        reserveAccountsInfo[index];
      const reserveAccBufferYV2 =
        reserveAccountsInfo[index + 1];
      if (!reserveAccBufferXV2 || !reserveAccBufferYV2)
        throw new Error(
          `Reserve account for LB Pair ${lbPair.toBase58()} not found`
        );
      const reserveAccX = AccountLayout.decode(reserveAccBufferXV2.data);
      const reserveAccY = AccountLayout.decode(reserveAccBufferYV2.data);

      lbPairReserveMapV2.set(lbPair.toBase58(), {
        reserveX: reserveAccX.amount,
        reserveY: reserveAccY.amount,
      });
    });

    const onChainTimestamp = new BN(
      clockAccInfo.data.readBigInt64LE(32).toString()
    ).toNumber();

    positionsV2.forEach(position => {
      const { account, publicKey: positionPubKey } = position;
      const { upperBinId, lowerBinId, lbPair, feeOwner } = account;

      const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
      const upperBinArrayIndex = binIdToBinArrayIndex(new BN(upperBinId));

      const [lowerBinArrayPubKey] = deriveBinArray(
        lbPair,
        lowerBinArrayIndex,
        dlmmProgramId
      );
      const [upperBinArrayPubKey] = deriveBinArray(
        lbPair,
        upperBinArrayIndex,
        dlmmProgramId
      );

      const lowerBinArray = positionBinArraysMapV2.get(
        lowerBinArrayPubKey.toBase58()
      );
      const upperBinArray = positionBinArraysMapV2.get(
        upperBinArrayPubKey.toBase58()
      );

      const lbPairAcc = lbPairArraysMapV2.get(lbPair.toBase58());

      if (!lbPairAcc) {
        return;
      }

      let baseTokenDecimal: number;
      let quoteTokenDecimal: number;

      if (this.xMint.address.equals(lbPairAcc.tokenXMint)) {
        baseTokenDecimal = this.xMint.decimals;
        quoteTokenDecimal = this.yMint.decimals;
      } else {
        baseTokenDecimal = this.yMint.decimals;
        quoteTokenDecimal = this.xMint.decimals;
      }

      const reserveXBalance =
        lbPairReserveMapV2.get(lbPair.toBase58())?.reserveX ?? BigInt(0);
      const reserveYBalance =
        lbPairReserveMapV2.get(lbPair.toBase58())?.reserveY ?? BigInt(0);

      const tokenX = {
        publicKey: lbPairAcc.tokenXMint,
        reserve: lbPairAcc.reserveX,
        amount: reserveXBalance,
        decimal: baseTokenDecimal,
      };

      const tokenY = {
        publicKey: lbPairAcc.tokenYMint,
        reserve: lbPairAcc.reserveY,
        amount: reserveYBalance,
        decimal: quoteTokenDecimal,
      };

      // Process the position if bin arrays are available
      if (!!lowerBinArray && !!upperBinArray) {
        const positionData = MaikerSDK.processPosition(
          PositionVersion.V2,
          lbPairAcc,
          onChainTimestamp,
          account,
          baseTokenDecimal,
          quoteTokenDecimal,
          lowerBinArray!,
          upperBinArray!,
          feeOwner
        );

        // Set Position in map
        this.positions.set(positionPubKey.toBase58(), {
          pubkey: positionPubKey,
          lbPair,
          tokenX,
          tokenY,
          positionData
        });
      } else {
        // Default position data when bin arrays aren't available
        const defaultPositionData = {
          totalXAmount: '0',
          totalYAmount: '0',
          positionBinData: [],
          lastUpdatedAt: new BN(0),
          upperBinId,
          lowerBinId,
          feeX: new BN(0),
          feeY: new BN(0),
          rewardOne: new BN(0),
          rewardTwo: new BN(0),
          feeOwner,
          totalClaimedFeeXAmount: new BN(0),
          totalClaimedFeeYAmount: new BN(0),
        };

        this.positions.set(positionPubKey.toBase58(), {
          pubkey: positionPubKey,
          lbPair,
          tokenX,
          tokenY,
          positionData: defaultPositionData
        });
      }
    });

    return this.positions;
  }

  /**
   * Creates a deposit instruction
   */
  public async createDepositInstruction(
    params: DepositParams
  ): Promise<TransactionInstruction[]> {
    const { user, amount } = params;

    const userPosition = deriveUserPosition(user, this.strategy);


    const preIxs = [];

    // User Ata
    const xUser = await getOrCreateATAInstruction(this.connection, this.xMint.address, user, user, true);
    if (xUser.ix) preIxs.push(xUser.ix);

    const depositIx = maikerInstructions.deposit(
      {
        amount: new BN(amount),
      },
      {
        user,
        strategy: this.strategy,
        globalConfig: this.globalConfig,
        userPosition,
        userTokenX: xUser.ataPubKey,
        strategyVaultX: this.strategyAcc.xVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }
    );

    return [...preIxs, depositIx];
  }

  /**
   * Creates a withdrawal initiation instruction
   */
  public async createInitiateWithdrawalInstruction(
    params: WithdrawParams
  ): Promise<TransactionInstruction> {
    const { user, sharesAmount } = params;

    // Find user position PDA
    const userPosition = deriveUserPosition(user, this.strategy);

    // Find pending withdrawal PDA
    const pendingWithdrawal = derivePendingWithdrawal(user, this.strategy);

    return maikerInstructions.initiateWithdrawal(
      {
        sharesAmount: new BN(sharesAmount),
      },
      {
        user,
        strategy: this.strategy,
        globalConfig: this.globalConfig,
        userPosition,
        pendingWithdrawal,
        strategyVaultX: this.strategyAcc.xVault,
        systemProgram: SystemProgram.programId,
      }
    );
  }

  /**
   * Creates a withdrawal processing instruction
   */
  public async createProcessWithdrawalInstruction(
    params: { user: PublicKey }
  ): Promise<TransactionInstruction[]> {
    const { user } = params;

    // Find pending withdrawal PDA
    const pendingWithdrawal = derivePendingWithdrawal(user, this.strategy);

    const preIxs = [];
    // Get user X token account

    const xUser = await getOrCreateATAInstruction(this.connection, this.xMint.address, user, user, true);
    if (xUser.ix) preIxs.push(xUser.ix);

    const processWithdrawalIx = maikerInstructions.processWithdrawal(
      {
        user,
        strategy: this.strategy,
        globalConfig: this.globalConfig,
        pendingWithdrawal,
        strategyVaultX: this.strategyAcc.xVault,
        userTokenX: xUser.ataPubKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    );

    return [...preIxs, processWithdrawalIx];
  }

  public createSwapInstruction(
    params: {
      authority: PublicKey,
      lbPair: PublicKey,
      lbPairAcc: dlmm.lbPair,
      amountIn: BN,
      minAmountOut: BN,
      xToY: boolean
      activeBin: number
    }
  ): TransactionInstruction {
    const { authority, lbPair, amountIn, minAmountOut, xToY, activeBin, lbPairAcc } = params;

    const activeBinArrayIdx = binIdToBinArrayIndex(new BN(activeBin));

    const [activeBinArray] = deriveBinArray(
      lbPair,
      activeBinArrayIdx,
      dlmmProgramId
    );

    const activeBinArrayMeta: AccountMeta = {
      isSigner: false,
      isWritable: true,
      pubkey: activeBinArray,
    };

    const swapIx = maikerInstructions.swapExactIn(
      {
        amountIn,
        minAmountOut,
        xToY,
      },
      {
        authority,
        globalConfig: this.globalConfig,
        strategy: this.strategy,
        lbPair,
        binArrayBitmapExtension: dlmmProgramId, // We know it's not required here in test
        reserveX: lbPairAcc.reserveX,
        reserveY: lbPairAcc.reserveY,
        strategyVaultX: this.strategyAcc.xVault,
        strategyVaultY: this.strategyAcc.yVault,
        tokenXMint: lbPairAcc.tokenXMint,
        tokenYMint: lbPairAcc.tokenYMint,
        oracle: lbPairAcc.oracle,
        hostFeeIn: dlmmProgramId,
        lbClmmProgram: dlmmProgramId,
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID
      }
    )

    // Remaining accounts pushed directly
    swapIx.keys.push(activeBinArrayMeta);

    return swapIx
  }

  /**
   * Creates instruction to initialize position for strategy
   */
  public createInitializePositionInstruction(
    params: {
      lbPair: PublicKey,
      position: PublicKey,
      authority: PublicKey,
      lowerBinId: number,
      width: number,
    }
  ): TransactionInstruction {
    const { lbPair, authority, lowerBinId, width, position } = params;

    return maikerInstructions.initializePosition(
      {
        lowerBinId,
        width,
      },
      {
        authority,
        globalConfig: this.globalConfig,
        strategy: this.strategy,
        position,
        lbPair,
        lbClmmProgram: dlmmProgramId,
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      }
    );
  }

  /**
   * Creates instruction to add liquidity to position
   */
  public async createAddLiquidityInstruction(
    params: PositionLiquidityParams
  ): Promise<{
    instruction: TransactionInstruction,
    preInstructions: TransactionInstruction[]
  }> {
    const { authority, position, totalXAmount, totalYAmount, binDistribution, lbPair } = params;

    const lbPairAcc = this.lbPairs.get(lbPair.toBase58());

    if (!lbPairAcc) {
      throw new Error("LB Pair not found");
    }

    // Convert to weight distribution
    const binLiquidityDist = toWeightDistribution(
      totalXAmount,
      totalYAmount,
      binDistribution.map((item) => ({
        binId: item.binId,
        xAmountBpsOfTotal: item.xAmountBpsOfTotal,
        yAmountBpsOfTotal: item.yAmountBpsOfTotal,
      })),
      lbPairAcc.binStep
    );

    if (binLiquidityDist.length === 0) {
      throw new Error("No liquidity to add");
    }

    // Create add liquidity parameters
    const liquidityParams = {
      amountX: totalXAmount,
      amountY: totalYAmount,
      binLiquidityDist,
      activeId: lbPairAcc.activeId,
      maxActiveBinSlippage: 0,
    };

    // Find min and max bin IDs from liquidity distribution
    const lowerBinId = Math.min(...binLiquidityDist.map(dist => dist.binId));
    const upperBinId = Math.max(...binLiquidityDist.map(dist => dist.binId));

    // Check bin arrays
    const preInstructions: TransactionInstruction[] = [];
    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const upperBinArrayIndex = binIdToBinArrayIndex(new BN(upperBinId));

    // Get or create bin arrays
    const { instructions, lowerBinArray, upperBinArray } = await getOrCreateBinArraysInstructions(
      this.connection,
      lbPair,
      new BN(lowerBinArrayIndex),
      new BN(upperBinArrayIndex),
      authority
    );

    if (instructions.length > 0) {
      preInstructions.push(...instructions);
    }

    // Check if extension is required
    const useExtension =
      isOverflowDefaultBinArrayBitmap(lowerBinArrayIndex) ||
      isOverflowDefaultBinArrayBitmap(upperBinArrayIndex);

    const binArrayBitmapExtension = useExtension
      ? deriveBinArrayBitmapExtension(lbPair, dlmmProgramId)[0]
      : null;

    // Create add liquidity instruction
    const instruction = maikerInstructions.addLiquidity(
      {
        liquidityParameter: liquidityParams,
      },
      {
        position,
        authority,
        globalConfig: this.globalConfig,
        strategy: this.strategy,
        lbPair,
        tokenXMint: this.xMint.address,
        tokenYMint: this.yMint.address,
        strategyVaultX: this.strategyAcc.xVault,
        strategyVaultY: this.strategyAcc.yVault,
        reserveX: lbPairAcc.reserveX,
        reserveY: lbPairAcc.reserveY,
        binArrayLower: lowerBinArray,
        binArrayUpper: upperBinArray,
        binArrayBitmapExtension: binArrayBitmapExtension || dlmmProgramId,
        lbClmmProgram: dlmmProgramId,
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }
    );

    return {
      instruction,
      preInstructions
    };
  }

  /**
   * Creates instruction to remove liquidity from position
   */
  public createRemoveLiquidityInstruction(
    params: {
      authority: PublicKey,
      position: PublicKey,
      lowerBinId: number,
      upperBinId: number,
    }
  ): Promise<{
    instruction: TransactionInstruction,
    preInstructions: TransactionInstruction[]
  }> {
    // Implementation will go here
    // This is similar to addLiquidity but uses the removeLiquidity instruction
    // For brevity, we'll implement this later
    throw new Error("Not implemented yet");
  }

  public createMeteoraClaimFeesInstruction(
    params: {
      authority: PublicKey,
      lbPair: PublicKey,
      position: PublicKey,
    }
  ): TransactionInstruction {
    const { authority, position } = params;

    if (!this.positions) {
      throw new Error("Positions not fetched");
    }

    const positionData = this.positions.get(position.toBase58());

    if (!positionData) {
      throw new Error("Position not found");
    }

    const lbPairAcc = this.lbPairs.get(positionData.lbPair.toBase58());

    if (!lbPairAcc) {
      throw new Error("LB Pair not found");
    }

    const [lowerBinArrayPubKey] = deriveBinArray(
      positionData.lbPair,
      new BN(positionData.positionData?.lowerBinId ?? 0),
      dlmmProgramId
    );
    const [upperBinArrayPubKey] = deriveBinArray(
      positionData.lbPair,
      new BN(positionData.positionData?.upperBinId ?? 0),
      dlmmProgramId
    );

    return maikerInstructions.claimFee(
      {
        authority,
        globalConfig: this.globalConfig,
        strategy: this.strategy,
        strategyVaultX: this.strategyAcc.xVault,
        strategyVaultY: this.strategyAcc.yVault,
        position,
        lbPair: positionData.lbPair,
        binArrayLower: lowerBinArrayPubKey,
        binArrayUpper: upperBinArrayPubKey,
        reserveX: lbPairAcc.reserveX,
        reserveY: lbPairAcc.reserveY,
        tokenXMint: positionData.tokenX.publicKey,
        tokenYMint: positionData.tokenY.publicKey,
        lbClmmProgram: dlmmProgramId,
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    );
  }

  public createClosePositionInstruction(
    params: {
      authority: PublicKey,
      position: PublicKey,
    }
  ): TransactionInstruction {
    const { authority, position } = params;

    const positionData = this.positions.get(position.toBase58());

    if (!positionData) {
      throw new Error("Position not found");
    }

    const lbPairAcc = this.lbPairs.get(positionData.lbPair.toBase58());

    if (!lbPairAcc) {
      throw new Error("LB Pair not found");
    }

    const [lowerBinArrayPubKey] = deriveBinArray(
      positionData.lbPair,
      new BN(positionData.positionData?.lowerBinId ?? 0),
      dlmmProgramId
    );

    const [upperBinArrayPubKey] = deriveBinArray(
      positionData.lbPair,
      new BN(positionData.positionData?.upperBinId ?? 0),
      dlmmProgramId
    );

    return maikerInstructions.closePosition(
      {
        authority,
        globalConfig: this.globalConfig,
        strategy: this.strategy,
        position,
        lbPair: positionData.lbPair,
        binArrayLower: lowerBinArrayPubKey,
        binArrayUpper: upperBinArrayPubKey,
        rentReceiver: this.strategyAcc.xVault,
        lbClmmProgram: dlmmProgramId,
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
      }
    );
  }

  /**
   * Creates instructions to get the value of a position
   */
  public createPositionValueInstructions(params: { user: PublicKey }): TransactionInstruction[] {
    const positionPubkeys = this.strategyAcc.positions

    const ixs = positionPubkeys.map((positionPubKey) => {
      const positionData = this.positions.get(positionPubKey.toBase58());

      if (!positionData) {
        throw new Error("Position not found");
      }

      const [lowerBinArray] = deriveBinArray(positionData.lbPair, new BN(positionData.positionData?.lowerBinId ?? 0), dlmmProgramId);
      const [upperBinArray] = deriveBinArray(positionData.lbPair, new BN(positionData.positionData?.upperBinId ?? 0), dlmmProgramId);

      return maikerInstructions.getPositionValue({
        strategy: this.strategy,
        position: positionPubKey,
        lbPair: positionData.lbPair,
        binArrayLower: lowerBinArray,
        binArrayUpper: upperBinArray,
        user: params.user
      });
    });

    return ixs;
  }

  /**
   * Gets user position information
   */
  public async getUserPosition(user: PublicKey): Promise<UserPositionInfo | null> {
    const userPosition = deriveUserPosition(user, this.strategy);

    const userPositionData = await maiker.UserPosition.fetch(this.connection, userPosition);

    if (!userPositionData) {
      return null;
    }

    const strategyValue = await this.getStrategyValue();

    const shareValue = strategyValue.totalValue / Number(this.strategyAcc.strategyShares || 1);

    return {
      address: userPosition,
      strategyShare: Number(userPositionData.strategyShare),
      shareValue,
      lastShareValue: Number(userPositionData.lastShareValue),
      lastUpdateSlot: Number(userPositionData.lastUpdateSlot),
      valueInToken: Number(userPositionData.strategyShare) * shareValue / SHARE_PRECISION,
    };
  }

  /**
   * Gets all pending withdrawals for the strategy
   */
  public async getPendingWithdrawals(): Promise<PendingWithdrawalInfo[]> {
    if (!this.globalConfigAcc || !this.strategyAcc) {
      throw new Error("Strategy not initialized");
    }

    // Find all pending withdrawal accounts for this strategy
    const pendingWithdrawalAccounts = await this.connection.getProgramAccounts(
      maikerProgramId,
      {
        filters: [
          {
            memcmp: {
              offset: 8, // Skip discriminator
              bytes: this.strategy.toBase58(), // Filter by strategy
            },
          },
          {
            dataSize: maiker.PendingWithdrawal.layout.span, // Filter by account size
          },
        ],
      }
    );

    // Parse accounts
    const pendingWithdrawals: PendingWithdrawalInfo[] = [];

    // Use map instead of for...of
    return pendingWithdrawalAccounts.map(account => {
      try {
        const pendingWithdrawal = maiker.PendingWithdrawal.decode(account.account.data);
        // Cast to add missing properties if they exist but are not in type definition
        const withdrawal = pendingWithdrawal as unknown as {
          owner: PublicKey;
          strategy: PublicKey;
          sharesAmount: BN;
          tokenAmount: BN;
          initiationTimestamp: BN;
          availableTimestamp: BN;
        };

        return {
          address: account.pubkey,
          owner: withdrawal.owner,
          strategy: withdrawal.strategy,
          sharesAmount: withdrawal.sharesAmount.toString(),
          tokenAmount: withdrawal.tokenAmount.toString(),
          initiationTimestamp: withdrawal.initiationTimestamp.toString(),
          availableTimestamp: withdrawal.availableTimestamp.toString(),
          isReady: Date.now() / 1000 > Number(withdrawal.availableTimestamp),
        };
      } catch (e) {
        console.error('Failed to decode pending withdrawal:', e);
        return null;
      }
    }).filter((item): item is PendingWithdrawalInfo => item !== null);
  }

  /**
   * Groups pending withdrawals by withdrawal window
   */
  public async getPendingWithdrawalsByWindow(): Promise<WithdrawalWindow[]> {
    const pendingWithdrawals = await this.getPendingWithdrawals();

    // Group by availableTimestamp
    const withdrawalsByTimestamp: { [timestamp: string]: PendingWithdrawalInfo[] } = {};

    pendingWithdrawals.forEach(withdrawal => {
      const timestamp = withdrawal.availableTimestamp;
      if (!withdrawalsByTimestamp[timestamp]) {
        withdrawalsByTimestamp[timestamp] = [];
      }
      withdrawalsByTimestamp[timestamp].push(withdrawal);
    });

    // Convert to array of withdrawal windows
    return Object.entries(withdrawalsByTimestamp).map(([timestamp, withdrawals]) => {
      const totalShares = withdrawals.reduce(
        (sum, w) => sum + BigInt(w.sharesAmount),
        BigInt(0)
      );

      const totalTokens = withdrawals.reduce(
        (sum, w) => sum + BigInt(w.tokenAmount),
        BigInt(0)
      );

      return {
        timestamp,
        withdrawals,
        totalShares: totalShares.toString(),
        totalTokens: totalTokens.toString(),
        isReady: Date.now() / 1000 > Number(timestamp),
      };
    });
  }

  /**
   * Gets all positions for the strategy
   */
  public async getPositions(): Promise<PositionInfo[]> {
    if (!this.positions) {
      return [];
    }

    return Array.from(this.positions.values());
  }

  /**
   * Calculates the current value of the strategy
   */
  public async getStrategyValue(): Promise<PositionValue> {
    if (!this.strategyAcc) {
      throw new Error("Strategy not initialized");
    }

    const [xBalance, yBalance] = await Promise.all([
      this.getTokenBalance(this.strategyAcc.xVault),
      this.getTokenBalance(this.strategyAcc.yVault)
    ]);

    // If no positions, value is just the vault balances
    if (!this.strategyAcc || this.strategyAcc.positionCount === 0) {
      return {
        xTokenAmount: xBalance,
        yTokenAmount: yBalance,
        xTokenValue: xBalance,
        yTokenValueInX: 0, // No positions, so we don't have a price
        totalValue: xBalance
      };
    }

    // Get position value from fetched positions
    const positionPubkeys = this.strategyAcc.positions;

    // Calculate positions value
    const positions = Array.from(this.positions.values());

    // Verify that we have all positions loaded
    if (positions.length !== positionPubkeys.length) {
      throw new Error("Missing positions data");
    }

    // Ensure every position pubkey has a corresponding position
    const positionSet = new Set(positions.map(p => p.pubkey.toString()));
    const missingPositions = positionPubkeys.filter(pubkey => !positionSet.has(pubkey.toString()));

    if (missingPositions.length > 0) {
      throw new Error(`Missing data for positions: ${missingPositions.map(p => p.toString()).join(', ')}`);
    }

    // Sum up the token amounts across all positions
    const positionsValue = positions.reduce((acc, position) => {
      const xAmount = parseFloat(position.positionData?.totalXAmount || "0");
      const yAmount = parseFloat(position.positionData?.totalYAmount || "0");

      // Add fees in the calculation
      const feeX = position.positionData?.feeX ? position.positionData.feeX.toNumber() / (10 ** this.xMint.decimals) : 0;
      const feeY = position.positionData?.feeY ? position.positionData.feeY.toNumber() / (10 ** this.yMint.decimals) : 0;

      acc.xAmount += xAmount + feeX;
      acc.yAmount += yAmount + feeY;
      return acc;
    }, { xAmount: 0, yAmount: 0 });

    const lbPair = this.lbPairs.get(positions[0].lbPair.toBase58());

    if (!lbPair) {
      throw new Error("LB Pair not found");
    }

    const activeBin = lbPair.activeId;
    const price = getPriceOfBinByBinId(activeBin, lbPair.binStep);

    let totalYValueInX = 0;
    if (positionsValue.yAmount > 0) {
      totalYValueInX = positionsValue.yAmount * Number(price);
    }

    // Total up everything
    const totalXAmount = xBalance + positionsValue.xAmount;
    const totalYAmount = yBalance + positionsValue.yAmount;
    const totalValue = totalXAmount + totalYValueInX;

    return {
      xTokenAmount: totalXAmount,
      yTokenAmount: totalYAmount,
      xTokenValue: totalXAmount,
      yTokenValueInX: totalYValueInX,
      totalValue
    };
  }

  /**
   * Gets token balance for an account
   */
  private async getTokenBalance(pubkey: PublicKey): Promise<number> {
    const accInfo = await this.connection.getAccountInfo(pubkey);
    const tokenAcc = AccountLayout.decode(accInfo?.data || Buffer.from([]));
    return Number(tokenAcc.amount);
  }


  // Meteora methods below
  private static getClaimableLMReward(
    positionVersion: PositionVersion,
    lbPair: dlmm.lbPair,
    onChainTimestamp: number,
    position: dlmm.position,
    lowerBinArray: dlmm.binArray,
    upperBinArray: dlmm.binArray
  ): LMRewards {
    const lowerBinArrayIdx = binIdToBinArrayIndex(new BN(position.lowerBinId));

    const rewards = [new BN(0), new BN(0)];

    for (let i = position.lowerBinId; i <= position.upperBinId; i += 1) {
      const binArrayIdx = binIdToBinArrayIndex(new BN(i));
      const binArray = binArrayIdx.eq(lowerBinArrayIdx)
        ? lowerBinArray
        : upperBinArray;
      const binState = getBinFromBinArray(i, binArray);
      const binIdxInPosition = i - position.lowerBinId;

      const positionRewardInfo = position.rewardInfos[binIdxInPosition];
      const liquidityShare =
        positionVersion === PositionVersion.V1
          ? position.liquidityShares[binIdxInPosition]
          : position.liquidityShares[binIdxInPosition].shrn(64);

      for (let j = 0; j < 2; j += 1) {
        const pairRewardInfo = lbPair.rewardInfos[j];

        if (!pairRewardInfo.mint.equals(PublicKey.default)) {
          let rewardPerTokenStored = binState.rewardPerTokenStored[j];

          if (i === lbPair.activeId && !binState.liquiditySupply.isZero()) {
            const currentTime = new BN(
              Math.min(
                onChainTimestamp,
                pairRewardInfo.rewardDurationEnd.toNumber()
              )
            );
            const delta = currentTime.sub(pairRewardInfo.lastUpdateTime);
            const liquiditySupply =
              binArray.version === 0
                ? binState.liquiditySupply
                : binState.liquiditySupply.shrn(64);
            const rewardPerTokenStoredDelta = pairRewardInfo.rewardRate
              .mul(delta)
              .div(new BN(15))
              .div(liquiditySupply);
            rewardPerTokenStored = rewardPerTokenStored.add(
              rewardPerTokenStoredDelta
            );
          }

          const delta = rewardPerTokenStored.sub(
            positionRewardInfo.rewardPerTokenCompletes[j]
          );
          const newReward = mulShr(
            delta,
            liquidityShare,
            SCALE_OFFSET,
            Rounding.Down
          );
          rewards[j] = rewards[j]
            .add(newReward)
            .add(positionRewardInfo.rewardPendings[j]);
        }
      }
    }

    return {
      rewardOne: rewards[0],
      rewardTwo: rewards[1],
    };
  }

  private static getClaimableSwapFee(
    positionVersion: PositionVersion,
    position: Position,
    lowerBinArray: BinArray,
    upperBinArray: BinArray
  ): SwapFee {
    const lowerBinArrayIdx = binIdToBinArrayIndex(new BN(position.lowerBinId));

    let feeX = new BN(0);
    let feeY = new BN(0);

    for (let i = position.lowerBinId; i <= position.upperBinId; i += 1) {
      const binArrayIdx = binIdToBinArrayIndex(new BN(i));
      const binArray = binArrayIdx.eq(lowerBinArrayIdx)
        ? lowerBinArray
        : upperBinArray;
      const binState = getBinFromBinArray(i, binArray);
      const binIdxInPosition = i - position.lowerBinId;

      const feeInfos = position.feeInfos[binIdxInPosition];
      const liquidityShare =
        positionVersion === PositionVersion.V1
          ? position.liquidityShares[binIdxInPosition]
          : position.liquidityShares[binIdxInPosition].shrn(64);

      const newFeeX = mulShr(
        liquidityShare,
        binState.feeAmountXPerTokenStored.sub(feeInfos.feeXPerTokenComplete),
        SCALE_OFFSET,
        Rounding.Down
      );

      const newFeeY = mulShr(
        liquidityShare,
        binState.feeAmountYPerTokenStored.sub(feeInfos.feeYPerTokenComplete),
        SCALE_OFFSET,
        Rounding.Down
      );

      feeX = feeX.add(newFeeX).add(feeInfos.feeXPending);
      feeY = feeY.add(newFeeY).add(feeInfos.feeYPending);
    }

    return { feeX, feeY };
  }

  private static processPosition(
    version: PositionVersion,
    lbPair: dlmm.lbPair,
    onChainTimestamp: number,
    position: dlmm.position,
    baseTokenDecimal: number,
    quoteTokenDecimal: number,
    lowerBinArray: dlmm.binArray,
    upperBinArray: dlmm.binArray,
    feeOwner: PublicKey
  ): PositionData | null {
    const {
      lowerBinId,
      upperBinId,
      liquidityShares: posShares,
      lastUpdatedAt,
      totalClaimedFeeXAmount,
      totalClaimedFeeYAmount,
    } = position;

    const bins = this.getBinsBetweenLowerAndUpperBound(
      lbPair,
      lowerBinId,
      upperBinId,
      baseTokenDecimal,
      quoteTokenDecimal,
      lowerBinArray,
      upperBinArray
    );

    if (!bins.length) return null;

    /// assertion
    if (
      bins[0].binId !== lowerBinId ||
      bins[bins.length - 1].binId !== upperBinId
    )
      throw new Error("Bin ID mismatch");

    const positionData: PositionBinData[] = [];
    let totalXAmount = new Decimal(0);
    let totalYAmount = new Decimal(0);

    bins.forEach((bin, idx) => {
      const binSupply = new Decimal(bin.supply.toString());

      const posShare = new Decimal(posShares[idx].toString());
      const positionXAmount = binSupply.eq(new Decimal("0"))
        ? new Decimal("0")
        : posShare.mul(bin.xAmount.toString()).div(binSupply);
      const positionYAmount = binSupply.eq(new Decimal("0"))
        ? new Decimal("0")
        : posShare.mul(bin.yAmount.toString()).div(binSupply);

      totalXAmount = totalXAmount.add(positionXAmount);
      totalYAmount = totalYAmount.add(positionYAmount);

      positionData.push({
        binId: bin.binId,
        price: bin.price,
        pricePerToken: bin.pricePerToken,
        binXAmount: bin.xAmount.toString(),
        binYAmount: bin.yAmount.toString(),
        binLiquidity: binSupply.toString(),
        positionLiquidity: posShare.toString(),
        positionXAmount: positionXAmount.toString(),
        positionYAmount: positionYAmount.toString(),
      });
    });

    const { feeX, feeY } = this.getClaimableSwapFee(
      version,
      position,
      lowerBinArray,
      upperBinArray
    );
    const { rewardOne, rewardTwo } = this.getClaimableLMReward(
      version,
      lbPair,
      onChainTimestamp,
      position,
      lowerBinArray,
      upperBinArray
    );

    return {
      totalXAmount: totalXAmount.toString(),
      totalYAmount: totalYAmount.toString(),
      positionBinData: positionData,
      lastUpdatedAt,
      lowerBinId,
      upperBinId,
      feeX,
      feeY,
      rewardOne,
      rewardTwo,
      feeOwner,
      totalClaimedFeeXAmount,
      totalClaimedFeeYAmount,
    };
  }

  private static getBinsBetweenLowerAndUpperBound(
    lbPair: dlmm.lbPair,
    lowerBinId: number,
    upperBinId: number,
    baseTokenDecimal: number,
    quoteTokenDecimal: number,
    lowerBinArrays: dlmm.binArray,
    upperBinArrays: dlmm.binArray
  ): BinLiquidity[] {
    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const upperBinArrayIndex = binIdToBinArrayIndex(new BN(upperBinId));

    const bins: BinLiquidity[] = [];
    if (lowerBinArrayIndex.eq(upperBinArrayIndex)) {
      const binArray = lowerBinArrays;

      const [lowerBinIdForBinArray] = getBinArrayLowerUpperBinId(
        binArray.index
      );

      binArray.bins.forEach((bin, idx) => {
        const binId = lowerBinIdForBinArray.toNumber() + idx;

        if (binId >= lowerBinId && binId <= upperBinId) {
          const pricePerLamport = getPriceOfBinByBinId(
            binId,
            lbPair.binStep
          ).toString();
          bins.push({
            binId,
            xAmount: bin.amountX,
            yAmount: bin.amountY,
            supply: bin.liquiditySupply,
            price: pricePerLamport,
            version: binArray.version,
            pricePerToken: new Decimal(pricePerLamport)
              .mul(new Decimal(10 ** (baseTokenDecimal - quoteTokenDecimal)))
              .toString(),
          });
        }
      });
    } else {
      const binArrays = [lowerBinArrays, upperBinArrays];

      binArrays.forEach((binArray) => {
        const [lowerBinIdForBinArray] = getBinArrayLowerUpperBinId(
          binArray.index
        );
        binArray.bins.forEach((bin, idx) => {
          const binId = lowerBinIdForBinArray.toNumber() + idx;
          if (binId >= lowerBinId && binId <= upperBinId) {
            const pricePerLamport = getPriceOfBinByBinId(
              binId,
              lbPair.binStep
            ).toString();
            bins.push({
              binId,
              xAmount: bin.amountX,
              yAmount: bin.amountY,
              supply: bin.liquiditySupply,
              price: pricePerLamport,
              version: binArray.version,
              pricePerToken: new Decimal(pricePerLamport)
                .mul(new Decimal(10 ** (baseTokenDecimal - quoteTokenDecimal)))
                .toString(),
            });
          }
        });
      });
    }

    return bins;
  }
}
