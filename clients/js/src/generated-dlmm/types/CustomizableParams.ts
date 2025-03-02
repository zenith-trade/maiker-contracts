import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import * as types from "." // eslint-disable-line @typescript-eslint/no-unused-vars

export interface CustomizableParamsFields {
  /** Pool price */
  activeId: number
  /** Bin step */
  binStep: number
  /** Base factor */
  baseFactor: number
  /** Activation type. 0 = Slot, 1 = Time. Check ActivationType enum */
  activationType: number
  /** Whether the pool has an alpha vault */
  hasAlphaVault: boolean
  /** Decide when does the pool start trade. None = Now */
  activationPoint: BN | null
  /** Padding, for future use */
  padding: Array<number>
}

export interface CustomizableParamsJSON {
  /** Pool price */
  activeId: number
  /** Bin step */
  binStep: number
  /** Base factor */
  baseFactor: number
  /** Activation type. 0 = Slot, 1 = Time. Check ActivationType enum */
  activationType: number
  /** Whether the pool has an alpha vault */
  hasAlphaVault: boolean
  /** Decide when does the pool start trade. None = Now */
  activationPoint: string | null
  /** Padding, for future use */
  padding: Array<number>
}

export class CustomizableParams {
  /** Pool price */
  readonly activeId: number
  /** Bin step */
  readonly binStep: number
  /** Base factor */
  readonly baseFactor: number
  /** Activation type. 0 = Slot, 1 = Time. Check ActivationType enum */
  readonly activationType: number
  /** Whether the pool has an alpha vault */
  readonly hasAlphaVault: boolean
  /** Decide when does the pool start trade. None = Now */
  readonly activationPoint: BN | null
  /** Padding, for future use */
  readonly padding: Array<number>

  constructor(fields: CustomizableParamsFields) {
    this.activeId = fields.activeId
    this.binStep = fields.binStep
    this.baseFactor = fields.baseFactor
    this.activationType = fields.activationType
    this.hasAlphaVault = fields.hasAlphaVault
    this.activationPoint = fields.activationPoint
    this.padding = fields.padding
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.i32("activeId"),
        borsh.u16("binStep"),
        borsh.u16("baseFactor"),
        borsh.u8("activationType"),
        borsh.bool("hasAlphaVault"),
        borsh.option(borsh.u64(), "activationPoint"),
        borsh.array(borsh.u8(), 64, "padding"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new CustomizableParams({
      activeId: obj.activeId,
      binStep: obj.binStep,
      baseFactor: obj.baseFactor,
      activationType: obj.activationType,
      hasAlphaVault: obj.hasAlphaVault,
      activationPoint: obj.activationPoint,
      padding: obj.padding,
    })
  }

  static toEncodable(fields: CustomizableParamsFields) {
    return {
      activeId: fields.activeId,
      binStep: fields.binStep,
      baseFactor: fields.baseFactor,
      activationType: fields.activationType,
      hasAlphaVault: fields.hasAlphaVault,
      activationPoint: fields.activationPoint,
      padding: fields.padding,
    }
  }

  toJSON(): CustomizableParamsJSON {
    return {
      activeId: this.activeId,
      binStep: this.binStep,
      baseFactor: this.baseFactor,
      activationType: this.activationType,
      hasAlphaVault: this.hasAlphaVault,
      activationPoint:
        (this.activationPoint && this.activationPoint.toString()) || null,
      padding: this.padding,
    }
  }

  static fromJSON(obj: CustomizableParamsJSON): CustomizableParams {
    return new CustomizableParams({
      activeId: obj.activeId,
      binStep: obj.binStep,
      baseFactor: obj.baseFactor,
      activationType: obj.activationType,
      hasAlphaVault: obj.hasAlphaVault,
      activationPoint:
        (obj.activationPoint && new BN(obj.activationPoint)) || null,
      padding: obj.padding,
    })
  }

  toEncodable() {
    return CustomizableParams.toEncodable(this)
  }
}
