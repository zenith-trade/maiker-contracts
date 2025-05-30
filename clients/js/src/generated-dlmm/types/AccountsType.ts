import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface TransferHookXJSON {
  kind: "TransferHookX"
}

export class TransferHookX {
  static readonly discriminator = 0
  static readonly kind = "TransferHookX"
  readonly discriminator = 0
  readonly kind = "TransferHookX"

  toJSON(): TransferHookXJSON {
    return {
      kind: "TransferHookX",
    }
  }

  toEncodable() {
    return {
      TransferHookX: {},
    }
  }
}

export interface TransferHookYJSON {
  kind: "TransferHookY"
}

export class TransferHookY {
  static readonly discriminator = 1
  static readonly kind = "TransferHookY"
  readonly discriminator = 1
  readonly kind = "TransferHookY"

  toJSON(): TransferHookYJSON {
    return {
      kind: "TransferHookY",
    }
  }

  toEncodable() {
    return {
      TransferHookY: {},
    }
  }
}

export interface TransferHookRewardJSON {
  kind: "TransferHookReward"
}

export class TransferHookReward {
  static readonly discriminator = 2
  static readonly kind = "TransferHookReward"
  readonly discriminator = 2
  readonly kind = "TransferHookReward"

  toJSON(): TransferHookRewardJSON {
    return {
      kind: "TransferHookReward",
    }
  }

  toEncodable() {
    return {
      TransferHookReward: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.AccountsTypeKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("TransferHookX" in obj) {
    return new TransferHookX()
  }
  if ("TransferHookY" in obj) {
    return new TransferHookY()
  }
  if ("TransferHookReward" in obj) {
    return new TransferHookReward()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(obj: types.AccountsTypeJSON): types.AccountsTypeKind {
  switch (obj.kind) {
    case "TransferHookX": {
      return new TransferHookX()
    }
    case "TransferHookY": {
      return new TransferHookY()
    }
    case "TransferHookReward": {
      return new TransferHookReward()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "TransferHookX"),
    borsh.struct([], "TransferHookY"),
    borsh.struct([], "TransferHookReward"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
