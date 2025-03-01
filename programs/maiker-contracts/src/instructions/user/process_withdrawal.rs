use crate::{state::*, MaikerError, ProcessWithdrawEvent};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct ProcessWithdrawal<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub strategy: Account<'info, StrategyConfig>,

    #[account(
        seeds = [GlobalConfig::SEED_PREFIX.as_bytes()],
        bump = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [PendingWithdrawal::SEED_PREFIX.as_bytes(), user.key().as_ref(), strategy.key().as_ref()],
        bump = pending_withdrawal.bump,
        constraint = pending_withdrawal.user == user.key(),
        constraint = pending_withdrawal.strategy == strategy.key(),
        close = user
    )]
    pub pending_withdrawal: Account<'info, PendingWithdrawal>,

    #[account(
        mut,
        constraint = user_token_x.mint == strategy.x_mint,
        constraint = user_token_x.owner == user.key()
    )]
    pub user_token_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = strategy_vault_x.key() == strategy.x_vault
    )]
    pub strategy_vault_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury_x.mint == strategy.x_mint,
        constraint = treasury_x.owner == global_config.treasury
    )]
    pub treasury_x: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn process_withdrawal_handler(ctx: Context<ProcessWithdrawal>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let pending_withdrawal = &ctx.accounts.pending_withdrawal;
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;

    // Check if the withdrawal is ready to be claimed
    require!(
        pending_withdrawal.is_ready(current_timestamp),
        MaikerError::WithdrawalNotReady
    );

    // Get the token amount and fee from the pending withdrawal
    let token_amount = pending_withdrawal.token_amount;

    // Transfer tokens to user
    if token_amount > 0 {
        let strategy_signer_seeds = strategy.get_pda_signer();
        let signer = &[&strategy_signer_seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.strategy_vault_x.to_account_info(),
                    to: ctx.accounts.user_token_x.to_account_info(),
                    authority: strategy.to_account_info(),
                },
                signer,
            ),
            token_amount,
        )?;
    }

    // Update strategy shares
    strategy.strategy_shares = strategy
        .strategy_shares
        .checked_sub(pending_withdrawal.shares_amount)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    // Emit event
    emit!(ProcessWithdrawEvent {
        user: ctx.accounts.user.key(),
        strategy: strategy.key(),
        shares_amount: pending_withdrawal.shares_amount,
        token_amount: token_amount,
        timestamp: current_timestamp,
    });

    Ok(())
}
