import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import * as types from "." // eslint-disable-line @typescript-eslint/no-unused-vars

export interface InitPermissionPairIxFields {
  activeId: number
  binStep: number
  baseFactor: number
  minBinId: number
  maxBinId: number
  activationType: number
}

export interface InitPermissionPairIxJSON {
  activeId: number
  binStep: number
  baseFactor: number
  minBinId: number
  maxBinId: number
  activationType: number
}

export class InitPermissionPairIx {
  readonly activeId: number
  readonly binStep: number
  readonly baseFactor: number
  readonly minBinId: number
  readonly maxBinId: number
  readonly activationType: number

  constructor(fields: InitPermissionPairIxFields) {
    this.activeId = fields.activeId
    this.binStep = fields.binStep
    this.baseFactor = fields.baseFactor
    this.minBinId = fields.minBinId
    this.maxBinId = fields.maxBinId
    this.activationType = fields.activationType
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.i32("activeId"),
        borsh.u16("binStep"),
        borsh.u16("baseFactor"),
        borsh.i32("minBinId"),
        borsh.i32("maxBinId"),
        borsh.u8("activationType"),
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
      minBinId: obj.minBinId,
      maxBinId: obj.maxBinId,
      activationType: obj.activationType,
    })
  }

  static toEncodable(fields: InitPermissionPairIxFields) {
    return {
      activeId: fields.activeId,
      binStep: fields.binStep,
      baseFactor: fields.baseFactor,
      minBinId: fields.minBinId,
      maxBinId: fields.maxBinId,
      activationType: fields.activationType,
    }
  }

  toJSON(): InitPermissionPairIxJSON {
    return {
      activeId: this.activeId,
      binStep: this.binStep,
      baseFactor: this.baseFactor,
      minBinId: this.minBinId,
      maxBinId: this.maxBinId,
      activationType: this.activationType,
    }
  }

  static fromJSON(obj: InitPermissionPairIxJSON): InitPermissionPairIx {
    return new InitPermissionPairIx({
      activeId: obj.activeId,
      binStep: obj.binStep,
      baseFactor: obj.baseFactor,
      minBinId: obj.minBinId,
      maxBinId: obj.maxBinId,
      activationType: obj.activationType,
    })
  }

  toEncodable() {
    return InitPermissionPairIx.toEncodable(this)
  }
}
