import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface claimFeeOperatorFields {
  /** operator */
  operator: PublicKey
  /** Reserve */
  padding: Array<number>
}

export interface claimFeeOperatorJSON {
  /** operator */
  operator: string
  /** Reserve */
  padding: Array<number>
}

/** Parameter that set by the protocol */
export class claimFeeOperator {
  /** operator */
  readonly operator: PublicKey
  /** Reserve */
  readonly padding: Array<number>

  static readonly discriminator = Buffer.from([
    166, 48, 134, 86, 34, 200, 188, 150,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("operator"),
    borsh.array(borsh.u8(), 128, "padding"),
  ])

  constructor(fields: claimFeeOperatorFields) {
    this.operator = fields.operator
    this.padding = fields.padding
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<claimFeeOperator | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID
  ): Promise<Array<claimFeeOperator | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): claimFeeOperator {
    if (!data.slice(0, 8).equals(claimFeeOperator.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = claimFeeOperator.layout.decode(data.slice(8))

    return new claimFeeOperator({
      operator: dec.operator,
      padding: dec.padding,
    })
  }

  toJSON(): claimFeeOperatorJSON {
    return {
      operator: this.operator.toString(),
      padding: this.padding,
    }
  }

  static fromJSON(obj: claimFeeOperatorJSON): claimFeeOperator {
    return new claimFeeOperator({
      operator: new PublicKey(obj.operator),
      padding: obj.padding,
    })
  }
}
