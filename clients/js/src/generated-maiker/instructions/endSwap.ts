import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface EndSwapArgs {
  xToY: boolean
}

export interface EndSwapAccounts {
  authority: PublicKey
  globalConfig: PublicKey
  strategy: PublicKey
  inVault: PublicKey
  outVault: PublicKey
  inAdminAta: PublicKey
  outAdminAta: PublicKey
  inMint: PublicKey
  outMint: PublicKey
  tokenProgram: PublicKey
  instructionsSysvar: PublicKey
}

export const layout = borsh.struct([borsh.bool("xToY")])

export function endSwap(
  args: EndSwapArgs,
  accounts: EndSwapAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.inVault, isSigner: false, isWritable: true },
    { pubkey: accounts.outVault, isSigner: false, isWritable: true },
    { pubkey: accounts.inAdminAta, isSigner: false, isWritable: true },
    { pubkey: accounts.outAdminAta, isSigner: false, isWritable: true },
    { pubkey: accounts.inMint, isSigner: false, isWritable: false },
    { pubkey: accounts.outMint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.instructionsSysvar, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([177, 184, 27, 193, 34, 13, 210, 145])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      xToY: args.xToY,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
