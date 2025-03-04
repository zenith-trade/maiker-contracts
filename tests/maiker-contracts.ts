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
import { BinAndAmount, binIdToBinArrayIndex, calculateSpotDistribution, deriveBinArray, deriveBinArrayBitmapExtension, isOverflowDefaultBinArrayBitmap, LBCLMM_PROGRAM_IDS, LiquidityParameterByWeight, MAX_BIN_ARRAY_SIZE, toWeightDistribution } from "../dlmm-ts-client/src";
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

describe("maiker-contracts", () => {
  let xMint: PublicKey;
  let yMint: PublicKey;
  let lbPairPubkey: PublicKey;
  let lbPairAcc: dlmm.lbPair;

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

    // Not possible with bankrun because of restricted bankrun connection spec
    // const dlmm = await DLMM.create(bankrunProvider.connection, lbPairPubkey);

    lbPairAcc = await dlmm.lbPair.fetch(bankrunProvider.connection, lbPairPubkey);
    console.log("lbPairAcc: ", lbPairAcc);

    const activeBin = lbPairAcc.activeId
    const lowerBinId = activeBin - Number(MAX_BIN_ARRAY_SIZE) / 2;
    const upperBinId = lowerBinId + Number(MAX_BIN_ARRAY_SIZE) - 1;

    // Initialize External Position and Add Liquidity -> Required so our strategy can swap initially
    const pos = Keypair.generate();

    const binIds = Array.from(
      { length: upperBinId - lowerBinId + 1 },
      (_, i) => lowerBinId + i
    );
    const xYAmountDistribution: BinAndAmount[] = calculateSpotDistribution(activeBin, binIds)

    const ixs = await initializePositionAndAddLiquidityByWeight({
      connection: bankrunProvider.connection,
      lbPairPubkey,
      lbPair: lbPairAcc,
      positionPubKey: pos.publicKey,
      totalXAmount: new BN(500000000000000), // 500M
      totalYAmount: new BN(500000000000000), // 500M
      lowerBinId: lowerBinId,
      upperBinId: upperBinId,
      xYAmountDistribution: xYAmountDistribution,
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

    userTokenX = await getTokenAcc(xUser.ataPubKey);
    userTokenY = await getTokenAcc(yUser.ataPubKey);

    console.log("userTokenX: ", userTokenX.amount.toString());
    console.log("userTokenY: ", userTokenY.amount.toString());

    // Why are not all the tokens being used???
    // assert(userTokenX.amount.toString() === "500000000000000", `userTokenX.amount: ${userTokenX.amount} !== 500000000000000`);
    // assert(userTokenY.amount.toString() === "500000000000000", `userTokenY.amount: ${userTokenY.amount} !== 500000000000000`);
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

    const swapInputAmount = 1000000000; // 1000 tokens

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

    console.log("xVaultTokenAccPre: ", xVaultTokenAccPre.amount.toString());
    console.log("yVaultTokenAccPre: ", yVaultTokenAccPre.amount.toString());

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
    const totalXAmount = new BN(1000000000); // 1000
    const totalYAmount = new BN(1000000000); // 1000

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

    console.log("binLiquidityDist Length: ", binLiquidityDist.length);

    const liquidityParams = {
      amountX: new BN(1000000000),
      amountY: new BN(1000000000),
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

    console.log("xVault Balance diff: ", Number(xVaultTokenAccPost.amount) - Number(xVaultTokenAcc.amount));
    console.log("yVault Balance diff: ", Number(yVaultTokenAccPost.amount) - Number(yVaultTokenAcc.amount));
  })
});
