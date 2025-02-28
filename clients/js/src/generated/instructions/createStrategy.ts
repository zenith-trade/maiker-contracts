import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CreateStrategyAccounts {
  creator: PublicKey
  xMint: PublicKey
  yMint: PublicKey
  xVault: PublicKey
  yVault: PublicKey
  strategy: PublicKey
  systemProgram: PublicKey
}

export function createStrategy(
  accounts: CreateStrategyAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.creator, isSigner: true, isWritable: true },
    { pubkey: accounts.xMint, isSigner: false, isWritable: false },
    { pubkey: accounts.yMint, isSigner: false, isWritable: false },
    { pubkey: accounts.xVault, isSigner: false, isWritable: false },
    { pubkey: accounts.yVault, isSigner: false, isWritable: false },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([152, 160, 107, 148, 245, 190, 127, 224])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
