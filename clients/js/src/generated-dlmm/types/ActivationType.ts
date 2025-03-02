import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import * as types from "." // eslint-disable-line @typescript-eslint/no-unused-vars

export interface SlotJSON {
  kind: "Slot"
}

export class Slot {
  static readonly discriminator = 0
  static readonly kind = "Slot"
  readonly discriminator = 0
  readonly kind = "Slot"

  toJSON(): SlotJSON {
    return {
      kind: "Slot",
    }
  }

  toEncodable() {
    return {
      Slot: {},
    }
  }
}

export interface TimestampJSON {
  kind: "Timestamp"
}

export class Timestamp {
  static readonly discriminator = 1
  static readonly kind = "Timestamp"
  readonly discriminator = 1
  readonly kind = "Timestamp"

  toJSON(): TimestampJSON {
    return {
      kind: "Timestamp",
    }
  }

  toEncodable() {
    return {
      Timestamp: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.ActivationTypeKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("Slot" in obj) {
    return new Slot()
  }
  if ("Timestamp" in obj) {
    return new Timestamp()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(
  obj: types.ActivationTypeJSON
): types.ActivationTypeKind {
  switch (obj.kind) {
    case "Slot": {
      return new Slot()
    }
    case "Timestamp": {
      return new Timestamp()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "Slot"),
    borsh.struct([], "Timestamp"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
