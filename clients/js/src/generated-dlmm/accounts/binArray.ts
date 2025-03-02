import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface binArrayFields {
  index: BN
  /** Version of binArray */
  version: number
  padding: Array<number>
  lbPair: PublicKey
  bins: Array<types.BinFields>
}

export interface binArrayJSON {
  index: string
  /** Version of binArray */
  version: number
  padding: Array<number>
  lbPair: string
  bins: Array<types.BinJSON>
}

/**
 * An account to contain a range of bin. For example: Bin 100 <-> 200.
 * For example:
 * BinArray index: 0 contains bin 0 <-> 599
 * index: 2 contains bin 600 <-> 1199, ...
 */
export class binArray {
  readonly index: BN
  /** Version of binArray */
  readonly version: number
  readonly padding: Array<number>
  readonly lbPair: PublicKey
  readonly bins: Array<types.Bin>

  static readonly discriminator = Buffer.from([
    92, 142, 92, 220, 5, 148, 70, 181,
  ])

  static readonly layout = borsh.struct([
    borsh.i64("index"),
    borsh.u8("version"),
    borsh.array(borsh.u8(), 7, "padding"),
    borsh.publicKey("lbPair"),
    borsh.array(types.Bin.layout(), 70, "bins"),
  ])

  constructor(fields: binArrayFields) {
    this.index = fields.index
    this.version = fields.version
    this.padding = fields.padding
    this.lbPair = fields.lbPair
    this.bins = fields.bins.map((item) => new types.Bin({ ...item }))
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<binArray | null> {
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
  ): Promise<Array<binArray | null>> {
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

  static decode(data: Buffer): binArray {
    if (!data.slice(0, 8).equals(binArray.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = binArray.layout.decode(data.slice(8))

    return new binArray({
      index: dec.index,
      version: dec.version,
      padding: dec.padding,
      lbPair: dec.lbPair,
      bins: dec.bins.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.Bin.fromDecoded(item)
      ),
    })
  }

  toJSON(): binArrayJSON {
    return {
      index: this.index.toString(),
      version: this.version,
      padding: this.padding,
      lbPair: this.lbPair.toString(),
      bins: this.bins.map((item) => item.toJSON()),
    }
  }

  static fromJSON(obj: binArrayJSON): binArray {
    return new binArray({
      index: new BN(obj.index),
      version: obj.version,
      padding: obj.padding,
      lbPair: new PublicKey(obj.lbPair),
      bins: obj.bins.map((item) => types.Bin.fromJSON(item)),
    })
  }
}
