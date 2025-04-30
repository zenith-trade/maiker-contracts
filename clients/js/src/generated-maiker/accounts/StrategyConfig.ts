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
  feeShares: BN
  positionCount: number
  positions: Array<PublicKey>
  positionsValues: Array<BN>
  lastPositionUpdate: Array<BN>
  lastRebalanceTime: BN
  isSwapping: boolean
  swapAmountIn: BN
  swapSourceMint: PublicKey
  swapDestinationMint: PublicKey
  swapInitialInAmountAdmin: BN
  swapInitialOutAmountAdmin: BN
  bump: number
}

export interface StrategyConfigJSON {
  creator: string
  xMint: string
  yMint: string
  xVault: string
  yVault: string
  strategyShares: string
  feeShares: string
  positionCount: number
  positions: Array<string>
  positionsValues: Array<string>
  lastPositionUpdate: Array<string>
  lastRebalanceTime: string
  isSwapping: boolean
  swapAmountIn: string
  swapSourceMint: string
  swapDestinationMint: string
  swapInitialInAmountAdmin: string
  swapInitialOutAmountAdmin: string
  bump: number
}

export class StrategyConfig {
  readonly creator: PublicKey
  readonly xMint: PublicKey
  readonly yMint: PublicKey
  readonly xVault: PublicKey
  readonly yVault: PublicKey
  readonly strategyShares: BN
  readonly feeShares: BN
  readonly positionCount: number
  readonly positions: Array<PublicKey>
  readonly positionsValues: Array<BN>
  readonly lastPositionUpdate: Array<BN>
  readonly lastRebalanceTime: BN
  readonly isSwapping: boolean
  readonly swapAmountIn: BN
  readonly swapSourceMint: PublicKey
  readonly swapDestinationMint: PublicKey
  readonly swapInitialInAmountAdmin: BN
  readonly swapInitialOutAmountAdmin: BN
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
    borsh.u64("feeShares"),
    borsh.u8("positionCount"),
    borsh.array(borsh.publicKey(), 10, "positions"),
    borsh.array(borsh.u64(), 10, "positionsValues"),
    borsh.array(borsh.u64(), 10, "lastPositionUpdate"),
    borsh.i64("lastRebalanceTime"),
    borsh.bool("isSwapping"),
    borsh.u64("swapAmountIn"),
    borsh.publicKey("swapSourceMint"),
    borsh.publicKey("swapDestinationMint"),
    borsh.u64("swapInitialInAmountAdmin"),
    borsh.u64("swapInitialOutAmountAdmin"),
    borsh.u8("bump"),
  ])

  constructor(fields: StrategyConfigFields) {
    this.creator = fields.creator
    this.xMint = fields.xMint
    this.yMint = fields.yMint
    this.xVault = fields.xVault
    this.yVault = fields.yVault
    this.strategyShares = fields.strategyShares
    this.feeShares = fields.feeShares
    this.positionCount = fields.positionCount
    this.positions = fields.positions
    this.positionsValues = fields.positionsValues
    this.lastPositionUpdate = fields.lastPositionUpdate
    this.lastRebalanceTime = fields.lastRebalanceTime
    this.isSwapping = fields.isSwapping
    this.swapAmountIn = fields.swapAmountIn
    this.swapSourceMint = fields.swapSourceMint
    this.swapDestinationMint = fields.swapDestinationMint
    this.swapInitialInAmountAdmin = fields.swapInitialInAmountAdmin
    this.swapInitialOutAmountAdmin = fields.swapInitialOutAmountAdmin
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
      feeShares: dec.feeShares,
      positionCount: dec.positionCount,
      positions: dec.positions,
      positionsValues: dec.positionsValues,
      lastPositionUpdate: dec.lastPositionUpdate,
      lastRebalanceTime: dec.lastRebalanceTime,
      isSwapping: dec.isSwapping,
      swapAmountIn: dec.swapAmountIn,
      swapSourceMint: dec.swapSourceMint,
      swapDestinationMint: dec.swapDestinationMint,
      swapInitialInAmountAdmin: dec.swapInitialInAmountAdmin,
      swapInitialOutAmountAdmin: dec.swapInitialOutAmountAdmin,
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
      feeShares: this.feeShares.toString(),
      positionCount: this.positionCount,
      positions: this.positions.map((item) => item.toString()),
      positionsValues: this.positionsValues.map((item) => item.toString()),
      lastPositionUpdate: this.lastPositionUpdate.map((item) =>
        item.toString()
      ),
      lastRebalanceTime: this.lastRebalanceTime.toString(),
      isSwapping: this.isSwapping,
      swapAmountIn: this.swapAmountIn.toString(),
      swapSourceMint: this.swapSourceMint.toString(),
      swapDestinationMint: this.swapDestinationMint.toString(),
      swapInitialInAmountAdmin: this.swapInitialInAmountAdmin.toString(),
      swapInitialOutAmountAdmin: this.swapInitialOutAmountAdmin.toString(),
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
      feeShares: new BN(obj.feeShares),
      positionCount: obj.positionCount,
      positions: obj.positions.map((item) => new PublicKey(item)),
      positionsValues: obj.positionsValues.map((item) => new BN(item)),
      lastPositionUpdate: obj.lastPositionUpdate.map((item) => new BN(item)),
      lastRebalanceTime: new BN(obj.lastRebalanceTime),
      isSwapping: obj.isSwapping,
      swapAmountIn: new BN(obj.swapAmountIn),
      swapSourceMint: new PublicKey(obj.swapSourceMint),
      swapDestinationMint: new PublicKey(obj.swapDestinationMint),
      swapInitialInAmountAdmin: new BN(obj.swapInitialInAmountAdmin),
      swapInitialOutAmountAdmin: new BN(obj.swapInitialOutAmountAdmin),
      bump: obj.bump,
    })
  }
}
