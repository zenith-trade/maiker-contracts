import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SetPairStatusPermissionlessArgs {
  status: number
}

export interface SetPairStatusPermissionlessAccounts {
  lbPair: PublicKey
  creator: PublicKey
}

export const layout = borsh.struct([borsh.u8("status")])

export function setPairStatusPermissionless(
  args: SetPairStatusPermissionlessArgs,
  accounts: SetPairStatusPermissionlessAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.creator, isSigner: true, isWritable: false },
  ]
  const identifier = Buffer.from([78, 59, 152, 211, 70, 183, 46, 208])
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
