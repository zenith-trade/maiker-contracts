use crate::{state::*, StrategyCreated, ANCHOR_DISCRIMINATOR, MAX_POSITIONS};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
pub struct CreateStrategy<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    pub x_mint: Account<'info, Mint>,
    pub y_mint: Account<'info, Mint>,

    #[account(
        constraint = x_vault.mint == x_mint.key(),
        constraint = x_vault.owner == strategy.key()
    )]
    pub x_vault: Account<'info, TokenAccount>,

    #[account(
        constraint = y_vault.mint == y_mint.key(),
        constraint = y_vault.owner == strategy.key()
    )]
    pub y_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        space = ANCHOR_DISCRIMINATOR + StrategyConfig::INIT_SPACE,
        seeds = [StrategyConfig::SEED_PREFIX.as_bytes(), creator.key().as_ref()],
        bump
    )]
    pub strategy: Account<'info, StrategyConfig>,

    pub system_program: Program<'info, System>,
}

pub fn create_strategy_handler(ctx: Context<CreateStrategy>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let clock = Clock::get()?;

    let strategy_bump = *ctx.bumps.get("strategy").unwrap();
    let metrics_bump = *ctx.bumps.get("performance_metrics").unwrap();

    // Initialize strategy
    strategy.creator = ctx.accounts.creator.key();
    strategy.x_mint = ctx.accounts.x_mint.key();
    strategy.y_mint = ctx.accounts.y_mint.key();
    strategy.x_vault = ctx.accounts.x_vault.key();
    strategy.y_vault = ctx.accounts.y_vault.key();
    strategy.strategy_shares = 0;

    strategy.positions = [Pubkey::default(); MAX_POSITIONS];
    strategy.position_count = 0;
    strategy.last_rebalance_time = clock.unix_timestamp;

    strategy.bump = strategy_bump;

    // Emit event
    emit!(StrategyCreated {
        strategy: strategy.key(),
        creator: ctx.accounts.creator.key(),
        x_mint: strategy.x_mint,
        y_mint: strategy.y_mint,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
