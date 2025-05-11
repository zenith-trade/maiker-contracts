import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface ClaimFeesArgs {
  sharesToClaim: BN | null
}

export interface ClaimFeesAccounts {
  authority: PublicKey
  globalConfig: PublicKey
  strategy: PublicKey
  strategyVaultX: PublicKey
  treasuryX: PublicKey
  mTokenMint: PublicKey
  strategyMTokenAta: PublicKey
  tokenProgram: PublicKey
}

export const layout = borsh.struct([borsh.option(borsh.u64(), "sharesToClaim")])

export function claimFees(
  args: ClaimFeesArgs,
  accounts: ClaimFeesAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: false },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultX, isSigner: false, isWritable: true },
    { pubkey: accounts.treasuryX, isSigner: false, isWritable: true },
    { pubkey: accounts.mTokenMint, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyMTokenAta, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([82, 251, 233, 156, 12, 52, 184, 202])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      sharesToClaim: args.sharesToClaim,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
