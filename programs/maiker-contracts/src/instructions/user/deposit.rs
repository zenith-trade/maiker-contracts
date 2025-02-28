use crate::{error::MaikerError, state::*, UserDeposited, ANCHOR_DISCRIMINATOR};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub strategy: Account<'info, StrategyConfig>,

    #[account(
        init_if_needed,
        payer = user,
        space = ANCHOR_DISCRIMINATOR + UserPosition::INIT_SPACE,
        seeds = [b"user_position", user.key().as_ref(), strategy.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(
        mut,
        constraint = user_token_x.mint == strategy.x_mint,
        constraint = user_token_x.owner == user.key()
    )]
    pub user_token_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_y.mint == strategy.y_mint,
        constraint = user_token_y.owner == user.key()
    )]
    pub user_token_y: Account<'info, TokenAccount>,

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

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_handler(ctx: Context<Deposit>, amount_x: u64, amount_y: u64) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let user_position = &mut ctx.accounts.user_position;
    let clock = Clock::get()?;

    // Transfer tokens from user to strategy vaults
    if amount_x > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_x.to_account_info(),
                    to: ctx.accounts.strategy_vault_x.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_x,
        )?;
    }

    if amount_y > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_y.to_account_info(),
                    to: ctx.accounts.strategy_vault_y.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_y,
        )?;
    }

    // Calculate shares to mint
    let total_x_y = ctx
        .accounts
        .strategy_vault_x
        .amount
        .checked_add(ctx.accounts.strategy_vault_y.amount)
        .ok_or(MaikerError::ArithmeticOverflow)?;
    let amount_x_y = amount_x
        .checked_add(amount_y)
        .ok_or(MaikerError::ArithmeticOverflow)?;
    let total_value_before = total_x_y
        .checked_sub(amount_x_y)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    let current_value_per_share = if strategy.strategy_shares == 0 {
        // Initial deposit case
        1_000_000 // Fixed-point representation of 1.0
    } else {
        total_value_before
            .checked_mul(1_000_000)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_div(strategy.strategy_shares)
            .ok_or(MaikerError::ArithmeticOverflow)?
    };

    // Calculate new shares (simplified; might need price-aware calculation)
    let deposit_value = amount_x
        .checked_add(amount_y)
        .ok_or(MaikerError::ArithmeticOverflow)?;
    let new_shares = deposit_value
        .checked_mul(1_000_000)
        .ok_or(MaikerError::ArithmeticOverflow)?
        .checked_div(current_value_per_share)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    // Update user position
    if user_position.user == Pubkey::default() {
        // New position
        user_position.user = ctx.accounts.user.key();
        user_position.strategy = strategy.key();
        user_position.strategy_share = new_shares;
        user_position.last_update_timestamp = clock.unix_timestamp;
        user_position.bump = *ctx.bumps.get("user_position").unwrap();
    } else {
        // Existing position
        user_position.strategy_share = user_position
            .strategy_share
            .checked_add(new_shares)
            .ok_or(MaikerError::ArithmeticOverflow)?;
        user_position.last_update_timestamp = clock.unix_timestamp;
    }

    // Update strategy
    strategy.strategy_shares = strategy
        .strategy_shares
        .checked_add(new_shares)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    // Emit event
    emit!(UserDeposited {
        user: ctx.accounts.user.key(),
        strategy: strategy.key(),
        shares_amount: new_shares,
        token_x_amount: amount_x,
        token_y_amount: amount_y,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
