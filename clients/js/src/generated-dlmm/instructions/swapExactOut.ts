import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SwapExactOutArgs {
  maxInAmount: BN
  outAmount: BN
}

export interface SwapExactOutAccounts {
  lbPair: PublicKey
  binArrayBitmapExtension: PublicKey
  reserveX: PublicKey
  reserveY: PublicKey
  userTokenIn: PublicKey
  userTokenOut: PublicKey
  tokenXMint: PublicKey
  tokenYMint: PublicKey
  oracle: PublicKey
  hostFeeIn: PublicKey
  user: PublicKey
  tokenXProgram: PublicKey
  tokenYProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  borsh.u64("maxInAmount"),
  borsh.u64("outAmount"),
])

export function swapExactOut(
  args: SwapExactOutArgs,
  accounts: SwapExactOutAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    {
      pubkey: accounts.binArrayBitmapExtension,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.reserveX, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveY, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenIn, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenOut, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenXMint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenYMint, isSigner: false, isWritable: false },
    { pubkey: accounts.oracle, isSigner: false, isWritable: true },
    { pubkey: accounts.hostFeeIn, isSigner: false, isWritable: true },
    { pubkey: accounts.user, isSigner: true, isWritable: false },
    { pubkey: accounts.tokenXProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenYProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([250, 73, 101, 33, 38, 207, 75, 184])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      maxInAmount: args.maxInAmount,
      outAmount: args.outAmount,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
