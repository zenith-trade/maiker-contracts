import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface lbPairFields {
  parameters: types.StaticParametersFields
  vParameters: types.VariableParametersFields
  bumpSeed: Array<number>
  /** Bin step signer seed */
  binStepSeed: Array<number>
  /** Type of the pair */
  pairType: number
  /** Active bin id */
  activeId: number
  /** Bin step. Represent the price increment / decrement. */
  binStep: number
  /** Status of the pair. Check PairStatus enum. */
  status: number
  /** Require base factor seed */
  requireBaseFactorSeed: number
  /** Base factor seed */
  baseFactorSeed: Array<number>
  /** Activation type */
  activationType: number
  /** Allow pool creator to enable/disable pool with restricted validation. Only applicable for customizable permissionless pair type. */
  creatorPoolOnOffControl: number
  /** Token X mint */
  tokenXMint: PublicKey
  /** Token Y mint */
  tokenYMint: PublicKey
  /** LB token X vault */
  reserveX: PublicKey
  /** LB token Y vault */
  reserveY: PublicKey
  /** Uncollected protocol fee */
  protocolFee: types.ProtocolFeeFields
  /** _padding_1, previous Fee owner, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  padding1: Array<number>
  /** Farming reward information */
  rewardInfos: Array<types.RewardInfoFields>
  /** Oracle pubkey */
  oracle: PublicKey
  /** Packed initialized bin array state */
  binArrayBitmap: Array<BN>
  /** Last time the pool fee parameter was updated */
  lastUpdatedAt: BN
  /** _padding_2, previous whitelisted_wallet, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  padding2: Array<number>
  /** Address allowed to swap when the current point is greater than or equal to the pre-activation point. The pre-activation point is calculated as `activation_point - pre_activation_duration`. */
  preActivationSwapAddress: PublicKey
  /** Base keypair. Only required for permission pair */
  baseKey: PublicKey
  /** Time point to enable the pair. Only applicable for permission pair. */
  activationPoint: BN
  /** Duration before activation activation_point. Used to calculate pre-activation time point for pre_activation_swap_address */
  preActivationDuration: BN
  /** _padding 3 is reclaimed free space from swap_cap_deactivate_point and swap_cap_amount before, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  padding3: Array<number>
  /** _padding_4, previous lock_duration, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  padding4: BN
  /** Pool creator */
  creator: PublicKey
  /** token_mint_x_program_flag */
  tokenMintXProgramFlag: number
  /** token_mint_y_program_flag */
  tokenMintYProgramFlag: number
  /** Reserved space for future use */
  reserved: Array<number>
}

export interface lbPairJSON {
  parameters: types.StaticParametersJSON
  vParameters: types.VariableParametersJSON
  bumpSeed: Array<number>
  /** Bin step signer seed */
  binStepSeed: Array<number>
  /** Type of the pair */
  pairType: number
  /** Active bin id */
  activeId: number
  /** Bin step. Represent the price increment / decrement. */
  binStep: number
  /** Status of the pair. Check PairStatus enum. */
  status: number
  /** Require base factor seed */
  requireBaseFactorSeed: number
  /** Base factor seed */
  baseFactorSeed: Array<number>
  /** Activation type */
  activationType: number
  /** Allow pool creator to enable/disable pool with restricted validation. Only applicable for customizable permissionless pair type. */
  creatorPoolOnOffControl: number
  /** Token X mint */
  tokenXMint: string
  /** Token Y mint */
  tokenYMint: string
  /** LB token X vault */
  reserveX: string
  /** LB token Y vault */
  reserveY: string
  /** Uncollected protocol fee */
  protocolFee: types.ProtocolFeeJSON
  /** _padding_1, previous Fee owner, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  padding1: Array<number>
  /** Farming reward information */
  rewardInfos: Array<types.RewardInfoJSON>
  /** Oracle pubkey */
  oracle: string
  /** Packed initialized bin array state */
  binArrayBitmap: Array<string>
  /** Last time the pool fee parameter was updated */
  lastUpdatedAt: string
  /** _padding_2, previous whitelisted_wallet, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  padding2: Array<number>
  /** Address allowed to swap when the current point is greater than or equal to the pre-activation point. The pre-activation point is calculated as `activation_point - pre_activation_duration`. */
  preActivationSwapAddress: string
  /** Base keypair. Only required for permission pair */
  baseKey: string
  /** Time point to enable the pair. Only applicable for permission pair. */
  activationPoint: string
  /** Duration before activation activation_point. Used to calculate pre-activation time point for pre_activation_swap_address */
  preActivationDuration: string
  /** _padding 3 is reclaimed free space from swap_cap_deactivate_point and swap_cap_amount before, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  padding3: Array<number>
  /** _padding_4, previous lock_duration, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  padding4: string
  /** Pool creator */
  creator: string
  /** token_mint_x_program_flag */
  tokenMintXProgramFlag: number
  /** token_mint_y_program_flag */
  tokenMintYProgramFlag: number
  /** Reserved space for future use */
  reserved: Array<number>
}

export class lbPair {
  readonly parameters: types.StaticParameters
  readonly vParameters: types.VariableParameters
  readonly bumpSeed: Array<number>
  /** Bin step signer seed */
  readonly binStepSeed: Array<number>
  /** Type of the pair */
  readonly pairType: number
  /** Active bin id */
  readonly activeId: number
  /** Bin step. Represent the price increment / decrement. */
  readonly binStep: number
  /** Status of the pair. Check PairStatus enum. */
  readonly status: number
  /** Require base factor seed */
  readonly requireBaseFactorSeed: number
  /** Base factor seed */
  readonly baseFactorSeed: Array<number>
  /** Activation type */
  readonly activationType: number
  /** Allow pool creator to enable/disable pool with restricted validation. Only applicable for customizable permissionless pair type. */
  readonly creatorPoolOnOffControl: number
  /** Token X mint */
  readonly tokenXMint: PublicKey
  /** Token Y mint */
  readonly tokenYMint: PublicKey
  /** LB token X vault */
  readonly reserveX: PublicKey
  /** LB token Y vault */
  readonly reserveY: PublicKey
  /** Uncollected protocol fee */
  readonly protocolFee: types.ProtocolFee
  /** _padding_1, previous Fee owner, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  readonly padding1: Array<number>
  /** Farming reward information */
  readonly rewardInfos: Array<types.RewardInfo>
  /** Oracle pubkey */
  readonly oracle: PublicKey
  /** Packed initialized bin array state */
  readonly binArrayBitmap: Array<BN>
  /** Last time the pool fee parameter was updated */
  readonly lastUpdatedAt: BN
  /** _padding_2, previous whitelisted_wallet, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  readonly padding2: Array<number>
  /** Address allowed to swap when the current point is greater than or equal to the pre-activation point. The pre-activation point is calculated as `activation_point - pre_activation_duration`. */
  readonly preActivationSwapAddress: PublicKey
  /** Base keypair. Only required for permission pair */
  readonly baseKey: PublicKey
  /** Time point to enable the pair. Only applicable for permission pair. */
  readonly activationPoint: BN
  /** Duration before activation activation_point. Used to calculate pre-activation time point for pre_activation_swap_address */
  readonly preActivationDuration: BN
  /** _padding 3 is reclaimed free space from swap_cap_deactivate_point and swap_cap_amount before, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  readonly padding3: Array<number>
  /** _padding_4, previous lock_duration, BE CAREFUL FOR TOMBSTONE WHEN REUSE !! */
  readonly padding4: BN
  /** Pool creator */
  readonly creator: PublicKey
  /** token_mint_x_program_flag */
  readonly tokenMintXProgramFlag: number
  /** token_mint_y_program_flag */
  readonly tokenMintYProgramFlag: number
  /** Reserved space for future use */
  readonly reserved: Array<number>

  static readonly discriminator = Buffer.from([
    33, 11, 49, 98, 181, 101, 177, 13,
  ])

  static readonly layout = borsh.struct([
    types.StaticParameters.layout("parameters"),
    types.VariableParameters.layout("vParameters"),
    borsh.array(borsh.u8(), 1, "bumpSeed"),
    borsh.array(borsh.u8(), 2, "binStepSeed"),
    borsh.u8("pairType"),
    borsh.i32("activeId"),
    borsh.u16("binStep"),
    borsh.u8("status"),
    borsh.u8("requireBaseFactorSeed"),
    borsh.array(borsh.u8(), 2, "baseFactorSeed"),
    borsh.u8("activationType"),
    borsh.u8("creatorPoolOnOffControl"),
    borsh.publicKey("tokenXMint"),
    borsh.publicKey("tokenYMint"),
    borsh.publicKey("reserveX"),
    borsh.publicKey("reserveY"),
    types.ProtocolFee.layout("protocolFee"),
    borsh.array(borsh.u8(), 32, "padding1"),
    borsh.array(types.RewardInfo.layout(), 2, "rewardInfos"),
    borsh.publicKey("oracle"),
    borsh.array(borsh.u64(), 16, "binArrayBitmap"),
    borsh.i64("lastUpdatedAt"),
    borsh.array(borsh.u8(), 32, "padding2"),
    borsh.publicKey("preActivationSwapAddress"),
    borsh.publicKey("baseKey"),
    borsh.u64("activationPoint"),
    borsh.u64("preActivationDuration"),
    borsh.array(borsh.u8(), 8, "padding3"),
    borsh.u64("padding4"),
    borsh.publicKey("creator"),
    borsh.u8("tokenMintXProgramFlag"),
    borsh.u8("tokenMintYProgramFlag"),
    borsh.array(borsh.u8(), 22, "reserved"),
  ])

  constructor(fields: lbPairFields) {
    this.parameters = new types.StaticParameters({ ...fields.parameters })
    this.vParameters = new types.VariableParameters({ ...fields.vParameters })
    this.bumpSeed = fields.bumpSeed
    this.binStepSeed = fields.binStepSeed
    this.pairType = fields.pairType
    this.activeId = fields.activeId
    this.binStep = fields.binStep
    this.status = fields.status
    this.requireBaseFactorSeed = fields.requireBaseFactorSeed
    this.baseFactorSeed = fields.baseFactorSeed
    this.activationType = fields.activationType
    this.creatorPoolOnOffControl = fields.creatorPoolOnOffControl
    this.tokenXMint = fields.tokenXMint
    this.tokenYMint = fields.tokenYMint
    this.reserveX = fields.reserveX
    this.reserveY = fields.reserveY
    this.protocolFee = new types.ProtocolFee({ ...fields.protocolFee })
    this.padding1 = fields.padding1
    this.rewardInfos = fields.rewardInfos.map(
      (item) => new types.RewardInfo({ ...item })
    )
    this.oracle = fields.oracle
    this.binArrayBitmap = fields.binArrayBitmap
    this.lastUpdatedAt = fields.lastUpdatedAt
    this.padding2 = fields.padding2
    this.preActivationSwapAddress = fields.preActivationSwapAddress
    this.baseKey = fields.baseKey
    this.activationPoint = fields.activationPoint
    this.preActivationDuration = fields.preActivationDuration
    this.padding3 = fields.padding3
    this.padding4 = fields.padding4
    this.creator = fields.creator
    this.tokenMintXProgramFlag = fields.tokenMintXProgramFlag
    this.tokenMintYProgramFlag = fields.tokenMintYProgramFlag
    this.reserved = fields.reserved
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<lbPair | null> {
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
  ): Promise<Array<lbPair | null>> {
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

  static decode(data: Buffer): lbPair {
    if (!data.slice(0, 8).equals(lbPair.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = lbPair.layout.decode(data.slice(8))

    return new lbPair({
      parameters: types.StaticParameters.fromDecoded(dec.parameters),
      vParameters: types.VariableParameters.fromDecoded(dec.vParameters),
      bumpSeed: dec.bumpSeed,
      binStepSeed: dec.binStepSeed,
      pairType: dec.pairType,
      activeId: dec.activeId,
      binStep: dec.binStep,
      status: dec.status,
      requireBaseFactorSeed: dec.requireBaseFactorSeed,
      baseFactorSeed: dec.baseFactorSeed,
      activationType: dec.activationType,
      creatorPoolOnOffControl: dec.creatorPoolOnOffControl,
      tokenXMint: dec.tokenXMint,
      tokenYMint: dec.tokenYMint,
      reserveX: dec.reserveX,
      reserveY: dec.reserveY,
      protocolFee: types.ProtocolFee.fromDecoded(dec.protocolFee),
      padding1: dec.padding1,
      rewardInfos: dec.rewardInfos.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.RewardInfo.fromDecoded(item)
      ),
      oracle: dec.oracle,
      binArrayBitmap: dec.binArrayBitmap,
      lastUpdatedAt: dec.lastUpdatedAt,
      padding2: dec.padding2,
      preActivationSwapAddress: dec.preActivationSwapAddress,
      baseKey: dec.baseKey,
      activationPoint: dec.activationPoint,
      preActivationDuration: dec.preActivationDuration,
      padding3: dec.padding3,
      padding4: dec.padding4,
      creator: dec.creator,
      tokenMintXProgramFlag: dec.tokenMintXProgramFlag,
      tokenMintYProgramFlag: dec.tokenMintYProgramFlag,
      reserved: dec.reserved,
    })
  }

  toJSON(): lbPairJSON {
    return {
      parameters: this.parameters.toJSON(),
      vParameters: this.vParameters.toJSON(),
      bumpSeed: this.bumpSeed,
      binStepSeed: this.binStepSeed,
      pairType: this.pairType,
      activeId: this.activeId,
      binStep: this.binStep,
      status: this.status,
      requireBaseFactorSeed: this.requireBaseFactorSeed,
      baseFactorSeed: this.baseFactorSeed,
      activationType: this.activationType,
      creatorPoolOnOffControl: this.creatorPoolOnOffControl,
      tokenXMint: this.tokenXMint.toString(),
      tokenYMint: this.tokenYMint.toString(),
      reserveX: this.reserveX.toString(),
      reserveY: this.reserveY.toString(),
      protocolFee: this.protocolFee.toJSON(),
      padding1: this.padding1,
      rewardInfos: this.rewardInfos.map((item) => item.toJSON()),
      oracle: this.oracle.toString(),
      binArrayBitmap: this.binArrayBitmap.map((item) => item.toString()),
      lastUpdatedAt: this.lastUpdatedAt.toString(),
      padding2: this.padding2,
      preActivationSwapAddress: this.preActivationSwapAddress.toString(),
      baseKey: this.baseKey.toString(),
      activationPoint: this.activationPoint.toString(),
      preActivationDuration: this.preActivationDuration.toString(),
      padding3: this.padding3,
      padding4: this.padding4.toString(),
      creator: this.creator.toString(),
      tokenMintXProgramFlag: this.tokenMintXProgramFlag,
      tokenMintYProgramFlag: this.tokenMintYProgramFlag,
      reserved: this.reserved,
    }
  }

  static fromJSON(obj: lbPairJSON): lbPair {
    return new lbPair({
      parameters: types.StaticParameters.fromJSON(obj.parameters),
      vParameters: types.VariableParameters.fromJSON(obj.vParameters),
      bumpSeed: obj.bumpSeed,
      binStepSeed: obj.binStepSeed,
      pairType: obj.pairType,
      activeId: obj.activeId,
      binStep: obj.binStep,
      status: obj.status,
      requireBaseFactorSeed: obj.requireBaseFactorSeed,
      baseFactorSeed: obj.baseFactorSeed,
      activationType: obj.activationType,
      creatorPoolOnOffControl: obj.creatorPoolOnOffControl,
      tokenXMint: new PublicKey(obj.tokenXMint),
      tokenYMint: new PublicKey(obj.tokenYMint),
      reserveX: new PublicKey(obj.reserveX),
      reserveY: new PublicKey(obj.reserveY),
      protocolFee: types.ProtocolFee.fromJSON(obj.protocolFee),
      padding1: obj.padding1,
      rewardInfos: obj.rewardInfos.map((item) =>
        types.RewardInfo.fromJSON(item)
      ),
      oracle: new PublicKey(obj.oracle),
      binArrayBitmap: obj.binArrayBitmap.map((item) => new BN(item)),
      lastUpdatedAt: new BN(obj.lastUpdatedAt),
      padding2: obj.padding2,
      preActivationSwapAddress: new PublicKey(obj.preActivationSwapAddress),
      baseKey: new PublicKey(obj.baseKey),
      activationPoint: new BN(obj.activationPoint),
      preActivationDuration: new BN(obj.preActivationDuration),
      padding3: obj.padding3,
      padding4: new BN(obj.padding4),
      creator: new PublicKey(obj.creator),
      tokenMintXProgramFlag: obj.tokenMintXProgramFlag,
      tokenMintYProgramFlag: obj.tokenMintYProgramFlag,
      reserved: obj.reserved,
    })
  }
}
