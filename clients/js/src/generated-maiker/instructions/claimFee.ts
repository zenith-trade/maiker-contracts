import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface ClaimFeeAccounts {
  authority: PublicKey
  globalConfig: PublicKey
  strategy: PublicKey
  strategyVaultX: PublicKey
  strategyVaultY: PublicKey
  position: PublicKey
  lbPair: PublicKey
  binArrayLower: PublicKey
  binArrayUpper: PublicKey
  reserveX: PublicKey
  reserveY: PublicKey
  tokenXMint: PublicKey
  tokenYMint: PublicKey
  /** The lb_clmm program */
  lbClmmProgram: PublicKey
  eventAuthority: PublicKey
  tokenProgram: PublicKey
}

export function claimFee(
  accounts: ClaimFeeAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: false },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultX, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultY, isSigner: false, isWritable: true },
    { pubkey: accounts.position, isSigner: false, isWritable: true },
    { pubkey: accounts.lbPair, isSigner: false, isWritable: true },
    { pubkey: accounts.binArrayLower, isSigner: false, isWritable: true },
    { pubkey: accounts.binArrayUpper, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveX, isSigner: false, isWritable: true },
    { pubkey: accounts.reserveY, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenXMint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenYMint, isSigner: false, isWritable: false },
    { pubkey: accounts.lbClmmProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([169, 32, 79, 137, 136, 232, 70, 137])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
