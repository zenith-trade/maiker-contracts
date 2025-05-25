import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface PermissionlessJSON {
  kind: "Permissionless"
}

export class Permissionless {
  static readonly discriminator = 0
  static readonly kind = "Permissionless"
  readonly discriminator = 0
  readonly kind = "Permissionless"

  toJSON(): PermissionlessJSON {
    return {
      kind: "Permissionless",
    }
  }

  toEncodable() {
    return {
      Permissionless: {},
    }
  }
}

export interface PermissionJSON {
  kind: "Permission"
}

export class Permission {
  static readonly discriminator = 1
  static readonly kind = "Permission"
  readonly discriminator = 1
  readonly kind = "Permission"

  toJSON(): PermissionJSON {
    return {
      kind: "Permission",
    }
  }

  toEncodable() {
    return {
      Permission: {},
    }
  }
}

export interface CustomizablePermissionlessJSON {
  kind: "CustomizablePermissionless"
}

export class CustomizablePermissionless {
  static readonly discriminator = 2
  static readonly kind = "CustomizablePermissionless"
  readonly discriminator = 2
  readonly kind = "CustomizablePermissionless"

  toJSON(): CustomizablePermissionlessJSON {
    return {
      kind: "CustomizablePermissionless",
    }
  }

  toEncodable() {
    return {
      CustomizablePermissionless: {},
    }
  }
}

export interface PermissionlessV2JSON {
  kind: "PermissionlessV2"
}

export class PermissionlessV2 {
  static readonly discriminator = 3
  static readonly kind = "PermissionlessV2"
  readonly discriminator = 3
  readonly kind = "PermissionlessV2"

  toJSON(): PermissionlessV2JSON {
    return {
      kind: "PermissionlessV2",
    }
  }

  toEncodable() {
    return {
      PermissionlessV2: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.PairTypeKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("Permissionless" in obj) {
    return new Permissionless()
  }
  if ("Permission" in obj) {
    return new Permission()
  }
  if ("CustomizablePermissionless" in obj) {
    return new CustomizablePermissionless()
  }
  if ("PermissionlessV2" in obj) {
    return new PermissionlessV2()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(obj: types.PairTypeJSON): types.PairTypeKind {
  switch (obj.kind) {
    case "Permissionless": {
      return new Permissionless()
    }
    case "Permission": {
      return new Permission()
    }
    case "CustomizablePermissionless": {
      return new CustomizablePermissionless()
    }
    case "PermissionlessV2": {
      return new PermissionlessV2()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "Permissionless"),
    borsh.struct([], "Permission"),
    borsh.struct([], "CustomizablePermissionless"),
    borsh.struct([], "PermissionlessV2"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
