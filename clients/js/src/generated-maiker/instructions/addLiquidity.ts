import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface AddLiquidityArgs {
  liquidityParameter: types.LiquidityParameterByWeightFields
}

export interface AddLiquidityAccounts {
  /** The authority of the strategy */
  authority: PublicKey
  globalConfig: PublicKey
  strategy: PublicKey
  /** CPI accounts below */
  position: PublicKey
  lbPair: PublicKey
  tokenXMint: PublicKey
  tokenYMint: PublicKey
  /** The strategy vault for token X */
  strategyVaultX: PublicKey
  /** The strategy vault for token Y */
  strategyVaultY: PublicKey
  reserveX: PublicKey
  reserveY: PublicKey
  binArrayLower: PublicKey
  binArrayUpper: PublicKey
  binArrayBitmapExtension: PublicKey
  /** The lb_clmm program */
  lbClmmProgram: PublicKey
  eventAuthority: PublicKey
  /** The token program */
  tokenProgram: PublicKey
  /** The system program */
  systemProgram: PublicKey
}

export const layout = borsh.struct([
  types.LiquidityParameterByWeight.layout("liquidityParameter"),
])

export function addLiquidity(
  args: AddLiquidityArgs,
  accounts: AddLiquidityAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.position, isSigner: false, isWritable: true },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenXMint, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenYMint, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultX, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultY, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveX, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveY, isSigner: false, isWritable: true },
    { pubkey: accounts.binArrayLower, isSigner: false, isWritable: true },
    { pubkey: accounts.binArrayUpper, isSigner: false, isWritable: true },
    {
      pubkey: accounts.binArrayBitmapExtension,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.lbClmmProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([181, 157, 89, 67, 143, 182, 52, 72])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      liquidityParameter: types.LiquidityParameterByWeight.toEncodable(
        args.liquidityParameter
      ),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
