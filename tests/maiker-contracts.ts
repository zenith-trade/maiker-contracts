import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { MaikerContracts } from "../target/types/maiker_contracts";
import { before, describe, test, it } from "node:test";
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

describe("maiker-contracts", () => {
  before(async () => {
    await loadProviders();
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MaikerContracts as Program<MaikerContracts>;

  test("Is initialized!", async () => {
    console.log("bankrunProvider: ", bankrunProvider);

    // const tx = await program.methods.initialize().rpc();
    // console.log("Your transaction signature", tx);
  });
});
