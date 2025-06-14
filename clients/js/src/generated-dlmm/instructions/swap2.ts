import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface Swap2Args {
  amountIn: BN
  minAmountOut: BN
  remainingAccountsInfo: types.RemainingAccountsInfoFields
}

export interface Swap2Accounts {
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
  borsh.u64("minAmountOut"),
  types.RemainingAccountsInfo.layout("remainingAccountsInfo"),
])

export function swap2(
  args: Swap2Args,
  accounts: Swap2Accounts,
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
  const identifier = Buffer.from([65, 75, 63, 76, 235, 91, 91, 136])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      amountIn: args.amountIn,
      minAmountOut: args.minAmountOut,
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
