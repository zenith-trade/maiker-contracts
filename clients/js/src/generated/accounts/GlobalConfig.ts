import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface GlobalConfigFields {
  admin: PublicKey
  performanceFeeBps: number
  withdrawalFeeBps: number
  treasury: PublicKey
  bump: number
}

export interface GlobalConfigJSON {
  admin: string
  performanceFeeBps: number
  withdrawalFeeBps: number
  treasury: string
  bump: number
}

export class GlobalConfig {
  readonly admin: PublicKey
  readonly performanceFeeBps: number
  readonly withdrawalFeeBps: number
  readonly treasury: PublicKey
  readonly bump: number

  static readonly discriminator = Buffer.from([
    149, 8, 156, 202, 160, 252, 176, 217,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("admin"),
    borsh.u16("performanceFeeBps"),
    borsh.u16("withdrawalFeeBps"),
    borsh.publicKey("treasury"),
    borsh.u8("bump"),
  ])

  constructor(fields: GlobalConfigFields) {
    this.admin = fields.admin
    this.performanceFeeBps = fields.performanceFeeBps
    this.withdrawalFeeBps = fields.withdrawalFeeBps
    this.treasury = fields.treasury
    this.bump = fields.bump
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<GlobalConfig | null> {
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
  ): Promise<Array<GlobalConfig | null>> {
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

  static decode(data: Buffer): GlobalConfig {
    if (!data.slice(0, 8).equals(GlobalConfig.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = GlobalConfig.layout.decode(data.slice(8))

    return new GlobalConfig({
      admin: dec.admin,
      performanceFeeBps: dec.performanceFeeBps,
      withdrawalFeeBps: dec.withdrawalFeeBps,
      treasury: dec.treasury,
      bump: dec.bump,
    })
  }

  toJSON(): GlobalConfigJSON {
    return {
      admin: this.admin.toString(),
      performanceFeeBps: this.performanceFeeBps,
      withdrawalFeeBps: this.withdrawalFeeBps,
      treasury: this.treasury.toString(),
      bump: this.bump,
    }
  }

  static fromJSON(obj: GlobalConfigJSON): GlobalConfig {
    return new GlobalConfig({
      admin: new PublicKey(obj.admin),
      performanceFeeBps: obj.performanceFeeBps,
      withdrawalFeeBps: obj.withdrawalFeeBps,
      treasury: new PublicKey(obj.treasury),
      bump: obj.bump,
    })
  }
}
