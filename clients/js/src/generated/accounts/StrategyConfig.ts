import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface StrategyConfigFields {
  creator: PublicKey
  xMint: PublicKey
  yMint: PublicKey
  xVault: PublicKey
  yVault: PublicKey
  strategyShares: BN
  feeSharesPending: BN
  positionCount: number
  positions: Array<PublicKey>
  lastRebalanceTime: BN
  bump: number
}

export interface StrategyConfigJSON {
  creator: string
  xMint: string
  yMint: string
  xVault: string
  yVault: string
  strategyShares: string
  feeSharesPending: string
  positionCount: number
  positions: Array<string>
  lastRebalanceTime: string
  bump: number
}

export class StrategyConfig {
  readonly creator: PublicKey
  readonly xMint: PublicKey
  readonly yMint: PublicKey
  readonly xVault: PublicKey
  readonly yVault: PublicKey
  readonly strategyShares: BN
  readonly feeSharesPending: BN
  readonly positionCount: number
  readonly positions: Array<PublicKey>
  readonly lastRebalanceTime: BN
  readonly bump: number

  static readonly discriminator = Buffer.from([
    103, 12, 123, 61, 47, 87, 129, 57,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("creator"),
    borsh.publicKey("xMint"),
    borsh.publicKey("yMint"),
    borsh.publicKey("xVault"),
    borsh.publicKey("yVault"),
    borsh.u64("strategyShares"),
    borsh.u64("feeSharesPending"),
    borsh.u8("positionCount"),
    borsh.array(borsh.publicKey(), 10, "positions"),
    borsh.i64("lastRebalanceTime"),
    borsh.u8("bump"),
  ])

  constructor(fields: StrategyConfigFields) {
    this.creator = fields.creator
    this.xMint = fields.xMint
    this.yMint = fields.yMint
    this.xVault = fields.xVault
    this.yVault = fields.yVault
    this.strategyShares = fields.strategyShares
    this.feeSharesPending = fields.feeSharesPending
    this.positionCount = fields.positionCount
    this.positions = fields.positions
    this.lastRebalanceTime = fields.lastRebalanceTime
    this.bump = fields.bump
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<StrategyConfig | null> {
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
  ): Promise<Array<StrategyConfig | null>> {
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

  static decode(data: Buffer): StrategyConfig {
    if (!data.slice(0, 8).equals(StrategyConfig.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = StrategyConfig.layout.decode(data.slice(8))

    return new StrategyConfig({
      creator: dec.creator,
      xMint: dec.xMint,
      yMint: dec.yMint,
      xVault: dec.xVault,
      yVault: dec.yVault,
      strategyShares: dec.strategyShares,
      feeSharesPending: dec.feeSharesPending,
      positionCount: dec.positionCount,
      positions: dec.positions,
      lastRebalanceTime: dec.lastRebalanceTime,
      bump: dec.bump,
    })
  }

  toJSON(): StrategyConfigJSON {
    return {
      creator: this.creator.toString(),
      xMint: this.xMint.toString(),
      yMint: this.yMint.toString(),
      xVault: this.xVault.toString(),
      yVault: this.yVault.toString(),
      strategyShares: this.strategyShares.toString(),
      feeSharesPending: this.feeSharesPending.toString(),
      positionCount: this.positionCount,
      positions: this.positions.map((item) => item.toString()),
      lastRebalanceTime: this.lastRebalanceTime.toString(),
      bump: this.bump,
    }
  }

  static fromJSON(obj: StrategyConfigJSON): StrategyConfig {
    return new StrategyConfig({
      creator: new PublicKey(obj.creator),
      xMint: new PublicKey(obj.xMint),
      yMint: new PublicKey(obj.yMint),
      xVault: new PublicKey(obj.xVault),
      yVault: new PublicKey(obj.yVault),
      strategyShares: new BN(obj.strategyShares),
      feeSharesPending: new BN(obj.feeSharesPending),
      positionCount: obj.positionCount,
      positions: obj.positions.map((item) => new PublicKey(item)),
      lastRebalanceTime: new BN(obj.lastRebalanceTime),
      bump: obj.bump,
    })
  }
}
