use crate::{state::*, MaikerError};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub strategy: Account<'info, StrategyConfig>,

    #[account(
        mut,
        seeds = [b"user_position", user.key().as_ref(), strategy.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.user == user.key(),
        constraint = user_position.strategy == strategy.key(),
        close = user
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

    #[account(
        seeds = [b"global_config"],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

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
    pub system_program: Program<'info, System>,
}

pub fn withdraw_handler(ctx: Context<Withdraw>, shares_amount: u64) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let user_position = &mut ctx.accounts.user_position;
    let global_config = &ctx.accounts.global_config;
    let clock = Clock::get()?;

    // Validate withdrawal amount
    require!(
        shares_amount > 0 && shares_amount <= user_position.strategy_share,
        MaikerError::InvalidWithdrawalAmount
    );

    // Collect any pending performance fees first
    // This would be implemented in a separate function
    // collect_performance_fees(strategy, performance_metrics, global_config)?;

    // Calculate user's share value
    let total_value = ctx.accounts.strategy_vault_x.amount + ctx.accounts.strategy_vault_y.amount;

    // Calculate token amounts to return to user
    let user_token_x_amount =
        shares_amount * ctx.accounts.strategy_vault_x.amount / strategy.strategy_shares;
    let user_token_y_amount =
        shares_amount * ctx.accounts.strategy_vault_y.amount / strategy.strategy_shares;

    // Apply withdrawal fee if configured
    let mut withdrawal_fee_x = 0;
    let mut withdrawal_fee_y = 0;

    if global_config.withdrawal_fee_bps > 0 {
        withdrawal_fee_x = user_token_x_amount * global_config.withdrawal_fee_bps as u64 / 10_000;
        withdrawal_fee_y = user_token_y_amount * global_config.withdrawal_fee_bps as u64 / 10_000;

        // Transfer withdrawal fees to treasury
        if withdrawal_fee_x > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.strategy_vault_x.to_account_info(),
                        to: ctx.accounts.treasury_x.to_account_info(),
                        authority: strategy.to_account_info(),
                    },
                ),
                withdrawal_fee_x,
            )?;
        }

        if withdrawal_fee_y > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.strategy_vault_y.to_account_info(),
                        to: ctx.accounts.treasury_y.to_account_info(),
                        authority: strategy.to_account_info(),
                    },
                ),
                withdrawal_fee_y,
            )?;
        }
    }

    // Calculate final token amounts after fees
    let final_token_x_amount = user_token_x_amount - withdrawal_fee_x;
    let final_token_y_amount = user_token_y_amount - withdrawal_fee_y;

    // Transfer tokens to user
    if final_token_x_amount > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.strategy_vault_x.to_account_info(),
                    to: ctx.accounts.user_token_x.to_account_info(),
                    authority: strategy.to_account_info(),
                },
            ),
            final_token_x_amount,
        )?;
    }

    if final_token_y_amount > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.strategy_vault_y.to_account_info(),
                    to: ctx.accounts.user_token_y.to_account_info(),
                    authority: strategy.to_account_info(),
                },
            ),
            final_token_y_amount,
        )?;
    }

    // Update user position and strategy
    user_position.strategy_share -= shares_amount;
    strategy.strategy_shares -= shares_amount;
    user_position.last_update_timestamp = clock.unix_timestamp;

    // Emit event
    emit!(UserWithdrew {
        user: ctx.accounts.user.key(),
        strategy: strategy.key(),
        shares_amount,
        token_x_amount: final_token_x_amount,
        token_y_amount: final_token_y_amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct UserWithdrew {
    pub user: Pubkey,
    pub strategy: Pubkey,
    pub shares_amount: u64,
    pub token_x_amount: u64,
    pub token_y_amount: u64,
    pub timestamp: i64,
}
