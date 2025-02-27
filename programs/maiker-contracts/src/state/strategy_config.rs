use anchor_lang::prelude::*;

use crate::MAX_POSITIONS;

#[account]
#[derive(InitSpace)]
pub struct StrategyConfig {
    pub creator: Pubkey,
    pub x_mint: Pubkey,
    pub y_mint: Pubkey,
    pub x_vault: Pubkey,
    pub y_vault: Pubkey,

    // Total shares issued
    pub strategy_shares: u64,

    // Fee Shares
    pub fee_shares_pending: u64,

    // Direct position tracking
    pub position_count: u8,
    pub positions: [Pubkey; MAX_POSITIONS],

    // Rebalancing info
    pub last_rebalance_time: i64,

    // For PDA derivation
    pub bump: u8,
}

impl StrategyConfig {
    pub const SEED_PREFIX: &'static str = "strategy-config";

    pub fn get_pda_signer<'a>(self: &'a Self) -> [&'a [u8]; 3] {
        let prefix_bytes = Self::SEED_PREFIX.as_bytes();
        let creator_bytes = self.creator.as_ref();
        let bump_slice: &'a [u8] = std::slice::from_ref(&self.bump);
        [prefix_bytes, creator_bytes, bump_slice]
    }
}
