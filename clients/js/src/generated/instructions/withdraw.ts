import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface WithdrawArgs {
  sharesAmount: BN
}

export interface WithdrawAccounts {
  user: PublicKey
  strategy: PublicKey
  userPosition: PublicKey
  userTokenX: PublicKey
  userTokenY: PublicKey
  strategyVaultX: PublicKey
  strategyVaultY: PublicKey
  globalConfig: PublicKey
  treasuryX: PublicKey
  treasuryY: PublicKey
  tokenProgram: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([borsh.u64("sharesAmount")])

export function withdraw(
  args: WithdrawArgs,
  accounts: WithdrawAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.strategy, isSigner: false, isWritable: true },
    { pubkey: accounts.userPosition, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenX, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenY, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultX, isSigner: false, isWritable: true },
    { pubkey: accounts.strategyVaultY, isSigner: false, isWritable: true },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.treasuryX, isSigner: false, isWritable: true },
    { pubkey: accounts.treasuryY, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([183, 18, 70, 156, 148, 109, 161, 34])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      sharesAmount: args.sharesAmount,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
