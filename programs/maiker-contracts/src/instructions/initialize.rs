use crate::constants::*;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = ANCHOR_DISCRIMINATOR + GlobalConfig::INIT_SPACE,
        seeds = [GlobalConfig::SEED_PREFIX.as_bytes()],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_handler(
    ctx: Context<Initialize>,
    global_config_args: GlobalConfigArgs,
) -> Result<()> {
    let global_config = &mut ctx.accounts.global_config;
    let bump = ctx.bumps.global_config;

    global_config.initialize_global_config(global_config_args, ctx.accounts.admin.key(), bump);

    Ok(())
}
