use crate::{error::MaikerError, state::*, UpdateGlobalConfigEvent};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateGlobalConfig<'info> {
    #[account(
        constraint = authority.key() == global_config.admin @ MaikerError::NotAuthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GlobalConfig::SEED_PREFIX.as_bytes()],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

pub fn update_global_config_handler(
    ctx: Context<UpdateGlobalConfig>,
    global_config_args: GlobalConfigArgs,
) -> Result<()> {
    let global_config = &mut ctx.accounts.global_config;

    global_config.update_global_config(global_config_args);

    // Emit event
    emit!(UpdateGlobalConfigEvent {
        admin: global_config.admin,
        performance_fee_bps: global_config.performance_fee_bps,
        withdrawal_fee_bps: global_config.withdrawal_fee_bps,
        treasury: global_config.treasury,
        withdrawal_interval_seconds: global_config.withdrawal_interval_seconds,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
