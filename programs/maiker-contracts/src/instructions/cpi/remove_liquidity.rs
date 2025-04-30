use crate::state::*;
use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token::{Token, TokenAccount};
use dlmm_interface::{
    remove_all_liquidity_ix, RemoveAllLiquidityAccounts, REMOVE_ALL_LIQUIDITY_IX_ACCOUNTS_LEN,
};

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(
        constraint = authority.key() == global_config.admin
    )]
    pub authority: Signer<'info>,

    #[account(
        seeds = [GlobalConfig::SEED_PREFIX.as_bytes()],
        bump = global_config.bump,
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(mut)]
    pub strategy: Box<Account<'info, StrategyConfig>>,

    #[account(
        mut,
        token::mint = token_x_mint,
        token::authority = strategy
    )]
    pub strategy_vault_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = token_y_mint,
        token::authority = strategy
    )]
    pub strategy_vault_y: Account<'info, TokenAccount>,

    /// CHECK: This is the position account
    #[account(mut)]
    pub position: UncheckedAccount<'info>,

    /// CHECK: This is the LB pair account
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK: Bin array bitmap extension account
    #[account(mut)]
    pub bin_array_bitmap_extension: Option<UncheckedAccount<'info>>,

    /// CHECK: Reserve account for token X
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,

    /// CHECK: Reserve account for token Y
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,

    /// CHECK: Token X mint
    pub token_x_mint: UncheckedAccount<'info>,

    /// CHECK: Token Y mint
    pub token_y_mint: UncheckedAccount<'info>,

    /// CHECK: Bin array lower
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,

    /// CHECK: Bin array upper
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,

    /// CHECK: The lb_clmm program
    #[account(address = dlmm_interface::ID)]
    pub lb_clmm_program: UncheckedAccount<'info>,

    /// CHECK: Event authority for lb_clmm
    pub event_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn remove_all_liquidity_handler(ctx: Context<RemoveLiquidity>) -> Result<()> {
    // TODO: Validation Lb Pair and Strategy token accounts

    let strategy_signer = ctx.accounts.strategy.get_pda_signer();
    let strategy_signer_seeds = &[&strategy_signer[..]];

    let bin_array_bitmap_extension_info =
        if let Some(account) = &ctx.accounts.bin_array_bitmap_extension {
            account.to_account_info()
        } else {
            ctx.accounts.lb_clmm_program.to_account_info()
        };

    // Create the accounts for the CPI call
    let accounts = RemoveAllLiquidityAccounts {
        position: &ctx.accounts.position.to_account_info(),
        lb_pair: &ctx.accounts.lb_pair.to_account_info(),
        bin_array_bitmap_extension: &bin_array_bitmap_extension_info,
        user_token_x: &ctx.accounts.strategy_vault_x.to_account_info(),
        user_token_y: &ctx.accounts.strategy_vault_y.to_account_info(),
        reserve_x: &ctx.accounts.reserve_x.to_account_info(),
        reserve_y: &ctx.accounts.reserve_y.to_account_info(),
        token_x_mint: &ctx.accounts.token_x_mint.to_account_info(),
        token_y_mint: &ctx.accounts.token_y_mint.to_account_info(),
        bin_array_lower: &ctx.accounts.bin_array_lower.to_account_info(),
        bin_array_upper: &ctx.accounts.bin_array_upper.to_account_info(),
        sender: &ctx.accounts.strategy.to_account_info(),
        token_x_program: &ctx.accounts.token_program.to_account_info(),
        token_y_program: &ctx.accounts.token_program.to_account_info(),
        event_authority: &ctx.accounts.event_authority.to_account_info(),
        program: &ctx.accounts.lb_clmm_program.to_account_info(),
    };

    // remove_all_liquidity_invoke_signed(accounts, strategy_signer_seeds)?;

    let keys = accounts.into();
    let account_infos: [AccountInfo; REMOVE_ALL_LIQUIDITY_IX_ACCOUNTS_LEN] = accounts.into();
    let ix = remove_all_liquidity_ix(keys)?;

    invoke_signed(&ix, &account_infos, strategy_signer_seeds)?;

    Ok(())
}
