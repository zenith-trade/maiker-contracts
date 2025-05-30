import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface BaseFeeParameterFields {
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  protocolShare: number
  /** Base factor for base fee rate */
  baseFactor: number
  /** Base fee power factor */
  baseFeePowerFactor: number
}

export interface BaseFeeParameterJSON {
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  protocolShare: number
  /** Base factor for base fee rate */
  baseFactor: number
  /** Base fee power factor */
  baseFeePowerFactor: number
}

export class BaseFeeParameter {
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  readonly protocolShare: number
  /** Base factor for base fee rate */
  readonly baseFactor: number
  /** Base fee power factor */
  readonly baseFeePowerFactor: number

  constructor(fields: BaseFeeParameterFields) {
    this.protocolShare = fields.protocolShare
    this.baseFactor = fields.baseFactor
    this.baseFeePowerFactor = fields.baseFeePowerFactor
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u16("protocolShare"),
        borsh.u16("baseFactor"),
        borsh.u8("baseFeePowerFactor"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new BaseFeeParameter({
      protocolShare: obj.protocolShare,
      baseFactor: obj.baseFactor,
      baseFeePowerFactor: obj.baseFeePowerFactor,
    })
  }

  static toEncodable(fields: BaseFeeParameterFields) {
    return {
      protocolShare: fields.protocolShare,
      baseFactor: fields.baseFactor,
      baseFeePowerFactor: fields.baseFeePowerFactor,
    }
  }

  toJSON(): BaseFeeParameterJSON {
    return {
      protocolShare: this.protocolShare,
      baseFactor: this.baseFactor,
      baseFeePowerFactor: this.baseFeePowerFactor,
    }
  }

  static fromJSON(obj: BaseFeeParameterJSON): BaseFeeParameter {
    return new BaseFeeParameter({
      protocolShare: obj.protocolShare,
      baseFactor: obj.baseFactor,
      baseFeePowerFactor: obj.baseFeePowerFactor,
    })
  }

  toEncodable() {
    return BaseFeeParameter.toEncodable(this)
  }
}
