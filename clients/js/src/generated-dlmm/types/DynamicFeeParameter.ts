import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface DynamicFeeParameterFields {
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
}

export interface DynamicFeeParameterJSON {
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
}

export class DynamicFeeParameter {
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

  constructor(fields: DynamicFeeParameterFields) {
    this.filterPeriod = fields.filterPeriod
    this.decayPeriod = fields.decayPeriod
    this.reductionFactor = fields.reductionFactor
    this.variableFeeControl = fields.variableFeeControl
    this.maxVolatilityAccumulator = fields.maxVolatilityAccumulator
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u16("filterPeriod"),
        borsh.u16("decayPeriod"),
        borsh.u16("reductionFactor"),
        borsh.u32("variableFeeControl"),
        borsh.u32("maxVolatilityAccumulator"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new DynamicFeeParameter({
      filterPeriod: obj.filterPeriod,
      decayPeriod: obj.decayPeriod,
      reductionFactor: obj.reductionFactor,
      variableFeeControl: obj.variableFeeControl,
      maxVolatilityAccumulator: obj.maxVolatilityAccumulator,
    })
  }

  static toEncodable(fields: DynamicFeeParameterFields) {
    return {
      filterPeriod: fields.filterPeriod,
      decayPeriod: fields.decayPeriod,
      reductionFactor: fields.reductionFactor,
      variableFeeControl: fields.variableFeeControl,
      maxVolatilityAccumulator: fields.maxVolatilityAccumulator,
    }
  }

  toJSON(): DynamicFeeParameterJSON {
    return {
      filterPeriod: this.filterPeriod,
      decayPeriod: this.decayPeriod,
      reductionFactor: this.reductionFactor,
      variableFeeControl: this.variableFeeControl,
      maxVolatilityAccumulator: this.maxVolatilityAccumulator,
    }
  }

  static fromJSON(obj: DynamicFeeParameterJSON): DynamicFeeParameter {
    return new DynamicFeeParameter({
      filterPeriod: obj.filterPeriod,
      decayPeriod: obj.decayPeriod,
      reductionFactor: obj.reductionFactor,
      variableFeeControl: obj.variableFeeControl,
      maxVolatilityAccumulator: obj.maxVolatilityAccumulator,
    })
  }

  toEncodable() {
    return DynamicFeeParameter.toEncodable(this)
  }
}
