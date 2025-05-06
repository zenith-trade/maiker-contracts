import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CreateStrategyArgs {
  params: types.CreateStrategyMetadataParamsFields
}

export interface CreateStrategyAccounts {
  creator: PublicKey
  xMint: PublicKey
  yMint: PublicKey
  xVault: PublicKey
  yVault: PublicKey
  mTokenMint: PublicKey
  metadata: PublicKey
  strategy: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
  systemProgram: PublicKey
  rent: PublicKey
  tokenMetadataProgram: PublicKey
}

export const layout = borsh.struct([
  types.CreateStrategyMetadataParams.layout("params"),
])

export function createStrategy(
  args: CreateStrategyArgs,
  accounts: CreateStrategyAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.creator, isSigner: true, isWritable: true },
    { pubkey: accounts.xMint, isSigner: false, isWritable: false },
    { pubkey: accounts.yMint, isSigner: false, isWritable: false },
    { pubkey: accounts.xVault, isSigner: false, isWritable: false },
    { pubkey: accounts.yVault, isSigner: false, isWritable: false },
    { pubkey: accounts.mTokenMint, isSigner: false, isWritable: true },
    { pubkey: accounts.metadata, isSigner: false, isWritable: true },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
    {
      pubkey: accounts.tokenMetadataProgram,
      isSigner: false,
      isWritable: false,
    },
  ]
  const identifier = Buffer.from([152, 160, 107, 148, 245, 190, 127, 224])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      params: types.CreateStrategyMetadataParams.toEncodable(args.params),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
