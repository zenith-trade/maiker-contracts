use anchor_lang::prelude::*;

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

    /// Calculate the next withdrawal window timestamp
    pub fn calculate_next_withdrawal_window(&self, current_timestamp: i64) -> i64 {
        // Calculate how many intervals have passed since epoch
        let intervals_since_epoch = current_timestamp as u64 / self.withdrawal_interval_seconds;

        // Calculate the next interval timestamp
        let next_window = (intervals_since_epoch + 1) * self.withdrawal_interval_seconds;

        next_window as i64
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
