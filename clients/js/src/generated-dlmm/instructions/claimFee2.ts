import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface ClaimFee2Args {
  minBinId: number
  maxBinId: number
  remainingAccountsInfo: types.RemainingAccountsInfoFields
}

export interface ClaimFee2Accounts {
  lbPair: PublicKey
  position: PublicKey
  sender: PublicKey
  reserveX: PublicKey
  reserveY: PublicKey
  userTokenX: PublicKey
  userTokenY: PublicKey
  tokenXMint: PublicKey
  tokenYMint: PublicKey
  tokenProgramX: PublicKey
  tokenProgramY: PublicKey
  memoProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  borsh.i32("minBinId"),
  borsh.i32("maxBinId"),
  types.RemainingAccountsInfo.layout("remainingAccountsInfo"),
])

export function claimFee2(
  args: ClaimFee2Args,
  accounts: ClaimFee2Accounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.position, isSigner: false, isWritable: true },
    { pubkey: accounts.sender, isSigner: true, isWritable: false },
    { pubkey: accounts.reserveX, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveY, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenX, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenY, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenXMint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenYMint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgramX, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgramY, isSigner: false, isWritable: false },
    { pubkey: accounts.memoProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([112, 191, 101, 171, 28, 144, 127, 187])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      minBinId: args.minBinId,
      maxBinId: args.maxBinId,
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
