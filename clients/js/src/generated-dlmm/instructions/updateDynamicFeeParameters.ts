import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UpdateDynamicFeeParametersArgs {
  feeParameter: types.DynamicFeeParameterFields
}

export interface UpdateDynamicFeeParametersAccounts {
  lbPair: PublicKey
  admin: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  types.DynamicFeeParameter.layout("feeParameter"),
])

export function updateDynamicFeeParameters(
  args: UpdateDynamicFeeParametersArgs,
  accounts: UpdateDynamicFeeParametersAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([92, 161, 46, 246, 255, 189, 22, 22])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      feeParameter: types.DynamicFeeParameter.toEncodable(args.feeParameter),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
