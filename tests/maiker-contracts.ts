import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { MaikerContracts } from "../target/types/maiker_contracts";
import { before, describe, test, it } from "node:test";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Connection, VersionedTransaction } from "@solana/web3.js";
import { BanksClient } from "solana-bankrun";
import { AccountLayout } from "@solana/spl-token";
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { initialize, PROGRAM_ID } from "../clients/js/src";
import { simulateAndGetTxWithCUs } from "../clients/js/src/utils/buildTxAndCheckCu";

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
  console.log("bankrunProvider: ", bankrunProvider);
  // console.log("anchor connection: ", bankrunProvider.connection.rpcEndpoint);

  // bankrunProvider.connection.rpcEndpoint = RPC_URL;
  // const conn = bankrunProvider.connection;

  // const connection = conn;
};

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

describe("maiker-contracts", () => {
  before(async () => {
    await loadProviders();
  });

  // // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.env());
  // const program = anchor.workspace.MaikerContracts as Program<MaikerContracts>;

  test("Is initialized!", async () => {
    const globalConfig = PublicKey.findProgramAddressSync(
      [Buffer.from("global-config")],
      PROGRAM_ID
    )[0];

    const initializeIx = initialize(
      {
        performanceFeeBps: 0,
        withdrawalFeeBps: 0,
      },
      {
        admin: master.publicKey,
        globalConfig: globalConfig,
        systemProgram: SystemProgram.programId,
      },
    );

    const blockhash = await bankrunProvider.context.banksClient.getLatestBlockhash();
    const builtTx = await simulateAndGetTxWithCUs({
      connection: bankrunProvider.connection,
      payerPublicKey: master.publicKey,
      lookupTableAccounts: [],
      ixs: [initializeIx],
      recentBlockhash: blockhash[0],
    });

    await processTransaction(builtTx.tx);
  });
});
