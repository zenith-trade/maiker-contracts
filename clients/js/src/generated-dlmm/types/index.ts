import * as StrategyType from "./StrategyType"
import * as Rounding from "./Rounding"
import * as ActivationType from "./ActivationType"
import * as LayoutVersion from "./LayoutVersion"
import * as PairType from "./PairType"
import * as PairStatus from "./PairStatus"

export { InitPresetParametersIx } from "./InitPresetParametersIx"
export type {
  InitPresetParametersIxFields,
  InitPresetParametersIxJSON,
} from "./InitPresetParametersIx"
export { BaseFeeParameter } from "./BaseFeeParameter"
export type {
  BaseFeeParameterFields,
  BaseFeeParameterJSON,
} from "./BaseFeeParameter"
export { DynamicFeeParameter } from "./DynamicFeeParameter"
export type {
  DynamicFeeParameterFields,
  DynamicFeeParameterJSON,
} from "./DynamicFeeParameter"
export { LiquidityParameterByStrategyOneSide } from "./LiquidityParameterByStrategyOneSide"
export type {
  LiquidityParameterByStrategyOneSideFields,
  LiquidityParameterByStrategyOneSideJSON,
} from "./LiquidityParameterByStrategyOneSide"
export { LiquidityParameterByStrategy } from "./LiquidityParameterByStrategy"
export type {
  LiquidityParameterByStrategyFields,
  LiquidityParameterByStrategyJSON,
} from "./LiquidityParameterByStrategy"
export { StrategyParameters } from "./StrategyParameters"
export type {
  StrategyParametersFields,
  StrategyParametersJSON,
} from "./StrategyParameters"
export { LiquidityOneSideParameter } from "./LiquidityOneSideParameter"
export type {
  LiquidityOneSideParameterFields,
  LiquidityOneSideParameterJSON,
} from "./LiquidityOneSideParameter"
export { BinLiquidityDistributionByWeight } from "./BinLiquidityDistributionByWeight"
export type {
  BinLiquidityDistributionByWeightFields,
  BinLiquidityDistributionByWeightJSON,
} from "./BinLiquidityDistributionByWeight"
export { LiquidityParameterByWeight } from "./LiquidityParameterByWeight"
export type {
  LiquidityParameterByWeightFields,
  LiquidityParameterByWeightJSON,
} from "./LiquidityParameterByWeight"
export { AddLiquiditySingleSidePreciseParameter } from "./AddLiquiditySingleSidePreciseParameter"
export type {
  AddLiquiditySingleSidePreciseParameterFields,
  AddLiquiditySingleSidePreciseParameterJSON,
} from "./AddLiquiditySingleSidePreciseParameter"
export { CompressedBinDepositAmount } from "./CompressedBinDepositAmount"
export type {
  CompressedBinDepositAmountFields,
  CompressedBinDepositAmountJSON,
} from "./CompressedBinDepositAmount"
export { BinLiquidityDistribution } from "./BinLiquidityDistribution"
export type {
  BinLiquidityDistributionFields,
  BinLiquidityDistributionJSON,
} from "./BinLiquidityDistribution"
export { LiquidityParameter } from "./LiquidityParameter"
export type {
  LiquidityParameterFields,
  LiquidityParameterJSON,
} from "./LiquidityParameter"
export { CustomizableParams } from "./CustomizableParams"
export type {
  CustomizableParamsFields,
  CustomizableParamsJSON,
} from "./CustomizableParams"
export { InitPermissionPairIx } from "./InitPermissionPairIx"
export type {
  InitPermissionPairIxFields,
  InitPermissionPairIxJSON,
} from "./InitPermissionPairIx"
export { BinLiquidityReduction } from "./BinLiquidityReduction"
export type {
  BinLiquidityReductionFields,
  BinLiquidityReductionJSON,
} from "./BinLiquidityReduction"
export { Bin } from "./Bin"
export type { BinFields, BinJSON } from "./Bin"
export { ProtocolFee } from "./ProtocolFee"
export type { ProtocolFeeFields, ProtocolFeeJSON } from "./ProtocolFee"
export { RewardInfo } from "./RewardInfo"
export type { RewardInfoFields, RewardInfoJSON } from "./RewardInfo"
export { Observation } from "./Observation"
export type { ObservationFields, ObservationJSON } from "./Observation"
export { StaticParameters } from "./StaticParameters"
export type {
  StaticParametersFields,
  StaticParametersJSON,
} from "./StaticParameters"
export { VariableParameters } from "./VariableParameters"
export type {
  VariableParametersFields,
  VariableParametersJSON,
} from "./VariableParameters"
export { FeeInfo } from "./FeeInfo"
export type { FeeInfoFields, FeeInfoJSON } from "./FeeInfo"
export { UserRewardInfo } from "./UserRewardInfo"
export type { UserRewardInfoFields, UserRewardInfoJSON } from "./UserRewardInfo"
export { StrategyType }

export type StrategyTypeKind =
  | StrategyType.SpotOneSide
  | StrategyType.CurveOneSide
  | StrategyType.BidAskOneSide
  | StrategyType.SpotBalanced
  | StrategyType.CurveBalanced
  | StrategyType.BidAskBalanced
  | StrategyType.SpotImBalanced
  | StrategyType.CurveImBalanced
  | StrategyType.BidAskImBalanced
export type StrategyTypeJSON =
  | StrategyType.SpotOneSideJSON
  | StrategyType.CurveOneSideJSON
  | StrategyType.BidAskOneSideJSON
  | StrategyType.SpotBalancedJSON
  | StrategyType.CurveBalancedJSON
  | StrategyType.BidAskBalancedJSON
  | StrategyType.SpotImBalancedJSON
  | StrategyType.CurveImBalancedJSON
  | StrategyType.BidAskImBalancedJSON

export { Rounding }

export type RoundingKind = Rounding.Up | Rounding.Down
export type RoundingJSON = Rounding.UpJSON | Rounding.DownJSON

export { ActivationType }

/** Type of the activation */
export type ActivationTypeKind = ActivationType.Slot | ActivationType.Timestamp
export type ActivationTypeJSON =
  | ActivationType.SlotJSON
  | ActivationType.TimestampJSON

export { LayoutVersion }

/** Layout version */
export type LayoutVersionKind = LayoutVersion.V0 | LayoutVersion.V1
export type LayoutVersionJSON = LayoutVersion.V0JSON | LayoutVersion.V1JSON

export { PairType }

/** Type of the Pair. 0 = Permissionless, 1 = Permission, 2 = CustomizablePermissionless. Putting 0 as permissionless for backward compatibility. */
export type PairTypeKind =
  | PairType.Permissionless
  | PairType.Permission
  | PairType.CustomizablePermissionless
export type PairTypeJSON =
  | PairType.PermissionlessJSON
  | PairType.PermissionJSON
  | PairType.CustomizablePermissionlessJSON

export { PairStatus }

/** Pair status. 0 = Enabled, 1 = Disabled. Putting 0 as enabled for backward compatibility. */
export type PairStatusKind = PairStatus.Enabled | PairStatus.Disabled
export type PairStatusJSON = PairStatus.EnabledJSON | PairStatus.DisabledJSON
