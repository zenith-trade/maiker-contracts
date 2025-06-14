import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface RemoveLiquidityByRange2Args {
  fromBinId: number
  toBinId: number
  bpsToRemove: number
  remainingAccountsInfo: types.RemainingAccountsInfoFields
}

export interface RemoveLiquidityByRange2Accounts {
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
  memoProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  borsh.i32("fromBinId"),
  borsh.i32("toBinId"),
  borsh.u16("bpsToRemove"),
  types.RemainingAccountsInfo.layout("remainingAccountsInfo"),
])

export function removeLiquidityByRange2(
  args: RemoveLiquidityByRange2Args,
  accounts: RemoveLiquidityByRange2Accounts,
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
    { pubkey: accounts.memoProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([204, 2, 195, 145, 53, 145, 145, 205])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      fromBinId: args.fromBinId,
      toBinId: args.toBinId,
      bpsToRemove: args.bpsToRemove,
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
