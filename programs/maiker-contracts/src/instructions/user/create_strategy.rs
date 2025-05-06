use crate::{state::*, CreateStrategyEvent, ANCHOR_DISCRIMINATOR};
use anchor_lang::prelude::*;
use anchor_spl::metadata::mpl_token_metadata::types::DataV2;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata as Metaplex},
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
        mint::decimals = StrategyConfig::M_TOKEN_DECIMALS,
        mint::authority = strategy,
        seeds = [StrategyConfig::M_TOKEN_SEED_PREFIX.as_bytes(), strategy.key().as_ref()],
        bump
    )]
    pub m_token_mint: Account<'info, Mint>,
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

    // Initialize strategy (state only)
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
    let token_data: DataV2 = DataV2 {
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };
    let signer_seeds: &[&[&[u8]]] = &[&[
        StrategyConfig::SEED_PREFIX.as_bytes(),
        ctx.accounts.creator.key.as_ref(),
        &[strategy_bump],
    ]];
    let metadata_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            payer: ctx.accounts.creator.to_account_info(),
            update_authority: ctx.accounts.strategy.to_account_info(),
            mint: ctx.accounts.m_token_mint.to_account_info(),
            metadata: ctx.accounts.metadata.to_account_info(),
            mint_authority: ctx.accounts.strategy.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
        signer_seeds,
    );
    create_metadata_accounts_v3(metadata_ctx, token_data, true, true, None)?;

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
