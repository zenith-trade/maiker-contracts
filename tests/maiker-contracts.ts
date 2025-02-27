import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { MaikerContracts } from "../target/types/maiker_contracts";
import { before, describe, test, it } from "node:test";
import { assert } from "node:console";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { BanksClient } from "solana-bankrun";
import path from "node:path";
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";

const INITIAL_SOL = 5000 * LAMPORTS_PER_SOL;

const RPC_URL = "http://localhost:8899";

/// --- KEYPAIRS
const master = Keypair.generate()
const creator = Keypair.generate()
const user = Keypair.generate()
const admin = Keypair.generate()

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
  const bankrunProvider = new BankrunProvider(bankrunContext);
  console.log("anchor connection: ", bankrunProvider.connection.rpcEndpoint);

  // bankrunProvider.connection.rpcEndpoint = RPC_URL;
  // const conn = bankrunProvider.connection;

  // const connection = conn;
  // console.log("using bankrun payer");

  return {
    // connection,
    bankrunProvider,
  };
};

describe("maiker-contracts", () => {
  let bankrunProvider: BankrunProvider;
  before(async () => {
    ({ bankrunProvider } = await loadProviders());
  });

  console.log("bankrunProvider: ", bankrunProvider);

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MaikerContracts as Program<MaikerContracts>;

  // test("Is initialized!", async () => {
  //   // Add your test here.
  //   const tx = await program.methods.initialize().rpc();
  //   console.log("Your transaction signature", tx);
  // });
});
