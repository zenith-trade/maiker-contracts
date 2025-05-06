import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface CreateStrategyMetadataParamsFields {
  name: string
  symbol: string
  uri: string
}

export interface CreateStrategyMetadataParamsJSON {
  name: string
  symbol: string
  uri: string
}

export class CreateStrategyMetadataParams {
  readonly name: string
  readonly symbol: string
  readonly uri: string

  constructor(fields: CreateStrategyMetadataParamsFields) {
    this.name = fields.name
    this.symbol = fields.symbol
    this.uri = fields.uri
  }

  static layout(property?: string) {
    return borsh.struct(
      [borsh.str("name"), borsh.str("symbol"), borsh.str("uri")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new CreateStrategyMetadataParams({
      name: obj.name,
      symbol: obj.symbol,
      uri: obj.uri,
    })
  }

  static toEncodable(fields: CreateStrategyMetadataParamsFields) {
    return {
      name: fields.name,
      symbol: fields.symbol,
      uri: fields.uri,
    }
  }

  toJSON(): CreateStrategyMetadataParamsJSON {
    return {
      name: this.name,
      symbol: this.symbol,
      uri: this.uri,
    }
  }

  static fromJSON(
    obj: CreateStrategyMetadataParamsJSON
  ): CreateStrategyMetadataParams {
    return new CreateStrategyMetadataParams({
      name: obj.name,
      symbol: obj.symbol,
      uri: obj.uri,
    })
  }

  toEncodable() {
    return CreateStrategyMetadataParams.toEncodable(this)
  }
}
