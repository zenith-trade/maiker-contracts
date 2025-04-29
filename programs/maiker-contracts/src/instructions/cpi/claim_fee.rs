use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use dlmm_interface::{claim_fee_invoke_signed, ClaimFeeAccounts};

#[derive(Accounts)]
pub struct ClaimFee<'info> {
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
    pub strategy_vault_x: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = token_y_mint,
        token::authority = strategy
    )]
    pub strategy_vault_y: Box<Account<'info, TokenAccount>>,

    /// CHECK: This is the position account
    #[account(mut)]
    pub position: UncheckedAccount<'info>,

    /// CHECK: This is the LB pair account
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK: Bin array lower
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,

    /// CHECK: Bin array upper
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,

    /// CHECK: Reserve account for token X
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,

    /// CHECK: Reserve account for token Y
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,

    /// CHECK: The strategy vault for token X
    pub token_x_mint: UncheckedAccount<'info>,

    /// CHECK: The strategy vault for token Y
    pub token_y_mint: UncheckedAccount<'info>,

    /// The lb_clmm program
    /// CHECK: The lb_clmm program
    #[account(address = dlmm_interface::ID)]
    pub lb_clmm_program: UncheckedAccount<'info>,

    /// CHECK: Event authority for lb_clmm
    pub event_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn claim_fee_handler(ctx: Context<ClaimFee>) -> Result<()> {
    // TODO: Validation Lb Pair and Strategy token accounts

    let strategy_signer = ctx.accounts.strategy.get_pda_signer();
    let strategy_signer_seeds = &[&strategy_signer[..]];

    let accounts = ClaimFeeAccounts {
        lb_pair: &ctx.accounts.lb_pair.to_account_info(),
        position: &ctx.accounts.position.to_account_info(),
        bin_array_lower: &ctx.accounts.bin_array_lower.to_account_info(),
        bin_array_upper: &ctx.accounts.bin_array_upper.to_account_info(),
        sender: &ctx.accounts.strategy.to_account_info(),
        reserve_x: &ctx.accounts.reserve_x.to_account_info(),
        reserve_y: &ctx.accounts.reserve_y.to_account_info(),
        user_token_x: &ctx.accounts.strategy_vault_x.to_account_info(),
        user_token_y: &ctx.accounts.strategy_vault_y.to_account_info(),
        token_x_mint: &ctx.accounts.token_x_mint.to_account_info(),
        token_y_mint: &ctx.accounts.token_y_mint.to_account_info(),
        token_program: &ctx.accounts.token_program.to_account_info(),
        event_authority: &ctx.accounts.event_authority.to_account_info(),
        program: &ctx.accounts.lb_clmm_program.to_account_info(),
    };

    claim_fee_invoke_signed(accounts, strategy_signer_seeds)?;

    Ok(())
}
