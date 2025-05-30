import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SwapWithPriceImpact2Args {
  amountIn: BN
  activeId: number | null
  maxPriceImpactBps: number
  remainingAccountsInfo: types.RemainingAccountsInfoFields
}

export interface SwapWithPriceImpact2Accounts {
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
  memoProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  borsh.u64("amountIn"),
  borsh.option(borsh.i32(), "activeId"),
  borsh.u16("maxPriceImpactBps"),
  types.RemainingAccountsInfo.layout("remainingAccountsInfo"),
])

export function swapWithPriceImpact2(
  args: SwapWithPriceImpact2Args,
  accounts: SwapWithPriceImpact2Accounts,
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
    { pubkey: accounts.memoProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([74, 98, 192, 214, 177, 51, 75, 51])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      amountIn: args.amountIn,
      activeId: args.activeId,
      maxPriceImpactBps: args.maxPriceImpactBps,
      remainingAccountsInfo: types.RemainingAccountsInfo.toEncodable(
        args.remainingAccountsInfo
      ),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
