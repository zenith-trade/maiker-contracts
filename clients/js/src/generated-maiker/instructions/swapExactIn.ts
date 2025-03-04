import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SwapExactInArgs {
  amountIn: BN
  minAmountOut: BN
  xToY: boolean
}

export interface SwapExactInAccounts {
  /** The authority of the strategy */
  authority: PublicKey
  globalConfig: PublicKey
  strategy: PublicKey
  lbPair: PublicKey
  binArrayBitmapExtension: PublicKey
  reserveX: PublicKey
  reserveY: PublicKey
  /** The strategy vault for token X, which will be used for swapping */
  strategyVaultX: PublicKey
  /** The strategy vault for token Y, which will be used for swapping */
  strategyVaultY: PublicKey
  tokenXMint: PublicKey
  tokenYMint: PublicKey
  oracle: PublicKey
  hostFeeIn: PublicKey
  /** The lb_clmm program */
  lbClmmProgram: PublicKey
  eventAuthority: PublicKey
  /** The token program for token X */
  tokenXProgram: PublicKey
  /** The token program for token Y */
  tokenYProgram: PublicKey
}

export const layout = borsh.struct([
  borsh.u64("amountIn"),
  borsh.u64("minAmountOut"),
  borsh.bool("xToY"),
])

export function swapExactIn(
  args: SwapExactInArgs,
  accounts: SwapExactInAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    {
      pubkey: accounts.binArrayBitmapExtension,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.reserveX, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveY, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultX, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultY, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenXMint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenYMint, isSigner: false, isWritable: false },
    { pubkey: accounts.oracle, isSigner: false, isWritable: true },
    { pubkey: accounts.hostFeeIn, isSigner: false, isWritable: true },
    { pubkey: accounts.lbClmmProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenXProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenYProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([104, 104, 131, 86, 161, 189, 180, 216])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      amountIn: args.amountIn,
      minAmountOut: args.minAmountOut,
      xToY: args.xToY,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
