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
}
