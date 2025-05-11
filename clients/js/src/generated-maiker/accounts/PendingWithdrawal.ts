import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface PendingWithdrawalFields {
  user: PublicKey
  strategy: PublicKey
  sharesAmount: BN
  fullSharesAmount: BN
  tokenAmount: BN
  initiationTimestamp: BN
  availableTimestamp: BN
  bump: number
}

export interface PendingWithdrawalJSON {
  user: string
  strategy: string
  sharesAmount: string
  fullSharesAmount: string
  tokenAmount: string
  initiationTimestamp: string
  availableTimestamp: string
  bump: number
}

export class PendingWithdrawal {
  readonly user: PublicKey
  readonly strategy: PublicKey
  readonly sharesAmount: BN
  readonly fullSharesAmount: BN
  readonly tokenAmount: BN
  readonly initiationTimestamp: BN
  readonly availableTimestamp: BN
  readonly bump: number

  static readonly discriminator = Buffer.from([
    61, 103, 179, 177, 148, 199, 63, 171,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("user"),
    borsh.publicKey("strategy"),
    borsh.u64("sharesAmount"),
    borsh.u64("fullSharesAmount"),
    borsh.u64("tokenAmount"),
    borsh.i64("initiationTimestamp"),
    borsh.i64("availableTimestamp"),
    borsh.u8("bump"),
  ])

  constructor(fields: PendingWithdrawalFields) {
    this.user = fields.user
    this.strategy = fields.strategy
    this.sharesAmount = fields.sharesAmount
    this.fullSharesAmount = fields.fullSharesAmount
    this.tokenAmount = fields.tokenAmount
    this.initiationTimestamp = fields.initiationTimestamp
    this.availableTimestamp = fields.availableTimestamp
    this.bump = fields.bump
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<PendingWithdrawal | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID
  ): Promise<Array<PendingWithdrawal | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): PendingWithdrawal {
    if (!data.slice(0, 8).equals(PendingWithdrawal.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = PendingWithdrawal.layout.decode(data.slice(8))

    return new PendingWithdrawal({
      user: dec.user,
      strategy: dec.strategy,
      sharesAmount: dec.sharesAmount,
      fullSharesAmount: dec.fullSharesAmount,
      tokenAmount: dec.tokenAmount,
      initiationTimestamp: dec.initiationTimestamp,
      availableTimestamp: dec.availableTimestamp,
      bump: dec.bump,
    })
  }

  toJSON(): PendingWithdrawalJSON {
    return {
      user: this.user.toString(),
      strategy: this.strategy.toString(),
      sharesAmount: this.sharesAmount.toString(),
      fullSharesAmount: this.fullSharesAmount.toString(),
      tokenAmount: this.tokenAmount.toString(),
      initiationTimestamp: this.initiationTimestamp.toString(),
      availableTimestamp: this.availableTimestamp.toString(),
      bump: this.bump,
    }
  }

  static fromJSON(obj: PendingWithdrawalJSON): PendingWithdrawal {
    return new PendingWithdrawal({
      user: new PublicKey(obj.user),
      strategy: new PublicKey(obj.strategy),
      sharesAmount: new BN(obj.sharesAmount),
      fullSharesAmount: new BN(obj.fullSharesAmount),
      tokenAmount: new BN(obj.tokenAmount),
      initiationTimestamp: new BN(obj.initiationTimestamp),
      availableTimestamp: new BN(obj.availableTimestamp),
      bump: obj.bump,
    })
  }
}
