import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UpdateFeesAndReward2Args {
  minBinId: number
  maxBinId: number
}

export interface UpdateFeesAndReward2Accounts {
  position: PublicKey
  lbPair: PublicKey
  owner: PublicKey
}

export const layout = borsh.struct([
  borsh.i32("minBinId"),
  borsh.i32("maxBinId"),
])

export function updateFeesAndReward2(
  args: UpdateFeesAndReward2Args,
  accounts: UpdateFeesAndReward2Accounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.position, isSigner: false, isWritable: true },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.owner, isSigner: true, isWritable: false },
  ]
  const identifier = Buffer.from([32, 142, 184, 154, 103, 65, 184, 88])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      minBinId: args.minBinId,
      maxBinId: args.maxBinId,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
