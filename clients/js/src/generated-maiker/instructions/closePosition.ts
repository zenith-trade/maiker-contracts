import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface ClosePositionAccounts {
  authority: PublicKey
  globalConfig: PublicKey
  strategy: PublicKey
  position: PublicKey
  lbPair: PublicKey
  binArrayLower: PublicKey
  binArrayUpper: PublicKey
  rentReceiver: PublicKey
  /** The lb_clmm program */
  lbClmmProgram: PublicKey
  eventAuthority: PublicKey
}

export function closePosition(
  accounts: ClosePositionAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: false },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.position, isSigner: false, isWritable: true },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.binArrayLower, isSigner: false, isWritable: true },
    { pubkey: accounts.binArrayUpper, isSigner: false, isWritable: true },
    { pubkey: accounts.rentReceiver, isSigner: false, isWritable: true },
    { pubkey: accounts.lbClmmProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([123, 134, 81, 0, 49, 68, 98, 98])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
