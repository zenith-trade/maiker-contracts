use anchor_lang::prelude::*;

#[error_code]
pub enum MaikerError {
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Not authorized to perform this action")]
    NotAuthorized,

    #[msg("Invalid fee (performance fee max 30%, withdrawal fee max 5%)")]
    InvalidFee,

    #[msg("No shares in strategy")]
    NoShares,

    #[msg("Invalid withdrawal amount")]
    InvalidWithdrawalAmount,

    #[msg("No fees to withdraw")]
    NoFeesToWithdraw,

    #[msg("Max positions reached")]
    MaxPositionsReached,

    #[msg("Invalid position")]
    InvalidPosition,

    #[msg("Invalid bin id")]
    InvalidBinId,

    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,

    #[msg("Position value is stale and must be updated in the current slot")]
    StalePositionValue,

    #[msg("Invalid withdrawal interval (minimum 5 minutes)")]
    InvalidWithdrawalInterval,

    #[msg("Withdrawal is not ready yet")]
    WithdrawalNotReady,

    #[msg("Position not found")]
    PositionNotFound,

    // Swap errors
    #[msg("Invalid swap instruction")]
    InvalidSwap,

    #[msg("Non-zero transfer fee")]
    NonZeroTransferFee,
}
