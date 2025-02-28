import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UpdateGlobalConfigArgs {
  performanceFeeBps: number | null
  withdrawalFeeBps: number | null
  treasury: PublicKey | null
  newAdmin: PublicKey | null
}

export interface UpdateGlobalConfigAccounts {
  authority: PublicKey
  globalConfig: PublicKey
}

export const layout = borsh.struct([
  borsh.option(borsh.u16(), "performanceFeeBps"),
  borsh.option(borsh.u16(), "withdrawalFeeBps"),
  borsh.option(borsh.publicKey(), "treasury"),
  borsh.option(borsh.publicKey(), "newAdmin"),
])

export function updateGlobalConfig(
  args: UpdateGlobalConfigArgs,
  accounts: UpdateGlobalConfigAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: false },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([164, 84, 130, 189, 111, 58, 250, 200])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      performanceFeeBps: args.performanceFeeBps,
      withdrawalFeeBps: args.withdrawalFeeBps,
      treasury: args.treasury,
      newAdmin: args.newAdmin,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
