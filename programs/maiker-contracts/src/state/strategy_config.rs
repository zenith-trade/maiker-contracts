use anchor_lang::prelude::*;

use crate::{MaikerError, MAX_POSITIONS, SHARE_PRECISION};

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
    pub fee_shares: u64,

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
        self.fee_shares = 0;
        self.position_count = 0;
        self.positions = [Pubkey::default(); MAX_POSITIONS];
        self.positions_values = [0; MAX_POSITIONS];
        self.last_position_update = [0; MAX_POSITIONS];
        self.last_rebalance_time = 0;
        self.bump = bump;
    }

    pub fn mint_shares(&mut self, amount: u64) -> Result<()> {
        self.strategy_shares = self
            .strategy_shares
            .checked_add(amount)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok(())
    }

    pub fn burn_shares(&mut self, amount: u64) -> Result<()> {
        self.strategy_shares = self
            .strategy_shares
            .checked_sub(amount)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok(())
    }

    pub fn add_fee_shares(&mut self, amount: u64) -> Result<()> {
        self.fee_shares = self
            .fee_shares
            .checked_add(amount)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok(())
    }

    pub fn burn_fee_shares(&mut self, amount: u64) -> Result<()> {
        self.fee_shares = self
            .fee_shares
            .checked_sub(amount)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok(())
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

    /// Validates that all active positions have their values updated in the current slot
    pub fn validate_position_values_freshness(&self, current_timestamp: i64) -> Result<()> {
        for i in 0..self.position_count as usize {
            let position_pubkey = self.positions[i];

            // Skip empty position slots
            if position_pubkey == Pubkey::default() {
                continue;
            }

            // Verify this position was updated in the current slot
            require!(
                self.last_position_update[i] == current_timestamp,
                MaikerError::StalePositionValue
            );
        }

        Ok(())
    }

    /// Calculate the total value of all positions in the strategy
    fn get_total_positions_value(&self) -> Result<u64> {
        let mut total_value: u64 = 0;

        for i in 0..self.position_count as usize {
            let position_pubkey = self.positions[i];

            // Skip empty position slots
            if position_pubkey == Pubkey::default() {
                continue;
            }

            total_value = total_value
                .checked_add(self.positions_values[i])
                .ok_or(MaikerError::ArithmeticOverflow)?;
        }

        Ok(total_value)
    }

    /// Calculate the total strategy value (vault value + positions value)
    pub fn calculate_total_strategy_value(&self, vault_x_amount: u64) -> Result<u64> {
        let positions_value = self.get_total_positions_value()?;

        let total_value = vault_x_amount
            .checked_add(positions_value)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok(total_value)
    }

    /// Calculate the current share value based on total strategy value and total shares
    pub fn calculate_share_value(&self, total_strategy_value: u64) -> Result<u64> {
        if self.strategy_shares == 0 {
            return Ok(SHARE_PRECISION); // Default to 1.0 if no shares exist
        }

        let share_value = (total_strategy_value as u128)
            .checked_mul(SHARE_PRECISION as u128)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_div(self.strategy_shares as u128)
            .ok_or(MaikerError::ArithmeticOverflow)? as u64;

        Ok(share_value)
    }

    /// Calculate shares to mint for a deposit
    pub fn calculate_shares_for_deposit(
        &self,
        deposit_value: u64,
        current_share_value: u64,
    ) -> Result<u64> {
        // Formula: new_shares = (deposit_value * SHARE_PRECISION) / current_share_value
        let new_shares = deposit_value
            .checked_mul(SHARE_PRECISION)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_div(current_share_value)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok(new_shares)
    }

    /// Calculate token amount to return for a withdrawal
    pub fn calculate_withdrawal_amount(
        &self,
        shares_amount: u64,
        current_share_value: u64,
    ) -> Result<u64> {
        // Formula: token_amount = (shares_amount * current_share_value) / SHARE_PRECISION
        let token_amount = (shares_amount as u128)
            .checked_mul(current_share_value as u128)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_div(SHARE_PRECISION as u128)
            .ok_or(MaikerError::ArithmeticOverflow)? as u64;

        Ok(token_amount)
    }
}
