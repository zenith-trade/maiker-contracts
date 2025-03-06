import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program, utils } from "@coral-xyz/anchor";
import { MaikerContracts } from "../target/types/maiker_contracts";
import { before, describe, test } from "node:test";
import assert from "assert";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Connection, VersionedTransaction, SYSVAR_RENT_PUBKEY, Transaction, sendAndConfirmTransaction, TransactionInstruction, AccountMeta } from "@solana/web3.js";
import { BanksClient, Clock } from "solana-bankrun";
import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, createMintToInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { maiker, maikerProgramId, dlmm, dlmmProgramId, maikerErrors, dlmmErrors, maikerInstructions, dlmmInstructions, maikerTypes, dlmmTypes, SHARE_PRECISION, getOrCreateBinArraysInstructions, DLMM_EVENT_AUTHORITY_PDA, initializePositionAndAddLiquidityByWeight } from "../clients/js/src";
import { simulateAndGetTxWithCUs } from "../clients/js/src/utils/buildTxAndCheckCu";
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction } from "@solana/spl-token";
import { MintLayout } from "@solana/spl-token";
import { BinAndAmount, BinArrayAccount, binIdToBinArrayIndex, calculateBidAskDistribution, calculateNormalDistribution, calculateSpotDistribution, deriveBinArray, deriveBinArrayBitmapExtension, getPriceOfBinByBinId, isOverflowDefaultBinArrayBitmap, LBCLMM_PROGRAM_IDS, LiquidityParameterByWeight, MAX_BIN_ARRAY_SIZE, toWeightDistribution } from "../dlmm-ts-client/src";
import DLMM, { deriveLbPair2, derivePresetParameter2, getOrCreateATAInstruction } from "../dlmm-ts-client/src";
import { readFileSync } from "fs";
import path from "path";

const PROGRAM_BIN_DIR = path.join(__dirname, "..", ".programsBin");

const INITIAL_SOL = 5000 * LAMPORTS_PER_SOL;
const USE_BANKRUN = true;

const RPC_URL = "http://localhost:8899";
const connection = new Connection(RPC_URL);

/// --- KEYPAIRS
const master = Keypair.generate()
const creator = Keypair.generate()
const user = Keypair.generate()
const admin = Keypair.generate()

/// --- PROVIDERS
let bankrunProvider: BankrunProvider;

/// METEORA DLMM
const DEFAULT_ACTIVE_ID = new BN(5660);
const DEFAULT_BIN_STEP = new BN(10);
const DEFAULT_BASE_FACTOR = new BN(10000);

const [presetParamPda] = derivePresetParameter2(
  DEFAULT_BIN_STEP,
  DEFAULT_BASE_FACTOR,
  new PublicKey(LBCLMM_PROGRAM_IDS["mainnet-beta"])
);

const loadProviders = async () => {
  // process.env.ANCHOR_WALLET = "../keypairs/pump_test.json";

  const bankrunContext = await startAnchor(
    "./",
    [],
    [
      // DLMM Program
      {
        address: new PublicKey(LBCLMM_PROGRAM_IDS["mainnet-beta"]),
        info: await loadProgram(getBinFilePath("dlmm.so")),
      },
      // preset_parameter account
      {
        address: presetParamPda,
        info: {
          lamports: INITIAL_SOL,
          executable: false,
          data: readFileSync(getBinFilePath("preset_parameter.bin")),
          owner: new PublicKey(LBCLMM_PROGRAM_IDS["mainnet-beta"]),
        },
      },
      // Funding test keypairs
      {
        address: master.publicKey,
        info: {
          lamports: INITIAL_SOL,
          executable: false,
          data: Buffer.from([]),
          owner: SystemProgram.programId,
        },
      },
      {
        address: creator.publicKey,
        info: {
          lamports: INITIAL_SOL,
          executable: false,
          data: Buffer.from([]),
          owner: SystemProgram.programId,
        },
      },
      {
        address: user.publicKey,
        info: {
          lamports: INITIAL_SOL,
          executable: false,
          data: Buffer.from([]),
          owner: SystemProgram.programId,
        },
      },
      {
        address: admin.publicKey,
        info: {
          lamports: INITIAL_SOL,
          executable: false,
          data: Buffer.from([]),
          owner: SystemProgram.programId,
        },
      },
    ]
  );
  bankrunProvider = new BankrunProvider(bankrunContext);
};

function getBinFilePath(programBinary: string) {
  return path.join(PROGRAM_BIN_DIR, programBinary);
}

export const loadProgram = async (binPath: string) => {
  const programBytes = readFileSync(binPath);
  const executableAccount = {
    lamports: INITIAL_SOL,
    executable: true,
    owner: new PublicKey("BPFLoader2111111111111111111111111111111111"),
    data: programBytes,
  };
  return executableAccount;
};

async function getLatestBlockhash() {
  if (USE_BANKRUN) {
    return await bankrunProvider.context.banksClient.getLatestBlockhash();
  } else {
    return await connection.getLatestBlockhash();
  }
}

async function processTransaction(tx: VersionedTransaction) {
  if (USE_BANKRUN) {
    const res = await bankrunProvider.context.banksClient.processTransaction(tx);
    return res
  } else {
    return await connection.sendTransaction(tx);
  }
}

const getBalance = async (pubkey: PublicKey) => {
  if (USE_BANKRUN) {
    const balance = await bankrunProvider.context.banksClient.getBalance(pubkey);
    return balance;
  } else {
    const balance = await connection.getBalance(pubkey);
    return balance;
  }
};

const getTokenAcc = async (pubkey: PublicKey) => {
  if (USE_BANKRUN) {
    const accInfo = await bankrunProvider.context.banksClient.getAccount(pubkey);
    const tokenAcc = AccountLayout.decode(accInfo?.data || Buffer.from([]));
    return tokenAcc;
  } else {
    const accInfo = await connection.getAccountInfo(
      pubkey
    );
    const tokenAcc = AccountLayout.decode(accInfo.data || Buffer.from([]));
    return tokenAcc;
  }
};

/**
 * Create a new SPL token mint
 * @param connection Connection to use
 * @param payer Payer of the transaction and initialization fees
 * @param mintAuthority Account or multisig that will control minting
 * @param freezeAuthority Optional account or multisig that can freeze token accounts
 * @param decimals Number of decimals in token account amounts
 * @returns Public key of the newly created mint
 */
async function createMint(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null,
  decimals: number
): Promise<PublicKey> {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Create token mint account
  const lamports = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
  );

  // Instruction to create the mint account
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint,
    lamports,
    space: MintLayout.span,
    programId: TOKEN_PROGRAM_ID,
  });

  // Instruction to initialize the mint
  const initMintInstruction = createInitializeMintInstruction(
    mint,
    decimals,
    mintAuthority,
    freezeAuthority,
    TOKEN_PROGRAM_ID
  );

  const blockhash = await getLatestBlockhash();

  const builtTx = await simulateAndGetTxWithCUs({
    connection,
    payerPublicKey: payer.publicKey,
    lookupTableAccounts: [],
    ixs: [createAccountInstruction, initMintInstruction],
    recentBlockhash: blockhash[0],
  });

  // Process the transaction
  await processTransaction(builtTx.tx);

  return mint;
}

// Function to check if a value is within 1% of expected
const isWithinOnePercent = (actual: bigint, expected: bigint): boolean => {
  const difference = actual > expected
    ? actual - expected
    : expected - actual;

  const onePercent = expected / BigInt(100);
  return difference <= onePercent;
}

describe("maiker-contracts", () => {
  let xMint: PublicKey;
  let yMint: PublicKey;
  let lbPairPubkey: PublicKey;
  let lbPairAcc: dlmm.lbPair;

  let dlmmInstance: DLMM;

  before(async () => {
    await loadProviders();

    // Create Mints
    xMint = await createMint(bankrunProvider.connection, creator, creator.publicKey, creator.publicKey, 6);
    yMint = await createMint(bankrunProvider.connection, creator, creator.publicKey, creator.publicKey, 6);

    // Mint to user
    const preIxs = [];

    const [xUser, yUser] = await Promise.all([
      getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, user.publicKey, true),
      getOrCreateATAInstruction(bankrunProvider.connection, yMint, user.publicKey, user.publicKey, true),
    ]);

    xUser.ix && preIxs.push(xUser.ix);
    yUser.ix && preIxs.push(yUser.ix);


    const mintXToUserIx = createMintToInstruction(xMint, xUser.ataPubKey, creator.publicKey, 1000000000000000); // 1B
    const mintYToUserIx = createMintToInstruction(yMint, yUser.ataPubKey, creator.publicKey, 1000000000000000); // 1B

    let blockhash = await getLatestBlockhash();
    let builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...preIxs, mintXToUserIx, mintYToUserIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    let userTokenX = await getTokenAcc(xUser.ataPubKey);
    let userTokenY = await getTokenAcc(yUser.ataPubKey);

    assert(userTokenX.amount.toString() === "1000000000000000", `userTokenX.amount: ${userTokenX.amount} !== 1000000000000000`);
    assert(userTokenY.amount.toString() === "1000000000000000", `userTokenY.amount: ${userTokenY.amount} !== 1000000000000000`);

    // Create DLMM LbPair
    [lbPairPubkey] = deriveLbPair2(
      xMint,
      yMint,
      DEFAULT_BIN_STEP,
      DEFAULT_BASE_FACTOR,
      new PublicKey(LBCLMM_PROGRAM_IDS["mainnet-beta"])
    );

    // console.log("lbPairPubkey: ", lbPairPubkey.toBase58());
    // console.log("presetParamPda: ", presetParamPda.toBase58());

    const tx = await DLMM.createLbPair(
      bankrunProvider.connection,
      master.publicKey,
      xMint,
      yMint,
      new BN(DEFAULT_BIN_STEP),
      new BN(DEFAULT_BASE_FACTOR),
      presetParamPda,
      DEFAULT_ACTIVE_ID,
      {
        programId: new PublicKey(LBCLMM_PROGRAM_IDS["mainnet-beta"]),
      }
    )

    tx.feePayer = master.publicKey;
    tx.recentBlockhash = blockhash[0];
    tx.sign(master);

    // Normal localhost impl not working because dlmm-sdk gives us legacy Transaction object
    await bankrunProvider.context.banksClient.processTransaction(tx);

    // This is made possible because of a change in the dlmm-ts-client to replace getMultipleAccountsInfo with getAccountInfo Promise.all()
    dlmmInstance = await DLMM.create(bankrunProvider.connection, lbPairPubkey);
    lbPairAcc = dlmmInstance.lbPair as dlmm.lbPair;

    // lbPairAcc = await dlmm.lbPair.fetch(bankrunProvider.connection, lbPairPubkey);
    // console.log("lbPairAcc: ", lbPairAcc);

    const activeBin = lbPairAcc.activeId
    const lowerBinId = activeBin - Number(MAX_BIN_ARRAY_SIZE) / 2;
    const upperBinId = lowerBinId + Number(MAX_BIN_ARRAY_SIZE) - 1;

    // Initialize External Position and Add Liquidity -> Required so our strategy can swap initially
    const pos = Keypair.generate();

    const binIds = Array.from(
      { length: upperBinId - lowerBinId + 1 },
      (_, i) => lowerBinId + i
    );

    const SpotDistribution: BinAndAmount[] = calculateSpotDistribution(activeBin, binIds);

    // const bidAskDistribution: BinAndAmount[] = calculateBidAskDistribution(activeBin, binIds);
    // console.log("Bid Ask Distribution: ", bidAskDistribution);
    // const normalDistribution: BinAndAmount[] = calculateNormalDistribution(activeBin, binIds);
    // console.log("Normal Distribution: ", normalDistribution);

    // console.log("xYAmountDistribution: ", xYAmountDistribution);
    // console.log("first bin: ", xYAmountDistribution[0].yAmountBpsOfTotal.toString()); // 281 bps per bin
    // console.log("last bin: ", xYAmountDistribution[xYAmountDistribution.length - 1].xAmountBpsOfTotal.toString()); // 289 bps per bin

    const totalXAmount = 500000000000000; // 500M
    const totalYAmount = 500000000000000; // 500M

    const ixs = await initializePositionAndAddLiquidityByWeight({
      connection: bankrunProvider.connection,
      lbPairPubkey,
      lbPair: lbPairAcc,
      positionPubKey: pos.publicKey,
      totalXAmount: new BN(totalXAmount),
      totalYAmount: new BN(totalYAmount),
      lowerBinId: lowerBinId,
      upperBinId: upperBinId,
      xYAmountDistribution: SpotDistribution,
      user: user.publicKey,
    })

    // console.log("Instructions: ", ixs);

    if (ixs.preInstructions && ixs.preInstructions.length > 0) {
      console.log("Executing pre instructions");

      blockhash = await getLatestBlockhash();
      builtTx = await simulateAndGetTxWithCUs({
        connection: bankrunProvider.connection,
        payerPublicKey: user.publicKey,
        lookupTableAccounts: [],
        ixs: [...ixs.preInstructions],
        recentBlockhash: blockhash[0],
      });

      await processTransaction(builtTx.tx);
    }

    blockhash = await getLatestBlockhash();
    builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...ixs.mainInstructions],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    if (ixs.postInstructions && ixs.postInstructions.length > 0) {
      console.log("Executing post instructions");
      blockhash = await getLatestBlockhash();
      builtTx = await simulateAndGetTxWithCUs({
        connection: bankrunProvider.connection,
        payerPublicKey: user.publicKey,
        lookupTableAccounts: [],
        ixs: [...ixs.postInstructions],
        recentBlockhash: blockhash[0],
      });

      await processTransaction(builtTx.tx);
    }

    await dlmmInstance.refetchStates();
    const price = getPriceOfBinByBinId(lbPairAcc.activeId, lbPairAcc.binStep);

    // price seems to always have 9 decimals -> So we have to divide by 1000 to get to per y token price with 6 decimals
    console.log("price per y token: ", (price.toNumber() / 1000).toFixed(10));

    userTokenX = await getTokenAcc(xUser.ataPubKey);
    userTokenY = await getTokenAcc(yUser.ataPubKey);

    const reserveX = await getTokenAcc(dlmmInstance.lbPair.reserveX);
    const reserveY = await getTokenAcc(dlmmInstance.lbPair.reserveY);

    console.log("reserveX: ", reserveX.amount.toString()); // 144M
    console.log("reserveY: ", reserveY.amount.toString()); // 500M

    console.log("userTokenX: ", userTokenX.amount.toString()); // 856M Remaining
    console.log("userTokenY: ", userTokenY.amount.toString()); // 500M used as intended

    // Why are not all the tokens being used???
    // Answer: The price is not 1:1 -> The price is 286 x per y -> Therefore 500M * 0.286 = 143M is used -> Total position value is 143M * 2 = 286M xToken
    // Note: reserveX = reserveY * price / 10 * ^4

    // Assert Position Value
    const initialTotalSupplyMinted = 1000000000000000; // 1B
    const expectedAmountX = initialTotalSupplyMinted - Number(reserveX.amount)
    const expectedAmountY = initialTotalSupplyMinted - Number(reserveY.amount)
    assert(isWithinOnePercent(userTokenX.amount, BigInt(expectedAmountX)), `userTokenX.amount: ${userTokenX.amount} !== ${expectedAmountX}`);
    assert(isWithinOnePercent(userTokenY.amount, BigInt(expectedAmountY)), `userTokenY.amount: ${userTokenY.amount} !== ${expectedAmountY}`);
  });

  // // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.env());
  // const program = anchor.workspace.MaikerContracts as Program<MaikerContracts>;

  const globalConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("global-config")],
    maikerProgramId.PROGRAM_ID
  )[0];

  const strategy = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy-config"), creator.publicKey.toBuffer()],
    maikerProgramId.PROGRAM_ID
  )[0];

  test("Is initialized!", async () => {
    const initializeIx = maikerInstructions.initialize(
      {
        globalConfigArgs: {
          performanceFeeBps: 2000,
          withdrawalFeeBps: 150,
          intervalSeconds: new BN(60 * 60), // 1 hour
          treasury: master.publicKey,
          admin: master.publicKey,
          newAdmin: null,
        },
      },
      {
        admin: master.publicKey,
        globalConfig: globalConfig,
        systemProgram: SystemProgram.programId,
      },
    );

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: master.publicKey,
      lookupTableAccounts: [],
      ixs: [initializeIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    const globalConfigAcc = await maiker.GlobalConfig.fetch(bankrunProvider.connection, globalConfig);
    console.log("globalConfig: ", globalConfigAcc);
  });

  test("Create strategy", async () => {
    const preIxs = [];

    // Vaults
    const [xVault, yVault] = await Promise.all([
      getOrCreateATAInstruction(bankrunProvider.connection, xMint, strategy, creator.publicKey, true),
      getOrCreateATAInstruction(bankrunProvider.connection, yMint, strategy, creator.publicKey, true),
    ]);

    // Create Native Mint SOL ATA for sol escrow
    xVault.ix && preIxs.push(xVault.ix);
    yVault.ix && preIxs.push(yVault.ix);

    const createStrategyIx = maikerInstructions.createStrategy(
      {
        creator: creator.publicKey,
        xMint: xMint,
        yMint: yMint,
        xVault: xVault.ataPubKey,
        yVault: yVault.ataPubKey,
        strategy: strategy,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    );

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: creator.publicKey,
      lookupTableAccounts: [],
      ixs: [...preIxs, createStrategyIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    const strategyAcc = await maiker.StrategyConfig.fetch(bankrunProvider.connection, strategy);
    console.log("strategy: ", strategyAcc);
  });

  test("Deposit", async () => {
    const xAmount = 1000000000000; // 1M

    const userPosition = PublicKey.findProgramAddressSync(
      [Buffer.from("user-position"), user.publicKey.toBuffer(), strategy.toBuffer()],
      maikerProgramId.PROGRAM_ID
    )[0];

    const preIxs = [];

    // User Ata
    const xUser = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, user.publicKey, true);

    xUser.ix && preIxs.push(xUser.ix);

    // Vaults
    const xVault = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, strategy, creator.publicKey, true);

    const depositIx = maikerInstructions.deposit(
      {
        amount: new BN(xAmount),
      },
      {
        user: user.publicKey,
        strategy: strategy,
        globalConfig: globalConfig,
        userPosition: userPosition,
        userTokenX: xUser.ataPubKey,
        strategyVaultX: xVault.ataPubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    );

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...preIxs, depositIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    const strategyAcc = await maiker.StrategyConfig.fetch(bankrunProvider.connection, strategy);
    assert(Number(strategyAcc.strategyShares) === xAmount, `strategyShares: ${strategyAcc.strategyShares} !== ${xAmount}`);

    const userPositionAcc = await maiker.UserPosition.fetch(bankrunProvider.connection, userPosition);
    assert(Number(userPositionAcc.strategyShare) === xAmount, `userPositionAcc.strategyShare: ${userPositionAcc.strategyShare} !== ${xAmount}`);
    assert(Number(userPositionAcc.lastShareValue) === SHARE_PRECISION, `userPositionAcc.lastShareValue: ${userPositionAcc.lastShareValue} !== ${SHARE_PRECISION}`);

    const xVaultTokenAcc = await getTokenAcc(xVault.ataPubKey);
    assert(Number(xVaultTokenAcc.amount) === xAmount, `xVaultTokenAcc.amount: ${xVaultTokenAcc.amount} !== ${xAmount}`);
  });

  test("Withdraw", async () => {
    const sharesAmount = 100000000000; // 10k

    const userPosition = PublicKey.findProgramAddressSync(
      [Buffer.from("user-position"), user.publicKey.toBuffer(), strategy.toBuffer()],
      maikerProgramId.PROGRAM_ID
    )[0];

    const pendingWithdrawal = PublicKey.findProgramAddressSync(
      [Buffer.from("pending-withdrawal"), user.publicKey.toBuffer(), strategy.toBuffer()],
      maikerProgramId.PROGRAM_ID
    )[0];

    const userPositionAccPre = await maiker.UserPosition.fetch(bankrunProvider.connection, userPosition);

    const [xVault, yVault] = await Promise.all([
      getOrCreateATAInstruction(bankrunProvider.connection, xMint, strategy, creator.publicKey, true),
      getOrCreateATAInstruction(bankrunProvider.connection, yMint, strategy, creator.publicKey, true),
    ]);

    // Initiate withdrawal
    const withdrawIx = maikerInstructions.initiateWithdrawal(
      {
        sharesAmount: new BN(sharesAmount),
      },
      {
        user: user.publicKey,
        strategy: strategy,
        globalConfig: globalConfig,
        userPosition: userPosition,
        pendingWithdrawal: pendingWithdrawal,
        strategyVaultX: xVault.ataPubKey,
        systemProgram: SystemProgram.programId,
      }
    );

    let blockhash = await getLatestBlockhash();
    let builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [withdrawIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    const userPositionAcc = await maiker.UserPosition.fetch(bankrunProvider.connection, userPosition);
    const pendingWithdrawalAcc = await maiker.PendingWithdrawal.fetch(bankrunProvider.connection, pendingWithdrawal);
    const strategyAcc = await maiker.StrategyConfig.fetch(bankrunProvider.connection, strategy);
    const globalConfigAcc = await maiker.GlobalConfig.fetch(bankrunProvider.connection, globalConfig);

    // console.log("Initiation timestamp: ", new Date(Number(pendingWithdrawalAcc.initiationTimestamp) * 1000).toISOString());
    // console.log("Available timestamp: ", new Date(Number(pendingWithdrawalAcc.availableTimestamp) * 1000).toISOString());

    assert(Number(userPositionAcc.strategyShare) === Number(userPositionAccPre.strategyShare) - sharesAmount, `userPositionAcc.strategyShare: ${userPositionAcc.strategyShare} !== ${userPositionAccPre.strategyShare} - ${sharesAmount}`);

    // Note: Apply the withdraw fee bps to assertion
    const widthawFeeShare = sharesAmount * (globalConfigAcc.withdrawalFeeBps / 10000);
    assert(Number(pendingWithdrawalAcc.sharesAmount) === sharesAmount - widthawFeeShare, `pendingWithdrawalAcc.sharesAmount: ${pendingWithdrawalAcc.sharesAmount} !== ${sharesAmount - widthawFeeShare}`);
    assert(Number(pendingWithdrawalAcc.tokenAmount) === sharesAmount - widthawFeeShare, `pendingWithdrawalAcc.tokenAmount: ${pendingWithdrawalAcc.tokenAmount} !== ${sharesAmount - widthawFeeShare}`);

    assert(Number(strategyAcc.feeShares) === widthawFeeShare, `strategyAcc.feeShares: ${strategyAcc.feeShares} !== ${widthawFeeShare}`);

    // Try claim withdrawal prematurely
    const xUser = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, user.publicKey, true);

    let claimIx = maikerInstructions.processWithdrawal(
      {
        user: user.publicKey,
        strategy: strategy,
        globalConfig: globalConfig,
        pendingWithdrawal: pendingWithdrawal,
        strategyVaultX: xVault.ataPubKey,
        userTokenX: xUser.ataPubKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    );

    blockhash = await getLatestBlockhash();
    builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [claimIx],
      recentBlockhash: blockhash[0],
    });

    try {
      await processTransaction(builtTx.tx);
      assert(false, "Should have failed");
    } catch (e) {
      console.log("Failed successfully");
    }

    // Warp in time
    let slot = await bankrunProvider.context.banksClient.getSlot();
    // Need to warp slot to ensure new blockhash
    bankrunProvider.context.warpToSlot(slot + BigInt(2000000));
    // Need to warp timestamp extra for on-chain timestamp
    bankrunProvider.context.setClock(new Clock(BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(Number(pendingWithdrawalAcc.availableTimestamp) + 60)));

    blockhash = await getLatestBlockhash();
    builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [claimIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    try {
      await maiker.PendingWithdrawal.fetch(bankrunProvider.connection, pendingWithdrawal);
      assert(false, "Should have failed");
    } catch (e) {
      console.log("Failed successfully");
    }
  });

  test("Add Position", async () => {
    // TODO: For later we need a helper function in our client that can handle the entire rebalancing step.
    // Check addLiquidityByWeight of dlmm-ts-client as reference.
    // It should just take in the strategy pubkey, totalXAmount, totalYAmount, and xYAmountDistribution.
    // It should then handle setting up 1) positions 2) bin arrays 3) and adding of liquidity
    // All required instruction can be returned by that function

    // Before that there need to be 2 more steps:
    // 1) Remove all liquidity for all positions
    // 2) Rebalance through swapping

    // Need to swap xMint first
    const swapInputAmount = 1_000_000_000; // 1000 tokens

    const [xVault, yVault] = await Promise.all([
      getOrCreateATAInstruction(bankrunProvider.connection, xMint, strategy, creator.publicKey, true),
      getOrCreateATAInstruction(bankrunProvider.connection, yMint, strategy, creator.publicKey, true),
    ]);

    let activeBin = lbPairAcc.activeId
    console.log("Active Bin pre swap: ", activeBin);

    const activeBinArrayIdx = binIdToBinArrayIndex(
      new BN(activeBin)
    );

    const [activeBinArray] = deriveBinArray(
      lbPairPubkey,
      activeBinArrayIdx,
      dlmmProgramId.PROGRAM_ID
    );

    const activeBinArrayMeta: AccountMeta = {
      isSigner: false,
      isWritable: true,
      pubkey: activeBinArray,
    };

    const xVaultTokenAccPre = await getTokenAcc(xVault.ataPubKey);
    const yVaultTokenAccPre = await getTokenAcc(yVault.ataPubKey);

    console.log("xVaultTokenAccPre: ", xVaultTokenAccPre.amount.toString()); // 901_500_000_000
    console.log("yVaultTokenAccPre: ", yVaultTokenAccPre.amount.toString()); // 0

    // Doesn't work with bankrun
    // const binArrays = await dlmmInstance.getBinArrays();
    // const swapQuote = dlmmInstance.swapQuote(
    //   new BN(swapInputAmount),
    //   true,
    //   new BN(100),
    //   binArrays
    // );
    // console.log("Swap quote: ", swapQuote);

    const swapIx = maikerInstructions.swapExactIn(
      {
        amountIn: new BN(swapInputAmount),
        minAmountOut: new BN(0), // Irrelevant for test
        xToY: true,
      },
      {
        authority: master.publicKey,
        globalConfig: globalConfig,
        strategy: strategy,
        lbPair: lbPairPubkey,
        binArrayBitmapExtension: dlmmProgramId.PROGRAM_ID, // We know it's not required here in test
        reserveX: lbPairAcc.reserveX,
        reserveY: lbPairAcc.reserveY,
        /** The strategy vault for token X, which will be used for swapping */
        strategyVaultX: xVault.ataPubKey,
        /** The strategy vault for token Y, which will be used for swapping */
        strategyVaultY: yVault.ataPubKey,
        tokenXMint: xMint,
        tokenYMint: yMint,
        oracle: lbPairAcc.oracle,
        hostFeeIn: dlmmProgramId.PROGRAM_ID,
        /** The lb_clmm program */
        lbClmmProgram: dlmmProgramId.PROGRAM_ID,
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        /** The token program for token X */
        tokenXProgram: TOKEN_PROGRAM_ID,
        /** The token program for token Y */
        tokenYProgram: TOKEN_PROGRAM_ID
      }
    )

    // Remaining accounts pushed directly
    swapIx.keys.push(activeBinArrayMeta);

    // Build tx
    let blockhash = await getLatestBlockhash();
    let builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [swapIx],
      recentBlockhash: blockhash[0],
    })

    await processTransaction(builtTx.tx);

    const xVaultTokenAcc = await getTokenAcc(xVault.ataPubKey);
    const yVaultTokenAcc = await getTokenAcc(yVault.ataPubKey);

    console.log("xVaultTokenAcc: ", xVaultTokenAcc.amount.toString());
    console.log("yVaultTokenAcc: ", yVaultTokenAcc.amount.toString());

    assert(Number(xVaultTokenAcc.amount) === Number(xVaultTokenAccPre.amount) - swapInputAmount, `xVaultTokenAcc.amount: ${xVaultTokenAcc.amount} !== ${xVaultTokenAccPre.amount} - ${swapInputAmount}`);

    // We want to deposit 1000 tokens in total for both x and y
    const totalXAmount = new BN(1000_000_000); // 1000 - should match since that was the amount we've swapped with
    const totalYAmount = new BN(Number(yVaultTokenAcc.amount)); // Total Y in vault

    lbPairAcc = await dlmm.lbPair.fetch(bankrunProvider.connection, lbPairPubkey);
    activeBin = lbPairAcc.activeId;
    console.log("Active Bin post swap: ", activeBin);

    const lowerBinId = activeBin - Number(MAX_BIN_ARRAY_SIZE) / 2; // Put liquidity equal around active bin
    const upperBinId = lowerBinId + Number(MAX_BIN_ARRAY_SIZE) - 1; // Only plus 69

    console.log("activeBin: ", activeBin);
    console.log("lowerBinId: ", lowerBinId);
    console.log("upperBinId: ", upperBinId);

    // Initialize position Ix
    const newPosition = Keypair.generate();
    console.log("New Position Pubkey: ", newPosition.publicKey.toBase58());

    const initPositionIx = maikerInstructions.initializePosition(
      {
        lowerBinId: lowerBinId,
        width: Number(MAX_BIN_ARRAY_SIZE), // 70
      },
      {
        authority: master.publicKey, // Admin to do rebalancing
        globalConfig: globalConfig,
        strategy: strategy,
        position: newPosition.publicKey,
        lbPair: lbPairPubkey,
        lbClmmProgram: new PublicKey(LBCLMM_PROGRAM_IDS["mainnet-beta"]),
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    )

    // Build tx
    blockhash = await getLatestBlockhash();
    builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [initPositionIx],
      recentBlockhash: blockhash[0],
    })

    // Need to sign the tx with the new position
    builtTx.tx.sign([newPosition]);
    await processTransaction(builtTx.tx);

    // Assert
    const strategyAcc = await maiker.StrategyConfig.fetch(bankrunProvider.connection, strategy);

    assert(strategyAcc.positionCount === 1, `strategyAcc.positionCount: ${strategyAcc.positionCount} !== 1`);
    assert(strategyAcc.positions[0].toBase58() === newPosition.publicKey.toBase58(), `strategyAcc.positions[0]: ${strategyAcc.positions[0].toString()} !== ${newPosition.publicKey.toString()}`);

    // Add liquidity Ix
    const preIxsAddLiquidity = [];

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const upperBinArrayIndex = binIdToBinArrayIndex(new BN(upperBinId));

    // Check if binArrays need to be initialized
    const { instructions, lowerBinArray, upperBinArray } = await getOrCreateBinArraysInstructions(bankrunProvider.connection, lbPairPubkey, new BN(lowerBinArrayIndex), new BN(upperBinArrayIndex), master.publicKey);
    instructions.length > 0 && preIxsAddLiquidity.push(...instructions);

    // console.log("binArray Lower: ", lowerBinArray.toBase58(), "binArray Upper: ", upperBinArray.toBase58());

    // Check if extension is required
    const useExtension =
      isOverflowDefaultBinArrayBitmap(lowerBinArrayIndex) ||
      isOverflowDefaultBinArrayBitmap(upperBinArrayIndex);

    // console.log("Use extension: ", useExtension);

    const binArrayBitmapExtension = useExtension
      ? deriveBinArrayBitmapExtension(lbPairPubkey, dlmmProgramId.PROGRAM_ID)[0]
      : null;

    // console.log("binArrayBitmapExtension: ", binArrayBitmapExtension);

    // @0xyaya here you would calculate the desired distribution. Right now equal distribution (spot).
    const binIds = Array.from(
      { length: upperBinId - lowerBinId + 1 },
      (_, i) => lowerBinId + i
    );
    // console.log("Bin IDs: ", binIds);

    const xYAmountDistribution: BinAndAmount[] = calculateSpotDistribution(activeBin, binIds)
    // console.log("xYAmountDistribution: ", xYAmountDistribution);

    const binLiquidityDist =
      toWeightDistribution(
        totalXAmount,
        totalYAmount,
        xYAmountDistribution.map((item) => ({
          binId: item.binId,
          xAmountBpsOfTotal: item.xAmountBpsOfTotal,
          yAmountBpsOfTotal: item.yAmountBpsOfTotal,
        })),
        lbPairAcc.binStep
      );

    if (binLiquidityDist.length === 0) {
      throw new Error("No liquidity to add");
    }

    const liquidityParams = {
      amountX: totalXAmount,
      amountY: totalYAmount,
      binLiquidityDist: binLiquidityDist,
      activeId: lbPairAcc.activeId,
      maxActiveBinSlippage: 0,
    };

    const addLiquidityIx = maikerInstructions.addLiquidity(
      {
        liquidityParameter: liquidityParams,
      },
      {
        position: newPosition.publicKey,
        authority: master.publicKey,
        globalConfig: globalConfig,
        strategy: strategy,
        lbPair: lbPairPubkey,
        tokenXMint: xMint,
        tokenYMint: yMint,
        strategyVaultX: xVault.ataPubKey,
        strategyVaultY: yVault.ataPubKey,
        reserveX: lbPairAcc.reserveX,
        reserveY: lbPairAcc.reserveY,
        binArrayLower: lowerBinArray,
        binArrayUpper: upperBinArray,
        binArrayBitmapExtension: binArrayBitmapExtension || maikerProgramId.PROGRAM_ID, // Optional accounts have to be replaced with the program ID
        lbClmmProgram: new PublicKey(LBCLMM_PROGRAM_IDS["mainnet-beta"]),
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }
    )

    // Build tx
    blockhash = await getLatestBlockhash();
    builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...preIxsAddLiquidity, addLiquidityIx],
      recentBlockhash: blockhash[0],
    })

    await processTransaction(builtTx.tx);

    // Assert
    const xVaultTokenAccPost = await getTokenAcc(xVault.ataPubKey);
    const yVaultTokenAccPost = await getTokenAcc(yVault.ataPubKey);

    console.log("xVaultTokenAccPost: ", xVaultTokenAccPost.amount.toString());
    console.log("yVaultTokenAccPost: ", yVaultTokenAccPost.amount.toString());

    const xVaultBalanceDiff = Math.abs(Number(xVaultTokenAccPost.amount) - Number(xVaultTokenAcc.amount));
    const yVaultBalanceDiff = Math.abs(Number(yVaultTokenAccPost.amount) - Number(yVaultTokenAcc.amount));
    console.log("xVault Balance diff: ", xVaultBalanceDiff);
    console.log("yVault Balance diff: ", yVaultBalanceDiff);

    assert(isWithinOnePercent(BigInt(xVaultBalanceDiff), BigInt(totalXAmount.toNumber())), `xVaultBalanceDiff: ${xVaultBalanceDiff} !== ${totalXAmount}`);
    assert(isWithinOnePercent(BigInt(yVaultBalanceDiff), BigInt(totalYAmount.toNumber())), `yVaultBalanceDiff: ${yVaultBalanceDiff} !== ${totalYAmount}`);
  })

  test("Deposit and withdraw without setting position value first ", async () => {
    const xAmount = 1000000000000; // 1M

    const userPosition = PublicKey.findProgramAddressSync(
      [Buffer.from("user-position"), user.publicKey.toBuffer(), strategy.toBuffer()],
      maikerProgramId.PROGRAM_ID
    )[0];

    const preIxs = [];

    // User Ata
    const xUser = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, user.publicKey, true);

    xUser.ix && preIxs.push(xUser.ix);

    // Vaults
    const xVault = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, strategy, creator.publicKey, true);

    const depositIx = maikerInstructions.deposit(
      {
        amount: new BN(xAmount),
      },
      {
        user: user.publicKey,
        strategy: strategy,
        globalConfig: globalConfig,
        userPosition: userPosition,
        userTokenX: xUser.ataPubKey,
        strategyVaultX: xVault.ataPubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    );

    let blockhash = await getLatestBlockhash();
    let builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...preIxs, depositIx],
      recentBlockhash: blockhash[0],
    });

    try {
      await processTransaction(builtTx.tx);
      assert(false, "Should not be able to deposit without setting position value first");
    } catch (error) {
      console.log("Failed to deposit successfully");
    }

    // Try to Initiate withdrawal
    const pendingWithdrawal = PublicKey.findProgramAddressSync(
      [Buffer.from("pending-withdrawal"), user.publicKey.toBuffer(), strategy.toBuffer()],
      maikerProgramId.PROGRAM_ID
    )[0];

    const withdrawIx = maikerInstructions.initiateWithdrawal(
      {
        sharesAmount: new BN(1000),
      },
      {
        user: user.publicKey,
        strategy: strategy,
        globalConfig: globalConfig,
        userPosition: userPosition,
        pendingWithdrawal: pendingWithdrawal,
        strategyVaultX: xVault.ataPubKey,
        systemProgram: SystemProgram.programId,
      }
    );

    blockhash = await getLatestBlockhash();
    builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [withdrawIx],
      recentBlockhash: blockhash[0],
    });

    try {
      await processTransaction(builtTx.tx);
      assert(false, "Should not be able to withdraw without setting position value first");
    } catch (error) {
      console.log("Failed to withdraw successfully");
    }
  });

  test("Get Position Value and deposit", async () => {
    lbPairAcc = await dlmm.lbPair.fetch(bankrunProvider.connection, lbPairPubkey);

    const activeBin = lbPairAcc.activeId;

    const userPosition = PublicKey.findProgramAddressSync(
      [Buffer.from("user-position"), user.publicKey.toBuffer(), strategy.toBuffer()],
      maikerProgramId.PROGRAM_ID
    )[0];

    const strategyAccPre = await maiker.StrategyConfig.fetch(bankrunProvider.connection, strategy);
    const userPositionAccPre = await maiker.UserPosition.fetch(bankrunProvider.connection, userPosition);
    console.log("userPositionAccPre lastShareValue: ", userPositionAccPre.lastShareValue.toString());

    const position = strategyAccPre.positions[0];

    const price = getPriceOfBinByBinId(activeBin, lbPairAcc.binStep);
    console.log("price: ", price);

    await dlmmInstance.refetchStates();
    const positionInfo = await dlmmInstance.getPosition(position);
    console.log("positionInfo: ", positionInfo);

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(positionInfo.positionData.lowerBinId));
    const upperBinArrayIndex = binIdToBinArrayIndex(new BN(positionInfo.positionData.upperBinId));

    const { lowerBinArray, upperBinArray } = await getOrCreateBinArraysInstructions(bankrunProvider.connection, lbPairPubkey, new BN(lowerBinArrayIndex), new BN(upperBinArrayIndex), master.publicKey);

    const getPositionValueIx = maikerInstructions.getPositionValue(
      {
        position: position,
        strategy: strategy,
        lbPair: lbPairPubkey,
        binArrayLower: lowerBinArray,
        binArrayUpper: upperBinArray,
        user: user.publicKey,
      }
    )

    // Deposit
    const xAmount = 100_000_000_000; // 100k

    const xUser = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, user.publicKey, true);

    const depositIx = maikerInstructions.deposit(
      {
        amount: new BN(xAmount),
      },
      {
        user: user.publicKey,
        strategy: strategy,
        globalConfig: globalConfig,
        userPosition: userPosition,
        userTokenX: xUser.ataPubKey,
        strategyVaultX: strategyAccPre.xVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    );

    // Build tx
    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [getPositionValueIx, depositIx],
      recentBlockhash: blockhash[0],
    })

    await processTransaction(builtTx.tx);

    const strategyAccPost = await maiker.StrategyConfig.fetch(bankrunProvider.connection, strategy);
    // console.log("strategyAccPost: ", strategyAccPost.positionsValues[0].toString());

    // All within client library
    // TODO: Create helper function to calculate position value as well as total strategy value
    // TODO: Create helper function to calculate share value
    const positionValue = Math.round(Number(positionInfo.positionData.totalXAmount) + Number(positionInfo.positionData.totalYAmount) / price.toNumber());
    console.log("positionValue: ", positionValue);

    const positionValueDiff = Math.abs(Number(strategyAccPost.positionsValues[0]) - positionValue);
    const allowedDiff = positionValue * 0.0001; // 0.01% tolerance
    assert(positionValueDiff <= allowedDiff, `Position value difference ${positionValueDiff} exceeds 0.01% tolerance of ${allowedDiff}. Expected ~${positionValue}, got ${strategyAccPost.positionsValues[0].toString()}`);

    // Assert User Position Shares
    // TODO: Update after client library implementation
    const userPositionAccPost = await maiker.UserPosition.fetch(bankrunProvider.connection, userPosition);
    console.log("userPositionAccPost Shares: ", userPositionAccPost.strategyShare.toString());
    console.log("userPositionAccPre Shares: ", userPositionAccPre.strategyShare.toString());

    console.log("userPositionAccPost Last Share Value: ", userPositionAccPost.lastShareValue.toString());
    console.log("userPositionAccPre Last Share Value: ", userPositionAccPre.lastShareValue.toString());
  })

  // Rebalance close position flow
  test("Rebalance close position flow", async () => {
    // TODO: Implement
  })

  // Claim Fees Admin

  // Update Global Config
});
