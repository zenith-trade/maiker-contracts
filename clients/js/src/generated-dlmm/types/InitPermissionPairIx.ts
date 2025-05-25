import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface InitPermissionPairIxFields {
  activeId: number
  binStep: number
  baseFactor: number
  baseFeePowerFactor: number
  activationType: number
  protocolShare: number
}

export interface InitPermissionPairIxJSON {
  activeId: number
  binStep: number
  baseFactor: number
  baseFeePowerFactor: number
  activationType: number
  protocolShare: number
}

export class InitPermissionPairIx {
  readonly activeId: number
  readonly binStep: number
  readonly baseFactor: number
  readonly baseFeePowerFactor: number
  readonly activationType: number
  readonly protocolShare: number

  constructor(fields: InitPermissionPairIxFields) {
    this.activeId = fields.activeId
    this.binStep = fields.binStep
    this.baseFactor = fields.baseFactor
    this.baseFeePowerFactor = fields.baseFeePowerFactor
    this.activationType = fields.activationType
    this.protocolShare = fields.protocolShare
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.i32("activeId"),
        borsh.u16("binStep"),
        borsh.u16("baseFactor"),
        borsh.u8("baseFeePowerFactor"),
        borsh.u8("activationType"),
        borsh.u16("protocolShare"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new InitPermissionPairIx({
      activeId: obj.activeId,
      binStep: obj.binStep,
      baseFactor: obj.baseFactor,
      baseFeePowerFactor: obj.baseFeePowerFactor,
      activationType: obj.activationType,
      protocolShare: obj.protocolShare,
    })
  }

  static toEncodable(fields: InitPermissionPairIxFields) {
    return {
      activeId: fields.activeId,
      binStep: fields.binStep,
      baseFactor: fields.baseFactor,
      baseFeePowerFactor: fields.baseFeePowerFactor,
      activationType: fields.activationType,
      protocolShare: fields.protocolShare,
    }
  }

  toJSON(): InitPermissionPairIxJSON {
    return {
      activeId: this.activeId,
      binStep: this.binStep,
      baseFactor: this.baseFactor,
      baseFeePowerFactor: this.baseFeePowerFactor,
      activationType: this.activationType,
      protocolShare: this.protocolShare,
    }
  }

  static fromJSON(obj: InitPermissionPairIxJSON): InitPermissionPairIx {
    return new InitPermissionPairIx({
      activeId: obj.activeId,
      binStep: obj.binStep,
      baseFactor: obj.baseFactor,
      baseFeePowerFactor: obj.baseFeePowerFactor,
      activationType: obj.activationType,
      protocolShare: obj.protocolShare,
    })
  }

  toEncodable() {
    return InitPermissionPairIx.toEncodable(this)
  }
}
