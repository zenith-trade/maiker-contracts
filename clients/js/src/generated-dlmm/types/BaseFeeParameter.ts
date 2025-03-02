import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface BaseFeeParameterFields {
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  protocolShare: number
  /** Base factor for base fee rate */
  baseFactor: number
}

export interface BaseFeeParameterJSON {
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  protocolShare: number
  /** Base factor for base fee rate */
  baseFactor: number
}

export class BaseFeeParameter {
  /** Portion of swap fees retained by the protocol by controlling protocol_share parameter. protocol_swap_fee = protocol_share * total_swap_fee */
  readonly protocolShare: number
  /** Base factor for base fee rate */
  readonly baseFactor: number

  constructor(fields: BaseFeeParameterFields) {
    this.protocolShare = fields.protocolShare
    this.baseFactor = fields.baseFactor
  }

  static layout(property?: string) {
    return borsh.struct(
      [borsh.u16("protocolShare"), borsh.u16("baseFactor")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new BaseFeeParameter({
      protocolShare: obj.protocolShare,
      baseFactor: obj.baseFactor,
    })
  }

  static toEncodable(fields: BaseFeeParameterFields) {
    return {
      protocolShare: fields.protocolShare,
      baseFactor: fields.baseFactor,
    }
  }

  toJSON(): BaseFeeParameterJSON {
    return {
      protocolShare: this.protocolShare,
      baseFactor: this.baseFactor,
    }
  }

  static fromJSON(obj: BaseFeeParameterJSON): BaseFeeParameter {
    return new BaseFeeParameter({
      protocolShare: obj.protocolShare,
      baseFactor: obj.baseFactor,
    })
  }

  toEncodable() {
    return BaseFeeParameter.toEncodable(this)
  }
}
