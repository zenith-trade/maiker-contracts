import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface CompressedBinDepositAmount2Fields {
  binId: number
  amount: number
}

export interface CompressedBinDepositAmount2JSON {
  binId: number
  amount: number
}

export class CompressedBinDepositAmount2 {
  readonly binId: number
  readonly amount: number

  constructor(fields: CompressedBinDepositAmount2Fields) {
    this.binId = fields.binId
    this.amount = fields.amount
  }

  static layout(property?: string) {
    return borsh.struct([borsh.i32("binId"), borsh.u32("amount")], property)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new CompressedBinDepositAmount2({
      binId: obj.binId,
      amount: obj.amount,
    })
  }

  static toEncodable(fields: CompressedBinDepositAmount2Fields) {
    return {
      binId: fields.binId,
      amount: fields.amount,
    }
  }

  toJSON(): CompressedBinDepositAmount2JSON {
    return {
      binId: this.binId,
      amount: this.amount,
    }
  }

  static fromJSON(
    obj: CompressedBinDepositAmount2JSON
  ): CompressedBinDepositAmount2 {
    return new CompressedBinDepositAmount2({
      binId: obj.binId,
      amount: obj.amount,
    })
  }

  toEncodable() {
    return CompressedBinDepositAmount2.toEncodable(this)
  }
}
