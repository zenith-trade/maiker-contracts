use crate::{
    controllers::token,
    state::*,
    CreateStrategyEvent,
    ANCHOR_DISCRIMINATOR,
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::Metadata as Metaplex,
    token::{Mint as TokenMint, Token, TokenAccount as TokenTokenAccount}
};

#[derive(Accounts)]
pub struct CreateStrategy<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    pub x_mint: Account<'info, TokenMint>,
    pub y_mint: Account<'info, TokenMint>,

    #[account(
        associated_token::mint = x_mint,
        associated_token::authority = strategy,
    )]
    pub x_vault: Account<'info, TokenTokenAccount>,

    #[account(
        associated_token::mint = y_mint,
        associated_token::authority = strategy,
    )]
    pub y_vault: Account<'info, TokenTokenAccount>,

    #[account(
        init,
        payer = creator,
        mint::decimals = StrategyConfig::M_TOKEN_DECIMALS,
        mint::authority = strategy,
        seeds = [StrategyConfig::M_TOKEN_SEED_PREFIX.as_bytes(), strategy.key().as_ref()],
        bump
    )]
    pub m_token_mint: Account<'info, TokenMint>,
    /// CHECK: Validate address by deriving pda
    #[account(
        mut,
        seeds = [
        StrategyConfig::METADATA_SEED,
        token_metadata_program.key().as_ref(),
        m_token_mint.key().as_ref()
    ],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata: UncheckedAccount<'info>,

    #[account(
        init,
        payer = creator,
        space = ANCHOR_DISCRIMINATOR + StrategyConfig::INIT_SPACE,
        seeds = [StrategyConfig::SEED_PREFIX.as_bytes(), creator.key().as_ref()],
        bump
    )]
    pub strategy: Box<Account<'info, StrategyConfig>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_metadata_program: Program<'info, Metaplex>,
}

pub fn create_strategy_handler(
    ctx: Context<CreateStrategy>,
    params: CreateStrategyMetadataParams,
) -> Result<()> {
    params.validate()?;
    let clock = Clock::get()?;
    let strategy_bump = ctx.bumps.strategy;

    // Initialize strategy
    ctx.accounts.strategy.initialize_strategy(
        ctx.accounts.creator.key(),
        ctx.accounts.x_mint.key(),
        ctx.accounts.y_mint.key(),
        ctx.accounts.x_vault.key(),
        ctx.accounts.y_vault.key(),
        ctx.accounts.m_token_mint.key(),
        strategy_bump,
    );

    // Create metadata for m-token mint
    token::create_metadata(
        &ctx.accounts.token_metadata_program,
        &ctx.accounts.creator,
        &ctx.accounts.strategy,
        &ctx.accounts.m_token_mint,
        &ctx.accounts.metadata,
        &ctx.accounts.system_program,
        &ctx.accounts.rent,
        params.name,
        params.symbol,
        params.uri,
        strategy_bump,
    )?;

    // Emit event with m_token_mint
    emit!(CreateStrategyEvent {
        strategy: ctx.accounts.strategy.key(),
        creator: ctx.accounts.creator.key(),
        x_mint: ctx.accounts.strategy.x_mint,
        y_mint: ctx.accounts.strategy.y_mint,
        m_token_mint: ctx.accounts.strategy.m_token_mint,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
