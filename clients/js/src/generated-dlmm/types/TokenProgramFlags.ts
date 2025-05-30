import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface TokenProgramJSON {
  kind: "TokenProgram"
}

export class TokenProgram {
  static readonly discriminator = 0
  static readonly kind = "TokenProgram"
  readonly discriminator = 0
  readonly kind = "TokenProgram"

  toJSON(): TokenProgramJSON {
    return {
      kind: "TokenProgram",
    }
  }

  toEncodable() {
    return {
      TokenProgram: {},
    }
  }
}

export interface TokenProgram2022JSON {
  kind: "TokenProgram2022"
}

export class TokenProgram2022 {
  static readonly discriminator = 1
  static readonly kind = "TokenProgram2022"
  readonly discriminator = 1
  readonly kind = "TokenProgram2022"

  toJSON(): TokenProgram2022JSON {
    return {
      kind: "TokenProgram2022",
    }
  }

  toEncodable() {
    return {
      TokenProgram2022: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.TokenProgramFlagsKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("TokenProgram" in obj) {
    return new TokenProgram()
  }
  if ("TokenProgram2022" in obj) {
    return new TokenProgram2022()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(
  obj: types.TokenProgramFlagsJSON
): types.TokenProgramFlagsKind {
  switch (obj.kind) {
    case "TokenProgram": {
      return new TokenProgram()
    }
    case "TokenProgram2022": {
      return new TokenProgram2022()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "TokenProgram"),
    borsh.struct([], "TokenProgram2022"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
