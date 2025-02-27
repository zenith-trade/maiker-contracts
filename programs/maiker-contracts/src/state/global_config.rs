use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub admin: Pubkey,            // Primary admin with full control
    pub performance_fee_bps: u16, // Performance fee in basis points
    pub withdrawal_fee_bps: u16,  // Optional withdrawal fee in basis points
    pub treasury: Pubkey,         // Address where fees are sent
    pub bump: u8,                 // PDA bump
}

impl GlobalConfig {
    pub const SEED_PREFIX: &'static str = "global-config";

    pub fn get_pda_signer<'a>(self: &'a Self) -> [&'a [u8]; 2] {
        let prefix_bytes = Self::SEED_PREFIX.as_bytes();
        let bump_slice: &'a [u8] = std::slice::from_ref(&self.bump);
        [prefix_bytes, bump_slice]
    }
}
