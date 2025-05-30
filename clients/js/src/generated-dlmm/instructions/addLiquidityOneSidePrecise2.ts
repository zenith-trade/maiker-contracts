import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface AddLiquidityOneSidePrecise2Args {
  liquidityParameter: types.AddLiquiditySingleSidePreciseParameter2Fields
  remainingAccountsInfo: types.RemainingAccountsInfoFields
}

export interface AddLiquidityOneSidePrecise2Accounts {
  position: PublicKey
  lbPair: PublicKey
  binArrayBitmapExtension: PublicKey
  userToken: PublicKey
  reserve: PublicKey
  tokenMint: PublicKey
  sender: PublicKey
  tokenProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  types.AddLiquiditySingleSidePreciseParameter2.layout("liquidityParameter"),
  types.RemainingAccountsInfo.layout("remainingAccountsInfo"),
])

export function addLiquidityOneSidePrecise2(
  args: AddLiquidityOneSidePrecise2Args,
  accounts: AddLiquidityOneSidePrecise2Accounts,
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
    { pubkey: accounts.userToken, isSigner: false, isWritable: true },
    { pubkey: accounts.reserve, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenMint, isSigner: false, isWritable: false },
    { pubkey: accounts.sender, isSigner: true, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([33, 51, 163, 201, 117, 98, 125, 231])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      liquidityParameter:
        types.AddLiquiditySingleSidePreciseParameter2.toEncodable(
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
