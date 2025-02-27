use anchor_lang::prelude::*;

// User Events
#[event]
pub struct StrategyCreated {
    pub strategy: Pubkey,
    pub creator: Pubkey,
    pub x_mint: Pubkey,
    pub y_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UserDeposited {
    pub user: Pubkey,
    pub strategy: Pubkey,
    pub shares_amount: u64,
    pub token_x_amount: u64,
    pub token_y_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct UserWithdrew {
    pub user: Pubkey,
    pub strategy: Pubkey,
    pub shares_amount: u64,
    pub token_x_amount: u64,
    pub token_y_amount: u64,
    pub timestamp: i64,
}

// Admin Events
#[event]
pub struct FeesClaimed {
    pub strategy: Pubkey,
    pub fee_shares: u64,
    pub fee_token_x: u64,
    pub fee_token_y: u64,
    pub timestamp: i64,
}

#[event]
pub struct GlobalConfigUpdated {
    pub admin: Pubkey,
    pub performance_fee_bps: u16,
    pub withdrawal_fee_bps: u16,
    pub treasury: Pubkey,
    pub timestamp: i64,
}

// CPI Events
