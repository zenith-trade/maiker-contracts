use crate::{state::*, InitiateWithdrawEvent, MaikerError, ANCHOR_DISCRIMINATOR};
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
pub struct InitiateWithdrawal<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub strategy: Box<Account<'info, StrategyConfig>>,

    #[account(
        seeds = [GlobalConfig::SEED_PREFIX.as_bytes()],
        bump = global_config.bump,
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        mut,
        seeds = [UserPosition::SEED_PREFIX.as_bytes(), user.key().as_ref(), strategy.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.user == user.key(),
        constraint = user_position.strategy == strategy.key(),
    )]
    pub user_position: Box<Account<'info, UserPosition>>,

    #[account(
        init,
        payer = user,
        space = ANCHOR_DISCRIMINATOR + PendingWithdrawal::INIT_SPACE,
        seeds = [PendingWithdrawal::SEED_PREFIX.as_bytes(), user.key().as_ref(), strategy.key().as_ref()],
        bump
    )]
    pub pending_withdrawal: Box<Account<'info, PendingWithdrawal>>,

    #[account(
        mut,
        constraint = strategy_vault_x.key() == strategy.x_vault
    )]
    pub strategy_vault_x: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
}

pub fn initiate_withdrawal_handler(
    ctx: Context<InitiateWithdrawal>,
    shares_amount: u64,
) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let user_position = &mut ctx.accounts.user_position;
    let global_config = &ctx.accounts.global_config;
    let pending_withdrawal = &mut ctx.accounts.pending_withdrawal;
    let clock = Clock::get()?;
    let slot = clock.slot;
    let current_timestamp = clock.unix_timestamp;

    // Validate that all positions have up-to-date values
    strategy.validate_position_values_freshness(clock.slot)?;

    // Validate withdrawal amount
    require!(
        shares_amount > 0 && shares_amount <= user_position.strategy_share,
        MaikerError::InvalidWithdrawalAmount
    );

    // Calculate total strategy value and current share value
    let total_strategy_value =
        strategy.calculate_total_strategy_value(ctx.accounts.strategy_vault_x.amount)?;

    let current_share_value = strategy.calculate_share_value(total_strategy_value)?;

    // Calculate fees to withdraw
    let performance_fee_shares = user_position
        .calculate_performance_fee_shares(current_share_value, global_config.performance_fee_bps)?;

    // Calculate withdrawal fee as bps on the withdrawed shares
    let withdrawal_fee_shares = user_position
        .calculate_withdrawal_fee_shares(shares_amount, global_config.withdrawal_fee_bps)?;

    let effective_shares_to_withdraw = shares_amount
        .checked_sub(withdrawal_fee_shares)
        .ok_or(MaikerError::ArithmeticOverflow)?
        .checked_sub(performance_fee_shares)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    // Calculate token amount to return to user
    let token_amount =
        strategy.calculate_withdrawal_amount(effective_shares_to_withdraw, current_share_value)?;

    // Calculate the next withdrawal window
    let available_timestamp = global_config.calculate_withdrawal_timestamp(current_timestamp)?;

    // Initialize the pending withdrawal
    pending_withdrawal.initialize(
        ctx.accounts.user.key(),
        strategy.key(),
        effective_shares_to_withdraw,
        token_amount,
        current_timestamp,
        available_timestamp,
        *ctx.bumps.get("pending_withdrawal").unwrap(),
    );

    // 1. Reduce user position shares by shares_amount from input
    user_position.update_after_withdrawal(shares_amount, current_share_value, slot)?;
    // 2. Add performance fee shares to strategy fee shares to strategy config
    let total_fee_shares = performance_fee_shares
        .checked_add(withdrawal_fee_shares)
        .ok_or(MaikerError::ArithmeticOverflow)?;
    strategy.add_fee_shares(total_fee_shares)?;
    // 3. Reduce total strategy shares by effective_shares_to_withdraw
    strategy.burn_shares(effective_shares_to_withdraw)?;

    // Emit event for withdrawal initiation
    emit!(InitiateWithdrawEvent {
        user: ctx.accounts.user.key(),
        strategy: strategy.key(),
        shares_amount,
        current_share_value,
        token_amount,
        withdrawal_fee_shares,
        performance_fee_shares,
        initiation_timestamp: current_timestamp,
        available_timestamp,
    });

    Ok(())
}
