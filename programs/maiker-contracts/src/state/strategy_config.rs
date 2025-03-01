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
    // Potentially later require PDA per position to track position value accurately
    pub position_count: u8,
    pub positions: [Pubkey; MAX_POSITIONS],
    pub positions_values: [u64; MAX_POSITIONS], // Total position value in token X
    pub last_position_update: [i64; MAX_POSITIONS],

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

    pub fn initialize_strategy(
        self: &mut Self,
        owner: Pubkey,
        x_mint: Pubkey,
        y_mint: Pubkey,
        x_vault: Pubkey,
        y_vault: Pubkey,
        bump: u8,
    ) {
        self.creator = owner;
        self.x_mint = x_mint;
        self.y_mint = y_mint;
        self.x_vault = x_vault;
        self.y_vault = y_vault;
        self.strategy_shares = 0;
        self.fee_shares_pending = 0;
        self.position_count = 0;
        self.positions = [Pubkey::default(); MAX_POSITIONS];
        self.positions_values = [0; MAX_POSITIONS];
        self.last_position_update = [0; MAX_POSITIONS];
        self.last_rebalance_time = 0;
        self.bump = bump;
    }

    pub fn update_position_value(
        self: &mut Self,
        position_key: Pubkey,
        value: u64,
        last_update: i64,
    ) {
        let index = self
            .positions
            .iter()
            .position(|&key| key == position_key)
            .unwrap();
        self.positions_values[index] = value;
        self.last_position_update[index] = last_update;
    }
}
