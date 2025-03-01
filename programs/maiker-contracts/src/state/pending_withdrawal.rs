use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PendingWithdrawal {
    pub user: Pubkey,              // User who initiated the withdrawal
    pub strategy: Pubkey,          // Strategy from which to withdraw
    pub shares_amount: u64,        // Amount of shares to withdraw
    pub token_amount: u64,         // Amount of tokens to withdraw (calculated at initiation)
    pub initiation_timestamp: i64, // When the withdrawal was initiated
    pub available_timestamp: i64,  // When the withdrawal becomes available
    pub bump: u8,                  // PDA bump
}

impl PendingWithdrawal {
    pub const SEED_PREFIX: &'static str = "pending-withdrawal";

    pub fn get_pda_signer<'a>(self: &'a Self) -> [&'a [u8]; 4] {
        let prefix_bytes = Self::SEED_PREFIX.as_bytes();
        let user_bytes = self.user.as_ref();
        let strategy_bytes = self.strategy.as_ref();
        let bump_slice: &'a [u8] = std::slice::from_ref(&self.bump);
        [prefix_bytes, user_bytes, strategy_bytes, bump_slice]
    }

    pub fn initialize(
        &mut self,
        user: Pubkey,
        strategy: Pubkey,
        shares_amount: u64,
        token_amount: u64,
        initiation_timestamp: i64,
        available_timestamp: i64,
        bump: u8,
    ) {
        self.user = user;
        self.strategy = strategy;
        self.shares_amount = shares_amount;
        self.token_amount = token_amount;
        self.initiation_timestamp = initiation_timestamp;
        self.available_timestamp = available_timestamp;
        self.bump = bump;
    }

    pub fn is_ready(&self, current_timestamp: i64) -> bool {
        current_timestamp >= self.available_timestamp
    }
}
