use crate::{MaikerError, SHARE_PRECISION};
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub user: Pubkey,          // User's wallet address
    pub strategy: Pubkey,      // Reference to the StrategyConfig
    pub strategy_share: u64,   // User's share of the strategy position
    pub last_share_value: u64, // Last share value when user deposited/withdrew
    pub last_update_slot: u64, // Last slot the position was updated
    pub bump: u8,              // PDA bump
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

    /// Initialize a new user position
    pub fn initialize_user(
        &mut self,
        user: Pubkey,
        strategy: Pubkey,
        shares: u64,
        slot: u64,
        bump: u8,
    ) {
        self.user = user;
        self.strategy = strategy;
        self.strategy_share = shares;
        self.last_share_value = SHARE_PRECISION; // Initial share value is 1.0
        self.last_update_slot = slot;
        self.bump = bump;
    }

    /// Calculate performance fee if the share value has increased. Returns the performance fee shares to be deducted
    pub fn calculate_performance_fee_shares(
        &self,
        current_share_value: u64,
        performance_fee_bps: u16,
    ) -> Result<u64> {
        // If no value gain, no fee
        if current_share_value <= self.last_share_value {
            return Ok(0);
        }

        // Calculate value gain percentage (in basis points)
        let value_gain_bps = current_share_value
            .checked_sub(self.last_share_value)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_mul(10000)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_div(self.last_share_value)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        msg!("Value gain bps: {}", value_gain_bps);

        // Calculate performance fee shares
        let performance_fee_shares = (self.strategy_share as u128)
            .checked_mul(value_gain_bps as u128)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_mul(performance_fee_bps as u128)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_div(100_000_000 as u128)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok(performance_fee_shares as u64) // TODO: Check if this is correct. This may be on the value not on the shares itself
    }

    /// Calculate withdrawal fees. Returns the withdrawal fee shares to be deducted
    pub fn calculate_withdrawal_fee_shares(
        &self,
        shares_amount: u64,
        withdrawal_fee_bps: u16,
    ) -> Result<u64> {
        if withdrawal_fee_bps == 0 {
            return Ok(0);
        }

        let withdrawal_fee_shares = shares_amount
            .checked_mul(withdrawal_fee_bps as u64)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_div(10_000)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok(withdrawal_fee_shares)
    }

    /// Update user position after deposit
    pub fn update_after_deposit(
        &mut self,
        new_shares: u64,
        performance_fee_shares: u64,
        current_share_value: u64,
        slot: u64,
    ) -> Result<()> {
        // Update shares (subtract performance fee shares and add new shares)
        self.strategy_share = self
            .strategy_share
            .checked_sub(performance_fee_shares)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_add(new_shares)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        // Update last share value and timestamp
        self.last_share_value = current_share_value;
        self.last_update_slot = slot;

        Ok(())
    }

    /// Update user position after withdrawal
    pub fn update_after_withdrawal(
        &mut self,
        shares_amount: u64,
        current_share_value: u64,
        slot: u64,
    ) -> Result<()> {
        // Subtract withdrawn shares
        self.strategy_share = self
            .strategy_share
            .checked_sub(shares_amount)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        // Update last share value and timestamp
        self.last_share_value = current_share_value;
        self.last_update_slot = slot;

        Ok(())
    }
}
