import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface binArrayBitmapExtensionFields {
  lbPair: PublicKey
  /** Packed initialized bin array state for start_bin_index is positive */
  positiveBinArrayBitmap: Array<Array<BN>>
  /** Packed initialized bin array state for start_bin_index is negative */
  negativeBinArrayBitmap: Array<Array<BN>>
}

export interface binArrayBitmapExtensionJSON {
  lbPair: string
  /** Packed initialized bin array state for start_bin_index is positive */
  positiveBinArrayBitmap: Array<Array<string>>
  /** Packed initialized bin array state for start_bin_index is negative */
  negativeBinArrayBitmap: Array<Array<string>>
}

export class binArrayBitmapExtension {
  readonly lbPair: PublicKey
  /** Packed initialized bin array state for start_bin_index is positive */
  readonly positiveBinArrayBitmap: Array<Array<BN>>
  /** Packed initialized bin array state for start_bin_index is negative */
  readonly negativeBinArrayBitmap: Array<Array<BN>>

  static readonly discriminator = Buffer.from([
    80, 111, 124, 113, 55, 237, 18, 5,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("lbPair"),
    borsh.array(borsh.array(borsh.u64(), 8), 12, "positiveBinArrayBitmap"),
    borsh.array(borsh.array(borsh.u64(), 8), 12, "negativeBinArrayBitmap"),
  ])

  constructor(fields: binArrayBitmapExtensionFields) {
    this.lbPair = fields.lbPair
    this.positiveBinArrayBitmap = fields.positiveBinArrayBitmap
    this.negativeBinArrayBitmap = fields.negativeBinArrayBitmap
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<binArrayBitmapExtension | null> {
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
  ): Promise<Array<binArrayBitmapExtension | null>> {
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

  static decode(data: Buffer): binArrayBitmapExtension {
    if (!data.slice(0, 8).equals(binArrayBitmapExtension.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = binArrayBitmapExtension.layout.decode(data.slice(8))

    return new binArrayBitmapExtension({
      lbPair: dec.lbPair,
      positiveBinArrayBitmap: dec.positiveBinArrayBitmap,
      negativeBinArrayBitmap: dec.negativeBinArrayBitmap,
    })
  }

  toJSON(): binArrayBitmapExtensionJSON {
    return {
      lbPair: this.lbPair.toString(),
      positiveBinArrayBitmap: this.positiveBinArrayBitmap.map((item) =>
        item.map((item) => item.toString())
      ),
      negativeBinArrayBitmap: this.negativeBinArrayBitmap.map((item) =>
        item.map((item) => item.toString())
      ),
    }
  }

  static fromJSON(obj: binArrayBitmapExtensionJSON): binArrayBitmapExtension {
    return new binArrayBitmapExtension({
      lbPair: new PublicKey(obj.lbPair),
      positiveBinArrayBitmap: obj.positiveBinArrayBitmap.map((item) =>
        item.map((item) => new BN(item))
      ),
      negativeBinArrayBitmap: obj.negativeBinArrayBitmap.map((item) =>
        item.map((item) => new BN(item))
      ),
    })
  }
}
