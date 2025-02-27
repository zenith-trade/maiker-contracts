use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(
        constraint = authority.key() == global_config.admin
    )]
    pub authority: Signer<'info>,

    #[account(
        seeds = [GlobalConfig::SEED_PREFIX.as_bytes()],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub strategy: Account<'info, StrategyConfig>,

    #[account(
        mut,
        constraint = strategy_vault_x.key() == strategy.x_vault
    )]
    pub strategy_vault_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = strategy_vault_y.key() == strategy.y_vault
    )]
    pub strategy_vault_y: Account<'info, TokenAccount>,

    // Meteora program and accounts would be included here
    // This is a simplified version
    pub token_program: Program<'info, Token>,
}

pub fn remove_liquidity_handler(ctx: Context<RemoveLiquidity>) -> Result<()> {
    let clock = Clock::get()?;

    // Here we would perform the CPI to Meteora's remove_liquidity instruction

    // Update Strategy Config

    // Emit event

    Ok(())
}
