import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface GetPositionValueAccounts {
  strategy: PublicKey
  position: PublicKey
  lbPair: PublicKey
  binArrayLower: PublicKey
  binArrayUpper: PublicKey
  user: PublicKey
}

export function getPositionValue(
  accounts: GetPositionValueAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.position, isSigner: false, isWritable: false },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: false },
    { pubkey: accounts.binArrayLower, isSigner: false, isWritable: false },
    { pubkey: accounts.binArrayUpper, isSigner: false, isWritable: false },
    { pubkey: accounts.user, isSigner: true, isWritable: false },
  ]
  const identifier = Buffer.from([176, 101, 36, 67, 215, 72, 215, 247])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
