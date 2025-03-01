import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { MaikerContracts } from "../target/types/maiker_contracts";
import { before, describe, test } from "node:test";
import assert from "assert";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Connection, VersionedTransaction, Transaction, sendAndConfirmTransaction, TransactionInstruction } from "@solana/web3.js";
import { BanksClient, Clock } from "solana-bankrun";
import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, createMintToInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { createStrategy, deposit, GlobalConfig, initialize, initiateWithdrawal, PendingWithdrawal, processWithdrawal, PROGRAM_ID, SHARE_PRECISION, StrategyConfig, UserPosition } from "../clients/js/src";
import { simulateAndGetTxWithCUs } from "../clients/js/src/utils/buildTxAndCheckCu";
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction } from "@solana/spl-token";
import { MintLayout } from "@solana/spl-token";
import { getOrCreateATAInstruction } from "../dlmm-ts-client/src";

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

const loadProviders = async () => {
  // process.env.ANCHOR_WALLET = "../keypairs/pump_test.json";

  const bankrunContext = await startAnchor(
    "./",
    [],
    [
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
  // let lbPair: PublicKey;

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


    const mintXToUserIx = createMintToInstruction(xMint, xUser.ataPubKey, creator.publicKey, 1000000000);
    const mintYToUserIx = createMintToInstruction(yMint, yUser.ataPubKey, creator.publicKey, 1000000000);

    const blockhash = await getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: creator.publicKey,
      lookupTableAccounts: [],
      ixs: [...preIxs, mintXToUserIx, mintYToUserIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);

    // Create DLMM LbPair
  });

  // // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.env());
  // const program = anchor.workspace.MaikerContracts as Program<MaikerContracts>;

  const globalConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("global-config")],
    PROGRAM_ID
  )[0];

  const strategy = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy-config"), Buffer.from(creator.publicKey.toBuffer())],
    PROGRAM_ID
  )[0];

  test("Is initialized!", async () => {
    const initializeIx = initialize(
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

    const globalConfigAcc = await GlobalConfig.fetch(bankrunProvider.connection, globalConfig);
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

    const createStrategyIx = createStrategy(
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

    const strategyAcc = await StrategyConfig.fetch(bankrunProvider.connection, strategy);
    console.log("strategy: ", strategyAcc);
  });

  test("Deposit", async () => {
    const x_amount = 1000000000;

    const userPosition = PublicKey.findProgramAddressSync(
      [Buffer.from("user-position"), Buffer.from(user.publicKey.toBuffer()), Buffer.from(strategy.toBuffer())],
      PROGRAM_ID
    )[0];

    const preIxs = [];

    // User Ata
    const xUser = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, user.publicKey, true);

    xUser.ix && preIxs.push(xUser.ix);

    // Vaults
    const xVault = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, strategy, creator.publicKey, true);

    const depositIx = deposit(
      {
        amount: new BN(x_amount),
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

    const strategyAcc = await StrategyConfig.fetch(bankrunProvider.connection, strategy);
    assert(Number(strategyAcc.strategyShares) === x_amount, `strategyShares: ${strategyAcc.strategyShares} !== ${x_amount}`);

    const userPositionAcc = await UserPosition.fetch(bankrunProvider.connection, userPosition);
    assert(Number(userPositionAcc.strategyShare) === x_amount, `userPositionAcc.strategyShare: ${userPositionAcc.strategyShare} !== ${x_amount}`);
    assert(Number(userPositionAcc.lastShareValue) === SHARE_PRECISION, `userPositionAcc.lastShareValue: ${userPositionAcc.lastShareValue} !== ${SHARE_PRECISION}`);
  });

  test("Withdraw", async () => {
    const sharesAmount = 1000000000;

    const userPosition = PublicKey.findProgramAddressSync(
      [Buffer.from("user-position"), Buffer.from(user.publicKey.toBuffer()), Buffer.from(strategy.toBuffer())],
      PROGRAM_ID
    )[0];

    const pendingWithdrawal = PublicKey.findProgramAddressSync(
      [Buffer.from("pending-withdrawal"), Buffer.from(user.publicKey.toBuffer()), Buffer.from(strategy.toBuffer())],
      PROGRAM_ID
    )[0];

    const [xVault, yVault] = await Promise.all([
      getOrCreateATAInstruction(bankrunProvider.connection, xMint, strategy, creator.publicKey, true),
      getOrCreateATAInstruction(bankrunProvider.connection, yMint, strategy, creator.publicKey, true),
    ]);

    // Initiate withdrawal
    const withdrawIx = initiateWithdrawal(
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

    const userPositionAcc = await UserPosition.fetch(bankrunProvider.connection, userPosition);
    const pendingWithdrawalAcc = await PendingWithdrawal.fetch(bankrunProvider.connection, pendingWithdrawal);
    const strategyAcc = await StrategyConfig.fetch(bankrunProvider.connection, strategy);
    const globalConfigAcc = await GlobalConfig.fetch(bankrunProvider.connection, globalConfig);

    // console.log("Initiation timestamp: ", new Date(Number(pendingWithdrawalAcc.initiationTimestamp) * 1000).toISOString());
    // console.log("Available timestamp: ", new Date(Number(pendingWithdrawalAcc.availableTimestamp) * 1000).toISOString());

    assert(Number(userPositionAcc.strategyShare) === 0, `userPositionAcc.strategyShare: ${userPositionAcc.strategyShare} !== 0`);

    // Note: Apply the withdraw fee bps to assertion
    const widthawFeeShare = sharesAmount * (globalConfigAcc.withdrawalFeeBps / 10000);
    assert(Number(pendingWithdrawalAcc.sharesAmount) === sharesAmount - widthawFeeShare, `pendingWithdrawalAcc.sharesAmount: ${pendingWithdrawalAcc.sharesAmount} !== ${sharesAmount - widthawFeeShare}`);
    assert(Number(pendingWithdrawalAcc.tokenAmount) === sharesAmount - widthawFeeShare, `pendingWithdrawalAcc.tokenAmount: ${pendingWithdrawalAcc.tokenAmount} !== ${sharesAmount - widthawFeeShare}`);

    assert(Number(strategyAcc.feeShares) === widthawFeeShare, `strategyAcc.feeShares: ${strategyAcc.feeShares} !== ${widthawFeeShare}`);

    // Try claim withdrawal prematurely
    const xUser = await getOrCreateATAInstruction(bankrunProvider.connection, xMint, user.publicKey, user.publicKey, true);

    let claimIx = processWithdrawal(
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
      await PendingWithdrawal.fetch(bankrunProvider.connection, pendingWithdrawal);
      assert(false, "Should have failed");
    } catch (e) {
      console.log("Failed successfully");
    }
  });
});
