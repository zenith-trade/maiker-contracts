use crate::{
    controllers::token as token_controller,
    state::*, InitiateWithdrawEvent, MaikerError, ANCHOR_DISCRIMINATOR,
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

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

    // M-token mint for the strategy
    #[account(
        mut,
        address = strategy.m_token_mint,
        mint::decimals = StrategyConfig::M_TOKEN_DECIMALS,
        mint::authority = strategy,
    )]
    pub m_token_mint: Account<'info, Mint>,

    // Strategy's associated token account for the m-token (for fee accumulation)
    #[account(
        mut,
        associated_token::mint = m_token_mint,
        associated_token::authority = strategy,
    )]
    pub strategy_m_token_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn initiate_withdrawal_handler(
    ctx: Context<InitiateWithdrawal>,
    shares_amount: u64,
) -> Result<()> {
    let user_position = &mut ctx.accounts.user_position;
    let global_config = &ctx.accounts.global_config;
    let pending_withdrawal = &mut ctx.accounts.pending_withdrawal;
    let clock = Clock::get()?;
    let slot = clock.slot;
    let current_timestamp = clock.unix_timestamp;

    // Validate that all positions have up-to-date values
    ctx.accounts.strategy.validate_position_values_freshness(clock.slot)?;

    // Validate withdrawal amount
    require!(
        shares_amount > 0 && shares_amount <= user_position.strategy_share,
        MaikerError::InvalidWithdrawalAmount
    );

    // Calculate total strategy value and current share value
    let total_strategy_value =
        ctx.accounts.strategy.calculate_total_strategy_value(ctx.accounts.strategy_vault_x.amount)?;

    let current_share_value = ctx.accounts.strategy.calculate_share_value(total_strategy_value)?;

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
        ctx.accounts.strategy.calculate_withdrawal_amount(effective_shares_to_withdraw, current_share_value)?;

    // Calculate the next withdrawal window
    let available_timestamp = global_config.calculate_withdrawal_timestamp(current_timestamp)?;

    // Initialize the pending withdrawal
    pending_withdrawal.initialize(
        ctx.accounts.user.key(),
        ctx.accounts.strategy.key(),
        effective_shares_to_withdraw,
        shares_amount,
        token_amount,
        current_timestamp,
        available_timestamp,
        ctx.bumps.pending_withdrawal,
    );

    // 1. Reduce user position shares by shares_amount from input
    user_position.update_after_withdrawal(shares_amount, current_share_value, slot)?;

    // 2. Add performance fee shares to strategy fee shares to strategy config
    let total_fee_shares = performance_fee_shares
        .checked_add(withdrawal_fee_shares)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    // Mint m-tokens to strategy for fee shares
    if total_fee_shares > 0 {
        token_controller::mint_to(
            &ctx.accounts.token_program,
            &ctx.accounts.m_token_mint,
            &ctx.accounts.strategy_m_token_ata,
            &ctx.accounts.strategy,
            total_fee_shares,
        )?;
    }

    // Add fee shares to strategy
    let strategy = &mut ctx.accounts.strategy;
    strategy.add_fee_shares(total_fee_shares)?;

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
