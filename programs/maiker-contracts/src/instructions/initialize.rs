use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = GlobalConfig::INIT_SPACE,
        seeds = [GlobalConfig::SEED_PREFIX.as_bytes()],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_handler(
    ctx: Context<Initialize>,
    performance_fee_bps: u16,
    withdrawal_fee_bps: u16,
) -> Result<()> {
    let global_config = &mut ctx.accounts.global_config;
    let bump = *ctx.bumps.get("global_config").unwrap();

    global_config.admin = ctx.accounts.admin.key();
    global_config.performance_fee_bps = performance_fee_bps;
    global_config.withdrawal_fee_bps = withdrawal_fee_bps;
    global_config.treasury = ctx.accounts.admin.key(); // Default to admin, can be updated later
    global_config.bump = bump;

    Ok(())
}
