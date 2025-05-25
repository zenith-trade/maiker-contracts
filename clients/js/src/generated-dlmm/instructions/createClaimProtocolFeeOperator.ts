import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CreateClaimProtocolFeeOperatorAccounts {
  claimFeeOperator: PublicKey
  operator: PublicKey
  admin: PublicKey
  systemProgram: PublicKey
}

export function createClaimProtocolFeeOperator(
  accounts: CreateClaimProtocolFeeOperatorAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.claimFeeOperator, isSigner: false, isWritable: true },
    { pubkey: accounts.operator, isSigner: false, isWritable: false },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([51, 19, 150, 252, 105, 157, 48, 91])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
