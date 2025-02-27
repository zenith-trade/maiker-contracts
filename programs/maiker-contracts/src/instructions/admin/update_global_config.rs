use crate::{error::MaikerError, state::*, GlobalConfigUpdated};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateGlobalConfig<'info> {
    #[account(
        constraint = authority.key() == global_config.admin @ MaikerError::NotAuthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global_config"],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

pub fn update_global_config_handler(
    ctx: Context<UpdateGlobalConfig>,
    performance_fee_bps: Option<u16>,
    withdrawal_fee_bps: Option<u16>,
    treasury: Option<Pubkey>,
    new_admin: Option<Pubkey>,
) -> Result<()> {
    let global_config = &mut ctx.accounts.global_config;

    // Update performance fee if provided
    if let Some(fee) = performance_fee_bps {
        require!(fee <= 3000, MaikerError::InvalidFee); // Max 30%
        global_config.performance_fee_bps = fee;
    }

    // Update withdrawal fee if provided
    if let Some(fee) = withdrawal_fee_bps {
        require!(fee <= 500, MaikerError::InvalidFee); // Max 5%
        global_config.withdrawal_fee_bps = fee;
    }

    // Update treasury if provided
    if let Some(new_treasury) = treasury {
        global_config.treasury = new_treasury;
    }

    // Update admin if provided
    if let Some(admin) = new_admin {
        global_config.admin = admin;
    }

    // Emit event
    emit!(GlobalConfigUpdated {
        admin: global_config.admin,
        performance_fee_bps: global_config.performance_fee_bps,
        withdrawal_fee_bps: global_config.withdrawal_fee_bps,
        treasury: global_config.treasury,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
