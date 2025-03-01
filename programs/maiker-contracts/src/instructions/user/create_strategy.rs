use crate::{state::*, StrategyCreated, ANCHOR_DISCRIMINATOR};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct CreateStrategy<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    pub x_mint: Account<'info, Mint>,
    pub y_mint: Account<'info, Mint>,

    #[account(
        associated_token::mint = x_mint,
        associated_token::authority = strategy,
    )]
    pub x_vault: Account<'info, TokenAccount>,

    #[account(
        associated_token::mint = y_mint,
        associated_token::authority = strategy,
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

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_strategy_handler(ctx: Context<CreateStrategy>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let clock = Clock::get()?;

    let strategy_bump = *ctx.bumps.get("strategy").unwrap();

    // Initialize strategy
    strategy.initialize_strategy(
        ctx.accounts.creator.key(),
        ctx.accounts.x_mint.key(),
        ctx.accounts.y_mint.key(),
        ctx.accounts.x_vault.key(),
        ctx.accounts.y_vault.key(),
        strategy_bump,
    );

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
