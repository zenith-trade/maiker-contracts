import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializePositionByOperatorArgs {
  lowerBinId: number
  width: number
  feeOwner: PublicKey
  lockReleasePoint: BN
}

export interface InitializePositionByOperatorAccounts {
  payer: PublicKey
  base: PublicKey
  position: PublicKey
  lbPair: PublicKey
  owner: PublicKey
  /** operator */
  operator: PublicKey
  operatorTokenX: PublicKey
  ownerTokenX: PublicKey
  systemProgram: PublicKey
  eventAuthority: PublicKey
  program: PublicKey
}

export const layout = borsh.struct([
  borsh.i32("lowerBinId"),
  borsh.i32("width"),
  borsh.publicKey("feeOwner"),
  borsh.u64("lockReleasePoint"),
])

export function initializePositionByOperator(
  args: InitializePositionByOperatorArgs,
  accounts: InitializePositionByOperatorAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.payer, isSigner: true, isWritable: true },
    { pubkey: accounts.base, isSigner: true, isWritable: false },
    { pubkey: accounts.position, isSigner: false, isWritable: true },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: false },
    { pubkey: accounts.owner, isSigner: false, isWritable: false },
    { pubkey: accounts.operator, isSigner: true, isWritable: false },
    { pubkey: accounts.operatorTokenX, isSigner: false, isWritable: false },
    { pubkey: accounts.ownerTokenX, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([251, 189, 190, 244, 117, 254, 35, 148])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      lowerBinId: args.lowerBinId,
      width: args.width,
      feeOwner: args.feeOwner,
      lockReleasePoint: args.lockReleasePoint,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
