export type CustomError =
  | ArithmeticOverflow
  | NotAuthorized
  | InvalidFee
  | NoShares
  | InvalidWithdrawalAmount
  | NoFeesToWithdraw
  | MaxPositionsReached
  | InvalidPosition
  | InvalidBinId
  | InvalidDepositAmount
  | StalePositionValue
  | InvalidWithdrawalInterval
  | WithdrawalNotReady
  | PositionNotFound
  | InvalidSwap
  | NonZeroTransferFee
  | InvalidMetadataParam

export class ArithmeticOverflow extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "ArithmeticOverflow"
  readonly msg = "Arithmetic overflow"

  constructor(readonly logs?: string[]) {
    super("6000: Arithmetic overflow")
  }
}

export class NotAuthorized extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "NotAuthorized"
  readonly msg = "Not authorized to perform this action"

  constructor(readonly logs?: string[]) {
    super("6001: Not authorized to perform this action")
  }
}

export class InvalidFee extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "InvalidFee"
  readonly msg = "Invalid fee (performance fee max 30%, withdrawal fee max 5%)"

  constructor(readonly logs?: string[]) {
    super("6002: Invalid fee (performance fee max 30%, withdrawal fee max 5%)")
  }
}

export class NoShares extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "NoShares"
  readonly msg = "No shares in strategy"

  constructor(readonly logs?: string[]) {
    super("6003: No shares in strategy")
  }
}

export class InvalidWithdrawalAmount extends Error {
  static readonly code = 6004
  readonly code = 6004
  readonly name = "InvalidWithdrawalAmount"
  readonly msg = "Invalid withdrawal amount"

  constructor(readonly logs?: string[]) {
    super("6004: Invalid withdrawal amount")
  }
}

export class NoFeesToWithdraw extends Error {
  static readonly code = 6005
  readonly code = 6005
  readonly name = "NoFeesToWithdraw"
  readonly msg = "No fees to withdraw"

  constructor(readonly logs?: string[]) {
    super("6005: No fees to withdraw")
  }
}

export class MaxPositionsReached extends Error {
  static readonly code = 6006
  readonly code = 6006
  readonly name = "MaxPositionsReached"
  readonly msg = "Max positions reached"

  constructor(readonly logs?: string[]) {
    super("6006: Max positions reached")
  }
}

export class InvalidPosition extends Error {
  static readonly code = 6007
  readonly code = 6007
  readonly name = "InvalidPosition"
  readonly msg = "Invalid position"

  constructor(readonly logs?: string[]) {
    super("6007: Invalid position")
  }
}

export class InvalidBinId extends Error {
  static readonly code = 6008
  readonly code = 6008
  readonly name = "InvalidBinId"
  readonly msg = "Invalid bin id"

  constructor(readonly logs?: string[]) {
    super("6008: Invalid bin id")
  }
}

export class InvalidDepositAmount extends Error {
  static readonly code = 6009
  readonly code = 6009
  readonly name = "InvalidDepositAmount"
  readonly msg = "Invalid deposit amount"

  constructor(readonly logs?: string[]) {
    super("6009: Invalid deposit amount")
  }
}

export class StalePositionValue extends Error {
  static readonly code = 6010
  readonly code = 6010
  readonly name = "StalePositionValue"
  readonly msg =
    "Position value is stale and must be updated in the current slot"

  constructor(readonly logs?: string[]) {
    super(
      "6010: Position value is stale and must be updated in the current slot"
    )
  }
}

export class InvalidWithdrawalInterval extends Error {
  static readonly code = 6011
  readonly code = 6011
  readonly name = "InvalidWithdrawalInterval"
  readonly msg = "Invalid withdrawal interval (minimum 5 minutes)"

  constructor(readonly logs?: string[]) {
    super("6011: Invalid withdrawal interval (minimum 5 minutes)")
  }
}

export class WithdrawalNotReady extends Error {
  static readonly code = 6012
  readonly code = 6012
  readonly name = "WithdrawalNotReady"
  readonly msg = "Withdrawal is not ready yet"

  constructor(readonly logs?: string[]) {
    super("6012: Withdrawal is not ready yet")
  }
}

export class PositionNotFound extends Error {
  static readonly code = 6013
  readonly code = 6013
  readonly name = "PositionNotFound"
  readonly msg = "Position not found"

  constructor(readonly logs?: string[]) {
    super("6013: Position not found")
  }
}

export class InvalidSwap extends Error {
  static readonly code = 6014
  readonly code = 6014
  readonly name = "InvalidSwap"
  readonly msg = "Invalid swap instruction"

  constructor(readonly logs?: string[]) {
    super("6014: Invalid swap instruction")
  }
}

export class NonZeroTransferFee extends Error {
  static readonly code = 6015
  readonly code = 6015
  readonly name = "NonZeroTransferFee"
  readonly msg = "Non-zero transfer fee"

  constructor(readonly logs?: string[]) {
    super("6015: Non-zero transfer fee")
  }
}

export class InvalidMetadataParam extends Error {
  static readonly code = 6016
  readonly code = 6016
  readonly name = "InvalidMetadataParam"
  readonly msg =
    "Invalid metadata parameter: name, symbol, or uri is empty or too long"

  constructor(readonly logs?: string[]) {
    super(
      "6016: Invalid metadata parameter: name, symbol, or uri is empty or too long"
    )
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new ArithmeticOverflow(logs)
    case 6001:
      return new NotAuthorized(logs)
    case 6002:
      return new InvalidFee(logs)
    case 6003:
      return new NoShares(logs)
    case 6004:
      return new InvalidWithdrawalAmount(logs)
    case 6005:
      return new NoFeesToWithdraw(logs)
    case 6006:
      return new MaxPositionsReached(logs)
    case 6007:
      return new InvalidPosition(logs)
    case 6008:
      return new InvalidBinId(logs)
    case 6009:
      return new InvalidDepositAmount(logs)
    case 6010:
      return new StalePositionValue(logs)
    case 6011:
      return new InvalidWithdrawalInterval(logs)
    case 6012:
      return new WithdrawalNotReady(logs)
    case 6013:
      return new PositionNotFound(logs)
    case 6014:
      return new InvalidSwap(logs)
    case 6015:
      return new NonZeroTransferFee(logs)
    case 6016:
      return new InvalidMetadataParam(logs)
  }

  return null
}
