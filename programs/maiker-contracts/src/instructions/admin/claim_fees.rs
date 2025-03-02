use crate::{state::*, ClaimFeeSharesEvent, MaikerError};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct ClaimFees<'info> {
    #[account(
        constraint = authority.key() == global_config.admin @ MaikerError::NotAuthorized
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
        token::mint = strategy.x_mint,
        token::authority = strategy.key(),
    )]
    pub strategy_vault_x: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = strategy.x_mint,
        token::authority = global_config.treasury,
    )]
    pub treasury_x: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn claim_fees_handler(ctx: Context<ClaimFees>, shares_to_claim: Option<u64>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let clock = Clock::get()?;

    // Check if there are any pending fees
    require!(strategy.fee_shares > 0, MaikerError::NoFeesToWithdraw);

    // Determine how many shares to withdraw
    let shares_to_claim = shares_to_claim.unwrap_or(strategy.fee_shares);

    // Ensure we're not trying to withdraw more than available
    require!(
        shares_to_claim <= strategy.fee_shares,
        MaikerError::InvalidWithdrawalAmount
    );

    // Calculate total strategy value and current share value
    let total_strategy_value =
        strategy.calculate_total_strategy_value(ctx.accounts.strategy_vault_x.amount)?;

    let current_share_value = strategy.calculate_share_value(total_strategy_value)?;

    let token_amount =
        strategy.calculate_withdrawal_amount(shares_to_claim, current_share_value)?;

    // Transfer tokens to treasury
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.strategy_vault_x.to_account_info(),
                to: ctx.accounts.treasury_x.to_account_info(),
                authority: strategy.to_account_info(),
            },
            &[&strategy.get_pda_signer()],
        ),
        token_amount,
    )?;

    // Burn shares
    strategy.burn_shares(shares_to_claim)?;
    strategy.burn_fee_shares(shares_to_claim)?;

    // Emit event
    emit!(ClaimFeeSharesEvent {
        strategy: strategy.key(),
        fee_shares: shares_to_claim,
        token_amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
