import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface AddLiquidityByStrategy2Args {
  liquidityParameter: types.LiquidityParameterByStrategyFields
  remainingAccountsInfo: types.RemainingAccountsInfoFields
}

export interface AddLiquidityByStrategy2Accounts {
  position: PublicKey
  lbPair: PublicKey
  binArrayBitmapExtension: PublicKey
  userTokenX: PublicKey
  userTokenY: PublicKey
  reserveX: PublicKey
  reserveY: PublicKey
  tokenXMint: PublicKey
  tokenYMint: PublicKey
  sender: PublicKey
  tokenXProgram: PublicKey
  tokenYProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  types.LiquidityParameterByStrategy.layout("liquidityParameter"),
  types.RemainingAccountsInfo.layout("remainingAccountsInfo"),
])

export function addLiquidityByStrategy2(
  args: AddLiquidityByStrategy2Args,
  accounts: AddLiquidityByStrategy2Accounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.position, isSigner: false, isWritable: true },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    {
      pubkey: accounts.binArrayBitmapExtension,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.userTokenX, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenY, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveX, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveY, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenXMint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenYMint, isSigner: false, isWritable: false },
    { pubkey: accounts.sender, isSigner: true, isWritable: false },
    { pubkey: accounts.tokenXProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenYProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([3, 221, 149, 218, 111, 141, 118, 213])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      liquidityParameter: types.LiquidityParameterByStrategy.toEncodable(
        args.liquidityParameter
      ),
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
