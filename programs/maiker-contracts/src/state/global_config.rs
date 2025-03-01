use anchor_lang::prelude::*;

use crate::MaikerError;

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct GlobalConfigArgs {
    pub admin: Pubkey,
    pub performance_fee_bps: u16,
    pub withdrawal_fee_bps: u16,
    pub treasury: Pubkey,
    pub interval_seconds: u64,
    pub new_admin: Option<Pubkey>,
}

#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub admin: Pubkey,                    // Primary admin with full control
    pub performance_fee_bps: u16,         // Performance fee in basis points
    pub withdrawal_fee_bps: u16,          // Optional withdrawal fee in basis points
    pub treasury: Pubkey,                 // Address where fees are sent
    pub withdrawal_interval_seconds: u64, // Time interval for withdrawal windows (default: 3600 = 1 hour)
    pub bump: u8,                         // PDA bump
}

impl GlobalConfig {
    pub const SEED_PREFIX: &'static str = "global-config";

    pub fn get_pda_signer<'a>(self: &'a Self) -> [&'a [u8]; 2] {
        let prefix_bytes = Self::SEED_PREFIX.as_bytes();
        let bump_slice: &'a [u8] = std::slice::from_ref(&self.bump);
        [prefix_bytes, bump_slice]
    }

    /// Calculate the next withdrawal window timestamp. It's the next full hour plus 1 hour
    pub fn calculate_withdrawal_timestamp(&self, current_timestamp: i64) -> Result<i64> {
        // Convert to u64 for checked arithmetic
        let current_ts = current_timestamp as u64;

        // Calculate seconds into current hour
        let seconds_in_hour = 3600u64;
        let seconds_into_hour = current_ts
            .checked_rem(seconds_in_hour)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        // Calculate start of next hour
        let next_hour = current_ts
            .checked_sub(seconds_into_hour)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_add(seconds_in_hour)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        // Add 1 hour to get withdrawal timestamp
        let withdrawal_timestamp = next_hour
            .checked_add(seconds_in_hour)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        // Convert back to i64
        Ok(withdrawal_timestamp as i64)
    }

    pub fn initialize_global_config(&mut self, args: GlobalConfigArgs, bump: u8) {
        self.admin = args.admin;
        self.performance_fee_bps = args.performance_fee_bps;
        self.withdrawal_fee_bps = args.withdrawal_fee_bps;
        self.treasury = args.treasury;
        self.withdrawal_interval_seconds = args.interval_seconds;
        self.bump = bump;
    }

    pub fn update_global_config(&mut self, args: GlobalConfigArgs) {
        self.performance_fee_bps = args.performance_fee_bps;
        self.withdrawal_fee_bps = args.withdrawal_fee_bps;
        self.treasury = args.treasury;
        self.withdrawal_interval_seconds = args.interval_seconds;
        self.admin = args.new_admin.unwrap_or(self.admin);
    }
}
