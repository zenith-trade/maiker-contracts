use crate::{state::*, MaikerError};
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

    #[account(
        mut,
        constraint = treasury_x.mint == strategy.x_mint,
        constraint = treasury_x.owner == global_config.treasury
    )]
    pub treasury_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury_y.mint == strategy.y_mint,
        constraint = treasury_y.owner == global_config.treasury
    )]
    pub treasury_y: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn claim_fees_handler(ctx: Context<ClaimFees>, shares_to_claim: Option<u64>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let clock = Clock::get()?;

    // Check if there are any pending fees
    require!(
        strategy.fee_shares_pending > 0,
        MaikerError::NoFeesToWithdraw
    );

    // Determine how many shares to withdraw
    let shares_to_claim = shares_to_claim.unwrap_or(strategy.fee_shares_pending);

    // Ensure we're not trying to withdraw more than available
    require!(
        shares_to_claim <= strategy.fee_shares_pending,
        MaikerError::InvalidWithdrawalAmount
    );

    // Calculate token amounts based on fee shares
    let fee_token_x = shares_to_claim
        .checked_mul(ctx.accounts.strategy_vault_x.amount)
        .ok_or(MaikerError::ArithmeticOverflow)?
        .checked_div(strategy.strategy_shares)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    let fee_token_y = shares_to_claim
        .checked_mul(ctx.accounts.strategy_vault_y.amount)
        .ok_or(MaikerError::ArithmeticOverflow)?
        .checked_div(strategy.strategy_shares)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    // Transfer tokens to treasury
    if fee_token_x > 0 {
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
            fee_token_x,
        )?;
    }

    if fee_token_y > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.strategy_vault_y.to_account_info(),
                    to: ctx.accounts.treasury_y.to_account_info(),
                    authority: strategy.to_account_info(),
                },
                &[&strategy.get_pda_signer()],
            ),
            fee_token_y,
        )?;
    }

    // Update strategy shares and pending fee shares
    strategy.strategy_shares = strategy
        .strategy_shares
        .checked_sub(shares_to_claim)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    strategy.fee_shares_pending = strategy
        .fee_shares_pending
        .checked_sub(shares_to_claim)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    // Emit event
    emit!(FeesClaimed {
        strategy: strategy.key(),
        fee_shares: shares_to_claim,
        fee_token_x,
        fee_token_y,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct FeesClaimed {
    pub strategy: Pubkey,
    pub fee_shares: u64,
    pub fee_token_x: u64,
    pub fee_token_y: u64,
    pub timestamp: i64,
}
