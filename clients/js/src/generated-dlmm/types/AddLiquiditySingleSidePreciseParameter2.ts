import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface AddLiquiditySingleSidePreciseParameter2Fields {
  bins: Array<types.CompressedBinDepositAmountFields>
  decompressMultiplier: BN
  maxAmount: BN
}

export interface AddLiquiditySingleSidePreciseParameter2JSON {
  bins: Array<types.CompressedBinDepositAmountJSON>
  decompressMultiplier: string
  maxAmount: string
}

export class AddLiquiditySingleSidePreciseParameter2 {
  readonly bins: Array<types.CompressedBinDepositAmount>
  readonly decompressMultiplier: BN
  readonly maxAmount: BN

  constructor(fields: AddLiquiditySingleSidePreciseParameter2Fields) {
    this.bins = fields.bins.map(
      (item) => new types.CompressedBinDepositAmount({ ...item })
    )
    this.decompressMultiplier = fields.decompressMultiplier
    this.maxAmount = fields.maxAmount
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.vec(types.CompressedBinDepositAmount.layout(), "bins"),
        borsh.u64("decompressMultiplier"),
        borsh.u64("maxAmount"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new AddLiquiditySingleSidePreciseParameter2({
      bins: obj.bins.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.CompressedBinDepositAmount.fromDecoded(item)
      ),
      decompressMultiplier: obj.decompressMultiplier,
      maxAmount: obj.maxAmount,
    })
  }

  static toEncodable(fields: AddLiquiditySingleSidePreciseParameter2Fields) {
    return {
      bins: fields.bins.map((item) =>
        types.CompressedBinDepositAmount.toEncodable(item)
      ),
      decompressMultiplier: fields.decompressMultiplier,
      maxAmount: fields.maxAmount,
    }
  }

  toJSON(): AddLiquiditySingleSidePreciseParameter2JSON {
    return {
      bins: this.bins.map((item) => item.toJSON()),
      decompressMultiplier: this.decompressMultiplier.toString(),
      maxAmount: this.maxAmount.toString(),
    }
  }

  static fromJSON(
    obj: AddLiquiditySingleSidePreciseParameter2JSON
  ): AddLiquiditySingleSidePreciseParameter2 {
    return new AddLiquiditySingleSidePreciseParameter2({
      bins: obj.bins.map((item) =>
        types.CompressedBinDepositAmount.fromJSON(item)
      ),
      decompressMultiplier: new BN(obj.decompressMultiplier),
      maxAmount: new BN(obj.maxAmount),
    })
  }

  toEncodable() {
    return AddLiquiditySingleSidePreciseParameter2.toEncodable(this)
  }
}
