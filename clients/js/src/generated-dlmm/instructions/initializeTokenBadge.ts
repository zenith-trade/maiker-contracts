import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializeTokenBadgeAccounts {
  tokenMint: PublicKey
  tokenBadge: PublicKey
  admin: PublicKey
  systemProgram: PublicKey
}

export function initializeTokenBadge(
  accounts: InitializeTokenBadgeAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.tokenMint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenBadge, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([253, 77, 205, 95, 27, 224, 89, 223])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
