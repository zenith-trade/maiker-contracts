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
import { maiker, maikerProgramId, dlmm, dlmmProgramId, maikerErrors, dlmmErrors, maikerInstructions, dlmmInstructions, maikerTypes, dlmmTypes, SHARE_PRECISION, getOrCreateBinArraysInstructions, DLMM_EVENT_AUTHORITY_PDA, initializePositionAndAddLiquidityByWeight, deriveGlobalConfig, deriveStrategy, derivePendingWithdrawal, deriveUserPosition, getPricePerLamport } from "../clients/js/src";
import { simulateAndGetTxWithCUs } from "../clients/js/src/utils/buildTxAndCheckCu";
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction } from "@solana/spl-token";
import { MintLayout } from "@solana/spl-token";

// I import from the dlmm-ts-client to make it work with bankrun. We updated the getChunkedAccountInfos function as well as getOrCreateAta. -> Find in codebase with "IMPORTANT:"
import { BinAndAmount, BinArrayAccount, binIdToBinArrayIndex, calculateBidAskDistribution, calculateNormalDistribution, calculateSpotDistribution, deriveBinArray, deriveBinArrayBitmapExtension, getPriceOfBinByBinId, isOverflowDefaultBinArrayBitmap, LBCLMM_PROGRAM_IDS, LiquidityParameterByWeight, MAX_BIN_ARRAY_SIZE, toWeightDistribution } from "../dlmm-ts-client/src";
import DLMM, { deriveLbPair2, derivePresetParameter2, getOrCreateATAInstruction } from "../dlmm-ts-client/src";

import { readFileSync } from "fs";
import path from "path";
import { MaikerSDK } from "../clients/js/src";

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
  const testTokensMinted = 1000000000; // 1B

  const xMintDecimals = 6;
  const yMintDecimals = 6;
  let xMint: PublicKey;
  let yMint: PublicKey;
  let lbPairPubkey: PublicKey;
  let lbPairAcc: dlmm.lbPair;

  let dlmmInstance: DLMM;

  let globalConfig: PublicKey;
  let strategy: PublicKey;

  before(async () => {
    await loadProviders();

    // Create Mints
    xMint = await createMint(bankrunProvider.connection, creator, creator.publicKey, creator.publicKey, xMintDecimals);
    yMint = await createMint(bankrunProvider.connection, creator, creator.publicKey, creator.publicKey, yMintDecimals);

    globalConfig = deriveGlobalConfig();
    strategy = deriveStrategy(creator.publicKey, xMint, yMint);

    // Mint to user
    const preIxs = [];

    const [xUser, yUser] = await Promise.all([
      getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, undefined, user.publicKey, true),
      getOrCreateATAInstruction(bankrunProvider.connection, yMint, user.publicKey, undefined, user.publicKey, true),
    ]);

    xUser.ix && preIxs.push(xUser.ix);
    yUser.ix && preIxs.push(yUser.ix);


    const mintXToUserIx = createMintToInstruction(xMint, xUser.ataPubKey, creator.publicKey, testTokensMinted * 10 ** xMintDecimals); // 1B
    const mintYToUserIx = createMintToInstruction(yMint, yUser.ataPubKey, creator.publicKey, testTokensMinted * 10 ** yMintDecimals); // 1B

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

    assert(userTokenX.amount === BigInt(testTokensMinted * 10 ** xMintDecimals), `userTokenX.amount: ${userTokenX.amount} !== 1000000000 * 10 ** ${xMintDecimals}`);
    assert(userTokenY.amount === BigInt(testTokensMinted * 10 ** yMintDecimals), `userTokenY.amount: ${userTokenY.amount} !== 1000000000 * 10 ** ${yMintDecimals}`);

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
      new BN(0),
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
    // console.log("Spot Distribution: ", SpotDistribution);

    // const bidAskDistribution: BinAndAmount[] = calculateBidAskDistribution(activeBin, binIds);
    // console.log("Bid Ask Distribution: ", bidAskDistribution);
    // const normalDistribution: BinAndAmount[] = calculateNormalDistribution(activeBin, binIds);
    // console.log("Normal Distribution: ", normalDistribution);

    // console.log("xYAmountDistribution: ", xYAmountDistribution);
    // console.log("first bin: ", xYAmountDistribution[0].yAmountBpsOfTotal.toString()); // 281 bps per bin
    // console.log("last bin: ", xYAmountDistribution[xYAmountDistribution.length - 1].xAmountBpsOfTotal.toString()); // 289 bps per bin

    // Put half of the supply into the Pair
    // Bug fix: This has to be calculated. Meteora always tries ot fill one of the total amounts to the fullest and then match the other reserve accordingly

    const price = getPriceOfBinByBinId(activeBin, lbPairAcc.binStep);
    console.log("price: ", price);

    // Price of one X Lamport in Y Lamport
    const priceInYLamport = getPricePerLamport(xMintDecimals, yMintDecimals, price.toNumber());
    console.log("price in y lamport: ", priceInYLamport.toString());

    const totalXAmount = new BN(500000000).mul(new BN(10 ** xMintDecimals));
    console.log("totalXAmount: ", totalXAmount.toString());

    // X * price = Y / price
    const calculatedYAmount = totalXAmount.mul(new BN(Math.round(parseFloat(priceInYLamport))));
    console.log("calculatedYAmount: ", calculatedYAmount.toString());

    const ixs = await initializePositionAndAddLiquidityByWeight({
      connection: bankrunProvider.connection,
      lbPairPubkey,
      lbPair: lbPairAcc,
      positionPubKey: pos.publicKey,
      totalXAmount: totalXAmount,
      totalYAmount: calculatedYAmount,
      lowerBinId: lowerBinId,
      upperBinId: upperBinId,
      xYAmountDistribution: SpotDistribution,
      user: user.publicKey,
    })

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

    userTokenX = await getTokenAcc(xUser.ataPubKey);
    userTokenY = await getTokenAcc(yUser.ataPubKey);

    const reserveX = await getTokenAcc(dlmmInstance.lbPair.reserveX);
    const reserveY = await getTokenAcc(dlmmInstance.lbPair.reserveY);

    console.log("reserveX: ", Number(reserveX.amount) / 10 ** xMintDecimals); // 144M
    console.log("reserveY: ", Number(reserveY.amount) / 10 ** yMintDecimals); // 500M

    console.log("userTokenX: ", Number(userTokenX.amount) / 10 ** xMintDecimals); // 856M Remaining
    console.log("userTokenY: ", Number(userTokenY.amount) / 10 ** yMintDecimals); // 500M used as intended

    // Why are not all the tokens being used???
    // Answer: The price is not 1:1 -> The price is 286 x per y -> Therefore 500M * 0.286 = 143M is used -> Total position value is 143M * 2 = 286M xToken
    // Note: reserveX = reserveY * price / 10 * ^4

    // Assert Position Value
    const expectedAmountX = testTokensMinted * 10 ** xMintDecimals - Number(reserveX.amount)
    const expectedAmountY = testTokensMinted * 10 ** yMintDecimals - Number(reserveY.amount)
    assert(isWithinOnePercent(userTokenX.amount, BigInt(expectedAmountX)), `userTokenX.amount: ${userTokenX.amount} !== ${expectedAmountX}`);
    assert(isWithinOnePercent(userTokenY.amount, BigInt(expectedAmountY)), `userTokenY.amount: ${userTokenY.amount} !== ${expectedAmountY}`);
  });

  test("Is initialized!", async () => {
    const initializeIx = maikerInstructions.initialize(
      {
        globalConfigArgs: {
          performanceFeeBps: 2000,
          withdrawalFeeBps: 150,
          intervalSeconds: new BN(60 * 60), // 1 hour
          treasury: master.publicKey,
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
    // Create a strategy using MaikerSDK's static method
    const createStrategyIxs = await MaikerSDK.createStrategy(
      bankrunProvider.connection,
      {
        creator: creator.publicKey,
        xMint: xMint,
        yMint: yMint
      }
    );

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: creator.publicKey,
      lookupTableAccounts: [],
      ixs: [...createStrategyIxs],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    // console.log("Strategy Pubkey: ", strategy.toBase58());

    // Create an SDK instance for the strategy
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    console.log("strategy data:", maikerSdk.strategyAcc);
    assert(maikerSdk.strategyAcc.xMint.equals(xMint), "X mint doesn't match");
    assert(maikerSdk.strategyAcc.yMint.equals(yMint), "Y mint doesn't match");
  });

  test("Deposit", async () => {
    const xAmount = 1000000 * 10 ** xMintDecimals; // 1M

    // Create an SDK instance for the strategy if not already created
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    // Create deposit instruction using the SDK
    const depositIxs = await maikerSdk.createDepositInstruction(
      {
        user: user.publicKey,
        amount: xAmount
      }
    );

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...depositIxs],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    // Refresh strategy data to get latest state
    await maikerSdk.refresh();

    // Use SDK's getUserPosition to get position info
    const userPositionInfo = await maikerSdk.getUserPosition(user.publicKey);
    // console.log("User position info: ", userPositionInfo);

    // Assertions
    assert(Number(maikerSdk.strategyAcc.strategyShares) === xAmount,
      `strategyShares: ${maikerSdk.strategyAcc.strategyShares} !== ${xAmount}`);

    assert(userPositionInfo !== null, "User position not found");
    assert(Number(userPositionInfo.strategyShare) === xAmount,
      `userPositionInfo.strategyShare: ${userPositionInfo?.strategyShare / SHARE_PRECISION} !== ${xAmount / 10 ** xMintDecimals}`);
    assert(userPositionInfo.lastShareValue === SHARE_PRECISION,
      `userPositionInfo.shareValue: ${userPositionInfo?.lastShareValue} !== ${SHARE_PRECISION}`);

    // Get token balance from the vault directly
    const xVaultTokenAcc = await getTokenAcc(maikerSdk.strategyAcc.xVault);
    assert(Number(xVaultTokenAcc.amount) === xAmount,
      `xVaultTokenAcc.amount: ${xVaultTokenAcc.amount} !== ${xAmount}`);
  });

  test("Withdraw", async () => {
    const sharesAmount = 100000 * SHARE_PRECISION; // 100k

    // Create an SDK instance for the strategy if not already created
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    // Get user position info before withdrawal
    const userPositionInfoPre = await maikerSdk.getUserPosition(user.publicKey);
    console.log("User position before withdrawal:", userPositionInfoPre);

    // Create withdrawal initiation instruction using the SDK
    const withdrawIx = await maikerSdk.createInitiateWithdrawalInstruction({
      user: user.publicKey,
      sharesAmount: sharesAmount
    });

    let blockhash = await getLatestBlockhash();
    let builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [withdrawIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    // Get withdrawal info
    // Cannot use SDK because bankrun doesn't implement getProgramAccounts
    // const pendingWithdrawals = await maikerSdk.getPendingWithdrawals();
    // const userWithdrawal = pendingWithdrawals.find(w => w.owner.equals(user.publicKey));
    // console.log("Pending withdrawal:", userWithdrawal);

    const userWithdrawal = derivePendingWithdrawal(user.publicKey, strategy);
    console.log("User withdrawal: ", userWithdrawal);

    const userWithdrawalData = await maiker.PendingWithdrawal.fetch(bankrunProvider.connection, userWithdrawal);
    console.log("User withdrawal data: ", userWithdrawalData);

    // Refresh SDK data
    await maikerSdk.refresh();

    // Get user position info after initiation
    const userPositionInfoPost = await maikerSdk.getUserPosition(user.publicKey);
    console.log("User position after withdrawal initiation:", userPositionInfoPost);

    // Apply the withdraw fee bps to assertion
    const withdrawalFeeBps = maikerSdk.globalConfigAcc.withdrawalFeeBps;
    const withdrawFeeShare = sharesAmount * (withdrawalFeeBps / 10000);

    // Verify user position shares were reduced
    assert(userPositionInfoPost.strategyShare === userPositionInfoPre.strategyShare - sharesAmount,
      `User position shares not reduced correctly: ${userPositionInfoPost.strategyShare} !== ${userPositionInfoPre.strategyShare - sharesAmount}`);

    // Verify pending withdrawal amount (after fee)
    assert(Number(userWithdrawalData.sharesAmount) === sharesAmount - withdrawFeeShare,
      `Pending withdrawal amount incorrect: ${userWithdrawalData.sharesAmount} !== ${sharesAmount - withdrawFeeShare}`);

    // Verify fee shares were added to strategy
    assert(Number(maikerSdk.strategyAcc.feeShares) === withdrawFeeShare,
      `Strategy fee shares incorrect: ${maikerSdk.strategyAcc.feeShares} !== ${withdrawFeeShare}`);

    // Try claim withdrawal prematurely
    // Create process withdrawal instruction using the SDK
    const claimIxs = await maikerSdk.createProcessWithdrawalInstruction({
      user: user.publicKey
    });

    blockhash = await getLatestBlockhash();
    builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...claimIxs],
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
    bankrunProvider.context.setClock(new Clock(BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(Number(userWithdrawalData.availableTimestamp) + 60)));

    blockhash = await getLatestBlockhash();
    builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...claimIxs],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    // Verify withdrawal was processed
    // const pendingWithdrawalsAfter = await maikerSdk.getPendingWithdrawals();
    // const userWithdrawalAfter = pendingWithdrawalsAfter.find(w => w.owner.equals(user.publicKey));
    try {
      await maiker.PendingWithdrawal.fetch(bankrunProvider.connection, userWithdrawal);
      assert(false, "Should have failed");
    } catch (e) {
      console.log("Failed successfully");
    }
  });

  test("Add Position", async () => {
    // Create an SDK instance for the strategy if not already created
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    const strategyValuePre = await maikerSdk.getStrategyValue();
    console.log("strategyValuePre (preSwap): ", strategyValuePre);

    // Create swap instruction first
    const swapInputAmount = 1000 * 10 ** xMintDecimals; // 1000 tokens

    const lbPairAcc = await dlmm.lbPair.fetch(bankrunProvider.connection, lbPairPubkey);
    const activeBin = lbPairAcc.activeId;

    const xVaultTokenAccPre = await getTokenAcc(maikerSdk.strategyAcc.xVault);
    const yVaultTokenAccPre = await getTokenAcc(maikerSdk.strategyAcc.yVault);

    console.log("xVaultTokenAccPre: ", xVaultTokenAccPre.amount.toString());
    console.log("yVaultTokenAccPre: ", yVaultTokenAccPre.amount.toString());

    const swapIx = maikerSdk.createSwapInstruction({
      authority: master.publicKey,
      lbPair: lbPairPubkey,
      lbPairAcc,
      amountIn: new BN(swapInputAmount),
      minAmountOut: new BN(0), // Irrelevant for test
      xToY: true, // In this test
      activeBin,
    })

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

    const strategyValuePost = await maikerSdk.getStrategyValue();
    console.log("strategyValuePost (postSwap): ", strategyValuePost);

    const xVaultTokenAcc = await getTokenAcc(maikerSdk.strategyAcc.xVault);
    const yVaultTokenAcc = await getTokenAcc(maikerSdk.strategyAcc.yVault);

    assert(Number(xVaultTokenAcc.amount) === Number(xVaultTokenAccPre.amount) - swapInputAmount, `xVaultTokenAcc.amount: ${xVaultTokenAcc.amount} !== ${xVaultTokenAccPre.amount} - ${swapInputAmount}`);

    // We want to deposit 1000 tokens in total for both x and y
    const totalXAmount = new BN(swapInputAmount);
    const totalYAmount = new BN(Number(yVaultTokenAcc.amount)); // Total Y in vault

    // Get updated LB Pair info
    const updatedLbPairAcc = await dlmm.lbPair.fetch(bankrunProvider.connection, lbPairPubkey);
    const activeBinPostSwap = updatedLbPairAcc.activeId;
    console.log("Active Bin post swap: ", activeBinPostSwap);

    const lowerBinId = activeBinPostSwap - Number(MAX_BIN_ARRAY_SIZE) / 2; // Put liquidity equal around active bin
    const upperBinId = lowerBinId + Number(MAX_BIN_ARRAY_SIZE) - 1; // Only plus 69

    console.log("activeBin: ", activeBinPostSwap);
    console.log("lowerBinId: ", lowerBinId);
    console.log("upperBinId: ", upperBinId);

    // Generate a new position
    const newPosition = Keypair.generate();
    // console.log("New Position Pubkey: ", newPosition.publicKey.toBase58());

    // Use SDK to create initialize position instruction
    const initPositionIx = maikerSdk.createInitializePositionInstruction({
      lbPair: lbPairPubkey,
      position: newPosition.publicKey,
      authority: master.publicKey,
      lowerBinId: lowerBinId,
      width: Number(MAX_BIN_ARRAY_SIZE), // 70
    });

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

    // Refresh SDK to get updated data
    await maikerSdk.refresh();

    // Assert it exists and we can see it
    // const positionInfosPre = await maikerSdk.fetchPositions();
    // console.log("Position Infos pre add liquidity: ", positionInfosPre);

    // Assert
    assert(maikerSdk.strategyAcc.positionCount === 1, `strategyAcc.positionCount: ${maikerSdk.strategyAcc.positionCount} !== 1`);
    assert(maikerSdk.strategyAcc.positions[0].toBase58() === newPosition.publicKey.toBase58(), `strategyAcc.positions[0]: ${maikerSdk.strategyAcc.positions[0].toString()} !== ${newPosition.publicKey.toString()}`);

    // Use SDK to create add liquidity instruction
    const binIds = Array.from(
      { length: upperBinId - lowerBinId + 1 },
      (_, i) => lowerBinId + i
    );

    const xYAmountDistribution: BinAndAmount[] = calculateSpotDistribution(activeBinPostSwap, binIds);

    // Create add liquidity using SDK
    const { instruction: addLiquidityIx, preInstructions: preIxsAddLiquidity } = await maikerSdk.createAddLiquidityInstruction({
      authority: master.publicKey,
      position: newPosition.publicKey,
      lbPair: lbPairPubkey,
      totalXAmount: totalXAmount,
      totalYAmount: totalYAmount,
      binDistribution: xYAmountDistribution,
      lbPairAcc: updatedLbPairAcc
    });

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
    console.log("Added liquidity");

    // Refresh SDK again
    await maikerSdk.refresh();

    const strategyValuePostLiquidityDeposit = await maikerSdk.getStrategyValue();
    console.log("strategyValuePostLiquidityDeposit (postAddLiquidity): ", strategyValuePostLiquidityDeposit);

    const positionInfosPost = maikerSdk.getPositions();
    console.log("Position Infos post add liquidity: ", positionInfosPost);

    // Assert
    const xVaultTokenAccPost = await getTokenAcc(maikerSdk.strategyAcc.xVault);
    const yVaultTokenAccPost = await getTokenAcc(maikerSdk.strategyAcc.yVault);

    console.log("xVaultTokenAcc Pre: ", xVaultTokenAcc.amount.toString());
    console.log("yVaultTokenAcc Pre: ", yVaultTokenAcc.amount.toString());
    console.log("xVaultTokenAcc Post: ", xVaultTokenAccPost.amount.toString());
    console.log("yVaultTokenAcc Post: ", yVaultTokenAccPost.amount.toString());

    const xVaultBalanceDiff = Math.abs(Number(xVaultTokenAccPost.amount) - Number(xVaultTokenAcc.amount));
    const yVaultBalanceDiff = Math.abs(Number(yVaultTokenAccPost.amount) - Number(yVaultTokenAcc.amount));
    console.log("xVault Balance diff: ", xVaultBalanceDiff);
    console.log("yVault Balance diff: ", yVaultBalanceDiff);

    // assert(isWithinOnePercent(BigInt(xVaultBalanceDiff), BigInt(totalXAmount.toNumber())), `xVaultBalanceDiff: ${xVaultBalanceDiff} !== ${totalXAmount}`); // This one can be different as we take full amount of Y but then the equivalent value of X tokens which is different than the total we define
    assert(isWithinOnePercent(BigInt(yVaultBalanceDiff), BigInt(totalYAmount.toNumber())), `yVaultBalanceDiff: ${yVaultBalanceDiff} !== ${totalYAmount}`);
  });

  test("Deposit and withdraw without setting position value first ", async () => {
    const xAmount = 1000000 * 10 ** xMintDecimals; // 1M

    // Create an SDK instance for the strategy
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    // Try to deposit using the SDK
    const depositIxs = await maikerSdk.createDepositInstruction({
      user: user.publicKey,
      amount: xAmount
    });

    let blockhash = await getLatestBlockhash();
    let builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...depositIxs],
      recentBlockhash: blockhash[0],
    });

    try {
      await processTransaction(builtTx.tx);
      assert(false, "Should not be able to deposit without setting position value first");
    } catch (error) {
      console.log("Failed to deposit successfully");
    }

    // Try to initiate withdrawal using the SDK
    try {
      const withdrawIx = await maikerSdk.createInitiateWithdrawalInstruction({
        user: user.publicKey,
        sharesAmount: 1000
      });

      blockhash = await getLatestBlockhash();
      builtTx = await simulateAndGetTxWithCUs({
        connection: bankrunProvider.connection,
        payerPublicKey: user.publicKey,
        lookupTableAccounts: [],
        ixs: [withdrawIx],
        recentBlockhash: blockhash[0],
      });

      await processTransaction(builtTx.tx);
      assert(false, "Should not be able to withdraw without setting position value first");
    } catch (error) {
      console.log("Failed to withdraw successfully");
    }
  });

  test("Get Position Value and deposit", async () => {
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    await maikerSdk.refresh();

    const userPosition = deriveUserPosition(user.publicKey, strategy);

    const strategyAccPre = maikerSdk.strategyAcc;
    const userPositionInfoPre = await maikerSdk.getUserPosition(user.publicKey);

    const getPositionValueIxs = await maikerSdk.createPositionValueInstructions({
      user: user.publicKey,
    })

    // Deposit
    const xAmount = 100000 * 10 ** xMintDecimals; // 100k

    const xUser = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, undefined, user.publicKey, true);

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
      ixs: [...getPositionValueIxs, depositIx],
      recentBlockhash: blockhash[0],
    })

    await processTransaction(builtTx.tx);

    await maikerSdk.refresh();
    const strategyAccPost = maikerSdk.strategyAcc;

    // All within client library
    const positionValue = await maikerSdk.getStrategyValue();
    // console.log("positionValue: ", positionValue);

    // Assert on-chain position value data
    for (let i = 0; i < strategyAccPost.positionCount; i++) {
      const positionPubkey = strategyAccPost.positions[i];
      const onChainValue = strategyAccPost.positionsValues[i];
      // console.log("onChainValue: ", onChainValue.toString());

      const sdkPositionValue = positionValue.positionValues.find(p => p.pubkey === positionPubkey.toString());
      // console.log("sdkPositionValue: ", sdkPositionValue.totalValue.toString());

      const valueDiff = Math.abs(Number(onChainValue) - sdkPositionValue.totalValue);
      const allowedDiff = sdkPositionValue.totalValue * 0.0001; // 0.01% tolerance

      assert(valueDiff <= allowedDiff,
        `Position ${positionPubkey.toString()} value difference ${valueDiff} exceeds 0.01% tolerance of ${allowedDiff}. Expected ~${sdkPositionValue.totalValue}, got ${onChainValue.toString()}`
      );
    }

    const shareValue = maikerSdk.calculateShareValue(positionValue.totalValue);
    // console.log("shareValue: ", shareValue.toString());

    // Assert User Position Shares
    const userPositionInfoPost = await maikerSdk.getUserPosition(user.publicKey);
    const newSharesIssued = maikerSdk.calculateSharesForDeposit(xAmount, shareValue);
    // console.log("newSharesIssued: ", newSharesIssued);

    assert(isWithinOnePercent(BigInt(userPositionInfoPost.strategyShare), BigInt(userPositionInfoPre.strategyShare + newSharesIssued)), `userPositionInfoPost.strategyShare: ${userPositionInfoPost.strategyShare} !== ${userPositionInfoPre.strategyShare + newSharesIssued}`);
    // console.log("userPositionAccPost Shares: ", userPositionInfoPost.strategyShare.toString());
    // console.log("userPositionAccPre Shares: ", userPositionInfoPre.strategyShare.toString());

    assert(userPositionInfoPost.lastShareValue === Math.floor(shareValue * SHARE_PRECISION), `userPositionInfoPost.lastShareValue: ${userPositionInfoPost.lastShareValue} !== ${Math.floor(shareValue * SHARE_PRECISION)}`);
    // console.log("userPositionAccPost Last Share Value: ", userPositionInfoPost.lastShareValue.toString());
    // console.log("userPositionAccPre Last Share Value: ", userPositionInfoPre.lastShareValue.toString());
  })

  // Rebalance close position flow: Claim Fees, Withdraw Liquidity, Close Position
  test("Rebalance close position flow", async () => {
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    await maikerSdk.refresh();

    const strategyAccPre = maikerSdk.strategyAcc;
    console.log("strategyAccPre: ", strategyAccPre);

    const vaultXPre = await getTokenAcc(strategyAccPre.xVault);
    const vaultYPre = await getTokenAcc(strategyAccPre.yVault);

    const positionPubkey = strategyAccPre.positions[0];

    const positionInfos = maikerSdk.getPositions();
    const positionInfo = positionInfos.find(p => p.pubkey.equals(positionPubkey));
    // console.log("positionInfo: ", positionInfo);

    // const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(positionInfo.positionData.lowerBinId));
    // const upperBinArrayIndex = binIdToBinArrayIndex(new BN(positionInfo.positionData.upperBinId));

    // const { lowerBinArray, upperBinArray } = await getOrCreateBinArraysInstructions(bankrunProvider.connection, lbPairPubkey, new BN(lowerBinArrayIndex), new BN(upperBinArrayIndex), master.publicKey);

    const claimFeeIx = maikerSdk.createMeteoraClaimFeesInstruction({
      authority: master.publicKey,
      lbPair: positionInfo.lbPair,
      position: positionPubkey,
    });

    const removeLiquidityIx = maikerSdk.createRemoveLiquidityInstruction({
      authority: master.publicKey,
      position: positionPubkey,
    });

    const closePositionIx = maikerSdk.createClosePositionInstruction({
      authority: master.publicKey,
      position: positionPubkey,
    });

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [claimFeeIx, removeLiquidityIx, closePositionIx],
      recentBlockhash: blockhash[0],
    })

    await processTransaction(builtTx.tx);

    // Assert
    await maikerSdk.refresh();
    const strategyAccPost = maikerSdk.strategyAcc;
    // console.log("strategyAccPost: ", strategyAccPost);

    // Assert position was removed correctly
    assert.equal(strategyAccPost.positionCount, strategyAccPre.positionCount - 1);

    // Find where position was in the pre-state arrays
    const positionIndex = strategyAccPre.positions.findIndex(p => p.equals(positionPubkey));
    assert(positionIndex !== -1, "Position should have existed in pre-state");

    // Assert position was removed from positions array
    assert(strategyAccPost.positions[positionIndex].equals(PublicKey.default),
      "Position should be removed and replaced with default pubkey");

    // Assert position values were removed
    assert.equal(strategyAccPost.positionsValues[positionIndex], 0,
      "Position values should be cleared, instead got: " + strategyAccPost.positionsValues[positionIndex].toString());

    // Assert lastPositionUpdate was cleared
    assert.equal(strategyAccPost.lastPositionUpdate[positionIndex], 0,
      "Last position update should be cleared, instead got: " + strategyAccPost.lastPositionUpdate[positionIndex].toString());

    // TODO: Need to write another test with multiple positions to properly check that
    // Check all positions after index shifted down
    for (let i = positionIndex; i < strategyAccPre.positionCount - 1; i++) {
      assert(strategyAccPost.positions[i].equals(strategyAccPre.positions[i + 1]),
        "Positions after removed index should shift down");
      assert.deepEqual(strategyAccPost.positionsValues[i], strategyAccPre.positionsValues[i + 1],
        "Position values after removed index should shift down");
      assert.equal(strategyAccPost.lastPositionUpdate[i], strategyAccPre.lastPositionUpdate[i + 1],
        "Last position updates after removed index should shift down");
    }

    // Token balances
    const vaultXPost = await getTokenAcc(strategyAccPost.xVault);
    const vaultYPost = await getTokenAcc(strategyAccPost.yVault);

    // console.log("positionInfo.positionData.totalXAmount: ", positionInfo.positionData.totalXAmount);
    // console.log("positionInfo.positionData.totalYAmount: ", positionInfo.positionData.totalYAmount);

    // console.log("vaultXPre: ", vaultXPre.amount.toString());
    // console.log("vaultYPre: ", vaultYPre.amount.toString());

    // console.log("vaultXPost: ", vaultXPost.amount.toString());
    // console.log("vaultYPost: ", vaultYPost.amount.toString());

    assert.equal(Number(vaultXPost.amount), Number(vaultXPre.amount) + Math.floor(Number(positionInfo.positionData.totalXAmount)),
      "Vault X should have increased by the position value");

    assert.equal(Number(vaultYPost.amount), Number(vaultYPre.amount) + Math.floor(Number(positionInfo.positionData.totalYAmount)),
      "Vault Y should have increased by the position value");
  })

  // Claim Fees Admin
  test("Claim Fees Admin", async () => {
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    await maikerSdk.refresh();

    const globalConfigAccPre = maikerSdk.globalConfigAcc;
    console.log("globalConfigAccPre: ", globalConfigAccPre);

    const strategyAccPre = maikerSdk.strategyAcc;
    console.log("strategyAccPre: ", strategyAccPre);

    const feeSharesPre = strategyAccPre.feeShares;
    console.log("feeShares Pre: ", Number(feeSharesPre));

    const preIxs = []

    const treasuryX = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, globalConfigAccPre.treasury, undefined, master.publicKey);
    if (treasuryX.ix) preIxs.push(treasuryX.ix);

    const claimFeeIx = maikerInstructions.claimFees(
      {
        sharesToClaim: feeSharesPre,
      },
      {
        authority: master.publicKey,
        globalConfig: globalConfig,
        strategy: strategy,
        strategyVaultX: strategyAccPre.xVault,
        treasuryX: treasuryX.ataPubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    )

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [...preIxs, claimFeeIx],
      recentBlockhash: blockhash[0],
    })

    await processTransaction(builtTx.tx);

    await maikerSdk.refresh();
    const strategyAccPost = maikerSdk.strategyAcc;
    console.log("strategyAccPost: ", strategyAccPost);

    assert.equal(Number(strategyAccPost.feeShares), Number(strategyAccPre.feeShares) - Number(feeSharesPre), "Fee shares should be reduced by fee shares claimed");
    assert.equal(Number(strategyAccPost.strategyShares), Number(strategyAccPre.strategyShares) - Number(feeSharesPre), "Strategy shares should be reduced by fee shares claimed");
  })

  // Update Global Config
  test("Update Global Config", async () => {
    const maikerSdk = await MaikerSDK.create(
      bankrunProvider.connection,
      strategy
    );

    await maikerSdk.refresh();

    const globalConfigAccPre = maikerSdk.globalConfigAcc;
    console.log("globalConfigAccPre: ", globalConfigAccPre);

    const newGlobalConfigArgs = {
      admin: globalConfigAccPre.admin,
      performanceFeeBps: 100,
      withdrawalFeeBps: 100,
      treasury: admin.publicKey,
      intervalSeconds: new BN(3600 / 2),
      newAdmin: admin.publicKey,
    }
    const updateGlobalConfigIx = maikerInstructions.updateGlobalConfig(
      {
        globalConfigArgs: newGlobalConfigArgs,
      },
      {
        authority: master.publicKey,
        globalConfig: globalConfig,
      }
    )

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: user.publicKey,
      lookupTableAccounts: [],
      ixs: [updateGlobalConfigIx],
      recentBlockhash: blockhash[0],
    })

    await processTransaction(builtTx.tx);

    const globalConfigAccPost = await maiker.GlobalConfig.fetch(bankrunProvider.connection, globalConfig);
    console.log("globalConfigAccPost: ", globalConfigAccPost);

    assert.equal(globalConfigAccPost.performanceFeeBps, newGlobalConfigArgs.performanceFeeBps, "Performance fee should be updated");
    assert.equal(globalConfigAccPost.withdrawalFeeBps, newGlobalConfigArgs.withdrawalFeeBps, "Withdrawal fee should be updated");
    assert.equal(Number(globalConfigAccPost.withdrawalIntervalSeconds), Number(newGlobalConfigArgs.intervalSeconds), "Interval should be updated");
    assert.equal(globalConfigAccPost.treasury.toBase58(), newGlobalConfigArgs.treasury.toBase58(), "Treasury should be updated");
    assert.equal(globalConfigAccPost.admin.toBase58(), newGlobalConfigArgs.newAdmin.toBase58(), "Admin should be updated");
  })
});
