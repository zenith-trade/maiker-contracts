use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub user: Pubkey,               // User's wallet address
    pub strategy: Pubkey,           // Reference to the StrategyConfig
    pub strategy_share: u64,        // User's share of the strategy position
    pub last_share_value: u64,      // Last share value when user deposited/withdrew
    pub last_update_timestamp: i64, // Last time the position was updated
    pub bump: u8,                   // PDA bump
}

impl UserPosition {
    pub const SEED_PREFIX: &'static str = "user-position";

    pub fn get_pda_signer<'a>(self: &'a Self) -> [&'a [u8]; 4] {
        let prefix_bytes = Self::SEED_PREFIX.as_bytes();
        let user_bytes = self.user.as_ref();
        let strategy_bytes = self.strategy.as_ref();
        let bump_slice: &'a [u8] = std::slice::from_ref(&self.bump);
        [prefix_bytes, user_bytes, strategy_bytes, bump_slice]
    }
}
