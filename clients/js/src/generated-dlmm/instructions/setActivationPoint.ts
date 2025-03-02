import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SetActivationPointArgs {
  activationPoint: BN
}

export interface SetActivationPointAccounts {
  lbPair: PublicKey
  admin: PublicKey
}

export const layout = borsh.struct([borsh.u64("activationPoint")])

export function setActivationPoint(
  args: SetActivationPointArgs,
  accounts: SetActivationPointAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
  ]
  const identifier = Buffer.from([91, 249, 15, 165, 26, 129, 254, 125])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      activationPoint: args.activationPoint,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
