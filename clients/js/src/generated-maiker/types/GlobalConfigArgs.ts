import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface GlobalConfigArgsFields {
  performanceFeeBps: number
  withdrawalFeeBps: number
  treasury: PublicKey
  intervalSeconds: BN
  newAdmin: PublicKey | null
}

export interface GlobalConfigArgsJSON {
  performanceFeeBps: number
  withdrawalFeeBps: number
  treasury: string
  intervalSeconds: string
  newAdmin: string | null
}

export class GlobalConfigArgs {
  readonly performanceFeeBps: number
  readonly withdrawalFeeBps: number
  readonly treasury: PublicKey
  readonly intervalSeconds: BN
  readonly newAdmin: PublicKey | null

  constructor(fields: GlobalConfigArgsFields) {
    this.performanceFeeBps = fields.performanceFeeBps
    this.withdrawalFeeBps = fields.withdrawalFeeBps
    this.treasury = fields.treasury
    this.intervalSeconds = fields.intervalSeconds
    this.newAdmin = fields.newAdmin
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u16("performanceFeeBps"),
        borsh.u16("withdrawalFeeBps"),
        borsh.publicKey("treasury"),
        borsh.u64("intervalSeconds"),
        borsh.option(borsh.publicKey(), "newAdmin"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new GlobalConfigArgs({
      performanceFeeBps: obj.performanceFeeBps,
      withdrawalFeeBps: obj.withdrawalFeeBps,
      treasury: obj.treasury,
      intervalSeconds: obj.intervalSeconds,
      newAdmin: obj.newAdmin,
    })
  }

  static toEncodable(fields: GlobalConfigArgsFields) {
    return {
      performanceFeeBps: fields.performanceFeeBps,
      withdrawalFeeBps: fields.withdrawalFeeBps,
      treasury: fields.treasury,
      intervalSeconds: fields.intervalSeconds,
      newAdmin: fields.newAdmin,
    }
  }

  toJSON(): GlobalConfigArgsJSON {
    return {
      performanceFeeBps: this.performanceFeeBps,
      withdrawalFeeBps: this.withdrawalFeeBps,
      treasury: this.treasury.toString(),
      intervalSeconds: this.intervalSeconds.toString(),
      newAdmin: (this.newAdmin && this.newAdmin.toString()) || null,
    }
  }

  static fromJSON(obj: GlobalConfigArgsJSON): GlobalConfigArgs {
    return new GlobalConfigArgs({
      performanceFeeBps: obj.performanceFeeBps,
      withdrawalFeeBps: obj.withdrawalFeeBps,
      treasury: new PublicKey(obj.treasury),
      intervalSeconds: new BN(obj.intervalSeconds),
      newAdmin: (obj.newAdmin && new PublicKey(obj.newAdmin)) || null,
    })
  }

  toEncodable() {
    return GlobalConfigArgs.toEncodable(this)
  }
}
