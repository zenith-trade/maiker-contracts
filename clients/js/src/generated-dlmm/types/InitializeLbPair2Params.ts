import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface InitializeLbPair2ParamsFields {
  /** Pool price */
  activeId: number
  /** Padding, for future use */
  padding: Array<number>
}

export interface InitializeLbPair2ParamsJSON {
  /** Pool price */
  activeId: number
  /** Padding, for future use */
  padding: Array<number>
}

export class InitializeLbPair2Params {
  /** Pool price */
  readonly activeId: number
  /** Padding, for future use */
  readonly padding: Array<number>

  constructor(fields: InitializeLbPair2ParamsFields) {
    this.activeId = fields.activeId
    this.padding = fields.padding
  }

  static layout(property?: string) {
    return borsh.struct(
      [borsh.i32("activeId"), borsh.array(borsh.u8(), 96, "padding")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new InitializeLbPair2Params({
      activeId: obj.activeId,
      padding: obj.padding,
    })
  }

  static toEncodable(fields: InitializeLbPair2ParamsFields) {
    return {
      activeId: fields.activeId,
      padding: fields.padding,
    }
  }

  toJSON(): InitializeLbPair2ParamsJSON {
    return {
      activeId: this.activeId,
      padding: this.padding,
    }
  }

  static fromJSON(obj: InitializeLbPair2ParamsJSON): InitializeLbPair2Params {
    return new InitializeLbPair2Params({
      activeId: obj.activeId,
      padding: obj.padding,
    })
  }

  toEncodable() {
    return InitializeLbPair2Params.toEncodable(this)
  }
}
