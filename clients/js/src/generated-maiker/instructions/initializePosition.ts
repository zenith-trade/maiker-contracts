import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializePositionArgs {
  lowerBinId: number
  width: number
}

export interface InitializePositionAccounts {
  authority: PublicKey
  globalConfig: PublicKey
  strategy: PublicKey
  position: PublicKey
  lbPair: PublicKey
  /** The lb_clmm program */
  lbClmmProgram: PublicKey
  eventAuthority: PublicKey
  systemProgram: PublicKey
  rent: PublicKey
}

export const layout = borsh.struct([
  borsh.i32("lowerBinId"),
  borsh.i32("width"),
])

export function initializePosition(
  args: InitializePositionArgs,
  accounts: InitializePositionAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: false },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.position, isSigner: false, isWritable: true },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: false },
    { pubkey: accounts.lbClmmProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([219, 192, 234, 71, 190, 191, 102, 80])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      lowerBinId: args.lowerBinId,
      width: args.width,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
