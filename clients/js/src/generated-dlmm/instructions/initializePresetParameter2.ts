import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializePresetParameter2Args {
  ix: types.InitPresetParameters2IxFields
}

export interface InitializePresetParameter2Accounts {
  presetParameter: PublicKey
  admin: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([types.InitPresetParameters2Ix.layout("ix")])

export function initializePresetParameter2(
  args: InitializePresetParameter2Args,
  accounts: InitializePresetParameter2Accounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.presetParameter, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([184, 7, 240, 171, 103, 47, 183, 121])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      ix: types.InitPresetParameters2Ix.toEncodable(args.ix),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
