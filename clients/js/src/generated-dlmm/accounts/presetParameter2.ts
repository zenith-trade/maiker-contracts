import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface presetParameter2Fields {
  /** Bin step. Represent the price increment / decrement. */
  binStep: number
  /** Used for base fee calculation. base_fee_rate = base_factor * bin_step * 10 * 10^base_fee_power_factor */
  baseFactor: number
  /** Filter period determine high frequency trading time window. */
  filterPeriod: number
  /** Decay period determine when the volatile fee start decay / decrease. */
  decayPeriod: number
  /** Used to scale the variable fee component depending on the dynamic of the market */
  variableFeeControl: number
  /** Maximum number of bin crossed can be accumulated. Used to cap volatile fee rate. */
  maxVolatilityAccumulator: number
  /** Reduction factor controls the volatile fee rate decrement rate. */
  reductionFactor: number
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  protocolShare: number
  /** index */
  index: number
  /** Base fee power factor */
  baseFeePowerFactor: number
  /** Padding 0 for future use */
  padding0: number
  /** Padding 1 for future use */
  padding1: Array<BN>
}

export interface presetParameter2JSON {
  /** Bin step. Represent the price increment / decrement. */
  binStep: number
  /** Used for base fee calculation. base_fee_rate = base_factor * bin_step * 10 * 10^base_fee_power_factor */
  baseFactor: number
  /** Filter period determine high frequency trading time window. */
  filterPeriod: number
  /** Decay period determine when the volatile fee start decay / decrease. */
  decayPeriod: number
  /** Used to scale the variable fee component depending on the dynamic of the market */
  variableFeeControl: number
  /** Maximum number of bin crossed can be accumulated. Used to cap volatile fee rate. */
  maxVolatilityAccumulator: number
  /** Reduction factor controls the volatile fee rate decrement rate. */
  reductionFactor: number
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  protocolShare: number
  /** index */
  index: number
  /** Base fee power factor */
  baseFeePowerFactor: number
  /** Padding 0 for future use */
  padding0: number
  /** Padding 1 for future use */
  padding1: Array<string>
}

export class presetParameter2 {
  /** Bin step. Represent the price increment / decrement. */
  readonly binStep: number
  /** Used for base fee calculation. base_fee_rate = base_factor * bin_step * 10 * 10^base_fee_power_factor */
  readonly baseFactor: number
  /** Filter period determine high frequency trading time window. */
  readonly filterPeriod: number
  /** Decay period determine when the volatile fee start decay / decrease. */
  readonly decayPeriod: number
  /** Used to scale the variable fee component depending on the dynamic of the market */
  readonly variableFeeControl: number
  /** Maximum number of bin crossed can be accumulated. Used to cap volatile fee rate. */
  readonly maxVolatilityAccumulator: number
  /** Reduction factor controls the volatile fee rate decrement rate. */
  readonly reductionFactor: number
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  readonly protocolShare: number
  /** index */
  readonly index: number
  /** Base fee power factor */
  readonly baseFeePowerFactor: number
  /** Padding 0 for future use */
  readonly padding0: number
  /** Padding 1 for future use */
  readonly padding1: Array<BN>

  static readonly discriminator = Buffer.from([
    171, 236, 148, 115, 162, 113, 222, 174,
  ])

  static readonly layout = borsh.struct([
    borsh.u16("binStep"),
    borsh.u16("baseFactor"),
    borsh.u16("filterPeriod"),
    borsh.u16("decayPeriod"),
    borsh.u32("variableFeeControl"),
    borsh.u32("maxVolatilityAccumulator"),
    borsh.u16("reductionFactor"),
    borsh.u16("protocolShare"),
    borsh.u16("index"),
    borsh.u8("baseFeePowerFactor"),
    borsh.u8("padding0"),
    borsh.array(borsh.u64(), 20, "padding1"),
  ])

  constructor(fields: presetParameter2Fields) {
    this.binStep = fields.binStep
    this.baseFactor = fields.baseFactor
    this.filterPeriod = fields.filterPeriod
    this.decayPeriod = fields.decayPeriod
    this.variableFeeControl = fields.variableFeeControl
    this.maxVolatilityAccumulator = fields.maxVolatilityAccumulator
    this.reductionFactor = fields.reductionFactor
    this.protocolShare = fields.protocolShare
    this.index = fields.index
    this.baseFeePowerFactor = fields.baseFeePowerFactor
    this.padding0 = fields.padding0
    this.padding1 = fields.padding1
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<presetParameter2 | null> {
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
  ): Promise<Array<presetParameter2 | null>> {
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

  static decode(data: Buffer): presetParameter2 {
    if (!data.slice(0, 8).equals(presetParameter2.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = presetParameter2.layout.decode(data.slice(8))

    return new presetParameter2({
      binStep: dec.binStep,
      baseFactor: dec.baseFactor,
      filterPeriod: dec.filterPeriod,
      decayPeriod: dec.decayPeriod,
      variableFeeControl: dec.variableFeeControl,
      maxVolatilityAccumulator: dec.maxVolatilityAccumulator,
      reductionFactor: dec.reductionFactor,
      protocolShare: dec.protocolShare,
      index: dec.index,
      baseFeePowerFactor: dec.baseFeePowerFactor,
      padding0: dec.padding0,
      padding1: dec.padding1,
    })
  }

  toJSON(): presetParameter2JSON {
    return {
      binStep: this.binStep,
      baseFactor: this.baseFactor,
      filterPeriod: this.filterPeriod,
      decayPeriod: this.decayPeriod,
      variableFeeControl: this.variableFeeControl,
      maxVolatilityAccumulator: this.maxVolatilityAccumulator,
      reductionFactor: this.reductionFactor,
      protocolShare: this.protocolShare,
      index: this.index,
      baseFeePowerFactor: this.baseFeePowerFactor,
      padding0: this.padding0,
      padding1: this.padding1.map((item) => item.toString()),
    }
  }

  static fromJSON(obj: presetParameter2JSON): presetParameter2 {
    return new presetParameter2({
      binStep: obj.binStep,
      baseFactor: obj.baseFactor,
      filterPeriod: obj.filterPeriod,
      decayPeriod: obj.decayPeriod,
      variableFeeControl: obj.variableFeeControl,
      maxVolatilityAccumulator: obj.maxVolatilityAccumulator,
      reductionFactor: obj.reductionFactor,
      protocolShare: obj.protocolShare,
      index: obj.index,
      baseFeePowerFactor: obj.baseFeePowerFactor,
      padding0: obj.padding0,
      padding1: obj.padding1.map((item) => new BN(item)),
    })
  }
}
