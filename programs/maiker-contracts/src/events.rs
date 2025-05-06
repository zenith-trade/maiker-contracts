use anchor_lang::prelude::*;

// User Events
#[event]
pub struct CreateStrategyEvent {
    pub strategy: Pubkey,
    pub creator: Pubkey,
    pub x_mint: Pubkey,
    pub y_mint: Pubkey,
    pub m_token_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UserDepositEvent {
    pub user: Pubkey,
    pub strategy: Pubkey,
    pub shares_amount: u64,
    pub current_share_value: u64,
    pub token_amount: u64,
    pub performance_fee_shares: u64,
    pub timestamp: i64,
}

#[event]
pub struct InitiateWithdrawEvent {
    pub user: Pubkey,
    pub strategy: Pubkey,
    pub shares_amount: u64,
    pub current_share_value: u64,
    pub token_amount: u64,
    pub withdrawal_fee_shares: u64,
    pub performance_fee_shares: u64,
    pub initiation_timestamp: i64,
    pub available_timestamp: i64,
}

#[event]
pub struct ProcessWithdrawEvent {
    pub user: Pubkey,
    pub strategy: Pubkey,
    pub shares_amount: u64,
    pub token_amount: u64,
    pub timestamp: i64,
}

// Admin Events
#[event]
pub struct UpdateGlobalConfigEvent {
    pub admin: Pubkey,
    pub performance_fee_bps: u16,
    pub withdrawal_fee_bps: u16,
    pub treasury: Pubkey,
    pub withdrawal_interval_seconds: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimFeeSharesEvent {
    pub strategy: Pubkey,
    pub fee_shares: u64,
    pub token_amount: u64,
    pub timestamp: i64,
}

// CPI Events
