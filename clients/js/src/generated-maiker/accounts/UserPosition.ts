import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UserPositionFields {
  user: PublicKey
  strategy: PublicKey
  strategyShare: BN
  lastShareValue: BN
  lastUpdateTimestamp: BN
  bump: number
}

export interface UserPositionJSON {
  user: string
  strategy: string
  strategyShare: string
  lastShareValue: string
  lastUpdateTimestamp: string
  bump: number
}

export class UserPosition {
  readonly user: PublicKey
  readonly strategy: PublicKey
  readonly strategyShare: BN
  readonly lastShareValue: BN
  readonly lastUpdateTimestamp: BN
  readonly bump: number

  static readonly discriminator = Buffer.from([
    251, 248, 209, 245, 83, 234, 17, 27,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("user"),
    borsh.publicKey("strategy"),
    borsh.u64("strategyShare"),
    borsh.u64("lastShareValue"),
    borsh.i64("lastUpdateTimestamp"),
    borsh.u8("bump"),
  ])

  constructor(fields: UserPositionFields) {
    this.user = fields.user
    this.strategy = fields.strategy
    this.strategyShare = fields.strategyShare
    this.lastShareValue = fields.lastShareValue
    this.lastUpdateTimestamp = fields.lastUpdateTimestamp
    this.bump = fields.bump
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<UserPosition | null> {
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
  ): Promise<Array<UserPosition | null>> {
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

  static decode(data: Buffer): UserPosition {
    if (!data.slice(0, 8).equals(UserPosition.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = UserPosition.layout.decode(data.slice(8))

    return new UserPosition({
      user: dec.user,
      strategy: dec.strategy,
      strategyShare: dec.strategyShare,
      lastShareValue: dec.lastShareValue,
      lastUpdateTimestamp: dec.lastUpdateTimestamp,
      bump: dec.bump,
    })
  }

  toJSON(): UserPositionJSON {
    return {
      user: this.user.toString(),
      strategy: this.strategy.toString(),
      strategyShare: this.strategyShare.toString(),
      lastShareValue: this.lastShareValue.toString(),
      lastUpdateTimestamp: this.lastUpdateTimestamp.toString(),
      bump: this.bump,
    }
  }

  static fromJSON(obj: UserPositionJSON): UserPosition {
    return new UserPosition({
      user: new PublicKey(obj.user),
      strategy: new PublicKey(obj.strategy),
      strategyShare: new BN(obj.strategyShare),
      lastShareValue: new BN(obj.lastShareValue),
      lastUpdateTimestamp: new BN(obj.lastUpdateTimestamp),
      bump: obj.bump,
    })
  }
}
