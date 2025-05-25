import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface tokenBadgeFields {
  /** token mint */
  tokenMint: PublicKey
  /** Reserve */
  padding: Array<number>
}

export interface tokenBadgeJSON {
  /** token mint */
  tokenMint: string
  /** Reserve */
  padding: Array<number>
}

/** Parameter that set by the protocol */
export class tokenBadge {
  /** token mint */
  readonly tokenMint: PublicKey
  /** Reserve */
  readonly padding: Array<number>

  static readonly discriminator = Buffer.from([
    116, 219, 204, 229, 249, 116, 255, 150,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("tokenMint"),
    borsh.array(borsh.u8(), 128, "padding"),
  ])

  constructor(fields: tokenBadgeFields) {
    this.tokenMint = fields.tokenMint
    this.padding = fields.padding
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<tokenBadge | null> {
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
  ): Promise<Array<tokenBadge | null>> {
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

  static decode(data: Buffer): tokenBadge {
    if (!data.slice(0, 8).equals(tokenBadge.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = tokenBadge.layout.decode(data.slice(8))

    return new tokenBadge({
      tokenMint: dec.tokenMint,
      padding: dec.padding,
    })
  }

  toJSON(): tokenBadgeJSON {
    return {
      tokenMint: this.tokenMint.toString(),
      padding: this.padding,
    }
  }

  static fromJSON(obj: tokenBadgeJSON): tokenBadge {
    return new tokenBadge({
      tokenMint: new PublicKey(obj.tokenMint),
      padding: obj.padding,
    })
  }
}
