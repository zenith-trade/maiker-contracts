import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface InitPresetParametersIxFields {
  /** Bin step. Represent the price increment / decrement. */
  binStep: number
  /** Used for base fee calculation. base_fee_rate = base_factor * bin_step * 10 * 10^base_fee_power_factor */
  baseFactor: number
  /** Filter period determine high frequency trading time window. */
  filterPeriod: number
  /** Decay period determine when the volatile fee start decay / decrease. */
  decayPeriod: number
  /** Reduction factor controls the volatile fee rate decrement rate. */
  reductionFactor: number
  /** Used to scale the variable fee component depending on the dynamic of the market */
  variableFeeControl: number
  /** Maximum number of bin crossed can be accumulated. Used to cap volatile fee rate. */
  maxVolatilityAccumulator: number
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  protocolShare: number
}

export interface InitPresetParametersIxJSON {
  /** Bin step. Represent the price increment / decrement. */
  binStep: number
  /** Used for base fee calculation. base_fee_rate = base_factor * bin_step * 10 * 10^base_fee_power_factor */
  baseFactor: number
  /** Filter period determine high frequency trading time window. */
  filterPeriod: number
  /** Decay period determine when the volatile fee start decay / decrease. */
  decayPeriod: number
  /** Reduction factor controls the volatile fee rate decrement rate. */
  reductionFactor: number
  /** Used to scale the variable fee component depending on the dynamic of the market */
  variableFeeControl: number
  /** Maximum number of bin crossed can be accumulated. Used to cap volatile fee rate. */
  maxVolatilityAccumulator: number
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  protocolShare: number
}

export class InitPresetParametersIx {
  /** Bin step. Represent the price increment / decrement. */
  readonly binStep: number
  /** Used for base fee calculation. base_fee_rate = base_factor * bin_step * 10 * 10^base_fee_power_factor */
  readonly baseFactor: number
  /** Filter period determine high frequency trading time window. */
  readonly filterPeriod: number
  /** Decay period determine when the volatile fee start decay / decrease. */
  readonly decayPeriod: number
  /** Reduction factor controls the volatile fee rate decrement rate. */
  readonly reductionFactor: number
  /** Used to scale the variable fee component depending on the dynamic of the market */
  readonly variableFeeControl: number
  /** Maximum number of bin crossed can be accumulated. Used to cap volatile fee rate. */
  readonly maxVolatilityAccumulator: number
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  readonly protocolShare: number

  constructor(fields: InitPresetParametersIxFields) {
    this.binStep = fields.binStep
    this.baseFactor = fields.baseFactor
    this.filterPeriod = fields.filterPeriod
    this.decayPeriod = fields.decayPeriod
    this.reductionFactor = fields.reductionFactor
    this.variableFeeControl = fields.variableFeeControl
    this.maxVolatilityAccumulator = fields.maxVolatilityAccumulator
    this.protocolShare = fields.protocolShare
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u16("binStep"),
        borsh.u16("baseFactor"),
        borsh.u16("filterPeriod"),
        borsh.u16("decayPeriod"),
        borsh.u16("reductionFactor"),
        borsh.u32("variableFeeControl"),
        borsh.u32("maxVolatilityAccumulator"),
        borsh.u16("protocolShare"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new InitPresetParametersIx({
      binStep: obj.binStep,
      baseFactor: obj.baseFactor,
      filterPeriod: obj.filterPeriod,
      decayPeriod: obj.decayPeriod,
      reductionFactor: obj.reductionFactor,
      variableFeeControl: obj.variableFeeControl,
      maxVolatilityAccumulator: obj.maxVolatilityAccumulator,
      protocolShare: obj.protocolShare,
    })
  }

  static toEncodable(fields: InitPresetParametersIxFields) {
    return {
      binStep: fields.binStep,
      baseFactor: fields.baseFactor,
      filterPeriod: fields.filterPeriod,
      decayPeriod: fields.decayPeriod,
      reductionFactor: fields.reductionFactor,
      variableFeeControl: fields.variableFeeControl,
      maxVolatilityAccumulator: fields.maxVolatilityAccumulator,
      protocolShare: fields.protocolShare,
    }
  }

  toJSON(): InitPresetParametersIxJSON {
    return {
      binStep: this.binStep,
      baseFactor: this.baseFactor,
      filterPeriod: this.filterPeriod,
      decayPeriod: this.decayPeriod,
      reductionFactor: this.reductionFactor,
      variableFeeControl: this.variableFeeControl,
      maxVolatilityAccumulator: this.maxVolatilityAccumulator,
      protocolShare: this.protocolShare,
    }
  }

  static fromJSON(obj: InitPresetParametersIxJSON): InitPresetParametersIx {
    return new InitPresetParametersIx({
      binStep: obj.binStep,
      baseFactor: obj.baseFactor,
      filterPeriod: obj.filterPeriod,
      decayPeriod: obj.decayPeriod,
      reductionFactor: obj.reductionFactor,
      variableFeeControl: obj.variableFeeControl,
      maxVolatilityAccumulator: obj.maxVolatilityAccumulator,
      protocolShare: obj.protocolShare,
    })
  }

  toEncodable() {
    return InitPresetParametersIx.toEncodable(this)
  }
}
