import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UpdateBaseFeeParametersArgs {
  feeParameter: types.BaseFeeParameterFields
}

export interface UpdateBaseFeeParametersAccounts {
  lbPair: PublicKey
  admin: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  types.BaseFeeParameter.layout("feeParameter"),
])

export function updateBaseFeeParameters(
  args: UpdateBaseFeeParametersArgs,
  accounts: UpdateBaseFeeParametersAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([75, 168, 223, 161, 16, 195, 3, 47])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      feeParameter: types.BaseFeeParameter.toEncodable(args.feeParameter),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
