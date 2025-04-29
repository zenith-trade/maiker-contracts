use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::state::types::LiquidityParameterByWeight;
use crate::{GlobalConfig, StrategyConfig};
use dlmm_interface::{
    add_liquidity_by_weight_invoke_signed, AddLiquidityByWeightAccounts, AddLiquidityByWeightIxArgs,
};

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    /// The authority of the strategy
    #[account(
        mut,
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

    /// CPI accounts below
    /// CHECK: The position account
    #[account(mut)]
    pub position: UncheckedAccount<'info>,

    /// CHECK: The LB pair account
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK: Token X mint
    #[account(mut)]
    pub token_x_mint: UncheckedAccount<'info>,

    /// CHECK: Token Y mint
    #[account(mut)]
    pub token_y_mint: UncheckedAccount<'info>,

    /// The strategy vault for token X
    #[account(mut)]
    pub strategy_vault_x: Account<'info, TokenAccount>,

    /// The strategy vault for token Y
    #[account(mut)]
    pub strategy_vault_y: Account<'info, TokenAccount>,

    /// CHECK: The reserve account for token X
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,

    /// CHECK: The reserve account for token Y
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,

    /// CHECK: The bin array for the lower bins
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,

    /// CHECK: The bin array for the upper bins
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,

    /// CHECK: The bin array bitmap extension
    #[account(mut)]
    pub bin_array_bitmap_extension: Option<UncheckedAccount<'info>>,

    /// The lb_clmm program
    /// CHECK: The lb_clmm program
    #[account(address = dlmm_interface::ID)]
    pub lb_clmm_program: UncheckedAccount<'info>,

    /// CHECK: Event authority for lb_clmm
    pub event_authority: UncheckedAccount<'info>,

    /// The token program
    pub token_program: Program<'info, Token>,

    /// The system program
    pub system_program: Program<'info, System>,
}

pub fn add_liquidity_handler(
    ctx: Context<AddLiquidity>,
    liquidity_parameter: LiquidityParameterByWeight,
) -> Result<()> {
    // TODO: Validation Lb Pair and Strategy token accounts

    let strategy_signer = ctx.accounts.strategy.get_pda_signer();
    let strategy_signer_seeds = &[&strategy_signer[..]];

    let bin_array_bitmap_extension_info =
        if let Some(account) = &ctx.accounts.bin_array_bitmap_extension {
            account.to_account_info()
        } else {
            ctx.accounts.lb_clmm_program.to_account_info()
        };

    let accounts = AddLiquidityByWeightAccounts {
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

    // Convert local struct to dlmm_interface format
    let dlmm_liquidity_parameter: dlmm_interface::LiquidityParameterByWeight =
        liquidity_parameter.into();

    let args = AddLiquidityByWeightIxArgs {
        liquidity_parameter: dlmm_liquidity_parameter,
    };

    add_liquidity_by_weight_invoke_signed(accounts, args, strategy_signer_seeds)?;

    Ok(())
}
