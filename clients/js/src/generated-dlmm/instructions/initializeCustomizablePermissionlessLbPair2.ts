import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializeCustomizablePermissionlessLbPair2Args {
  params: types.CustomizableParamsFields
}

export interface InitializeCustomizablePermissionlessLbPair2Accounts {
  lbPair: PublicKey
  binArrayBitmapExtension: PublicKey
  tokenMintX: PublicKey
  tokenMintY: PublicKey
  reserveX: PublicKey
  reserveY: PublicKey
  oracle: PublicKey
  userTokenX: PublicKey
  funder: PublicKey
  tokenBadgeX: PublicKey
  tokenBadgeY: PublicKey
  tokenProgramX: PublicKey
  tokenProgramY: PublicKey
  systemProgram: PublicKey
  userTokenY: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([types.CustomizableParams.layout("params")])

export function initializeCustomizablePermissionlessLbPair2(
  args: InitializeCustomizablePermissionlessLbPair2Args,
  accounts: InitializeCustomizablePermissionlessLbPair2Accounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    {
      pubkey: accounts.binArrayBitmapExtension,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.tokenMintX, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenMintY, isSigner: false, isWritable: false },
    { pubkey: accounts.reserveX, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveY, isSigner: false, isWritable: true },
    { pubkey: accounts.oracle, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenX, isSigner: false, isWritable: false },
    { pubkey: accounts.funder, isSigner: true, isWritable: true },
    { pubkey: accounts.tokenBadgeX, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenBadgeY, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgramX, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgramY, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.userTokenY, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([243, 73, 129, 126, 51, 19, 241, 107])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      params: types.CustomizableParams.toEncodable(args.params),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
