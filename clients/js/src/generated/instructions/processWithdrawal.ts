import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface ProcessWithdrawalAccounts {
  user: PublicKey
  strategy: PublicKey
  globalConfig: PublicKey
  pendingWithdrawal: PublicKey
  userTokenX: PublicKey
  strategyVaultX: PublicKey
  treasuryX: PublicKey
  tokenProgram: PublicKey
  systemProgram: PublicKey
}

export function processWithdrawal(
  accounts: ProcessWithdrawalAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.pendingWithdrawal, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenX, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultX, isSigner: false, isWritable: true },
    { pubkey: accounts.treasuryX, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([51, 97, 236, 17, 37, 33, 196, 64])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
