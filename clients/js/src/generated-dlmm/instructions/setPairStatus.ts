import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SetPairStatusArgs {
  status: number
}

export interface SetPairStatusAccounts {
  lbPair: PublicKey
  admin: PublicKey
}

export const layout = borsh.struct([borsh.u8("status")])

export function setPairStatus(
  args: SetPairStatusArgs,
  accounts: SetPairStatusAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: false },
  ]
  const identifier = Buffer.from([67, 248, 231, 137, 154, 149, 217, 174])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      status: args.status,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
