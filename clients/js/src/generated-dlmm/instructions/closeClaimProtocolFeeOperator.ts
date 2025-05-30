import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CloseClaimProtocolFeeOperatorAccounts {
  claimFeeOperator: PublicKey
  rentReceiver: PublicKey
  admin: PublicKey
}

export function closeClaimProtocolFeeOperator(
  accounts: CloseClaimProtocolFeeOperatorAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.claimFeeOperator, isSigner: false, isWritable: true },
    { pubkey: accounts.rentReceiver, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: false },
  ]
  const identifier = Buffer.from([8, 41, 87, 35, 80, 48, 121, 26])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
