use crate::{error::MaikerError, state::*, UserDepositEvent, UserDeposited, ANCHOR_DISCRIMINATOR};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub strategy: Box<Account<'info, StrategyConfig>>,

    #[account(
        seeds = [GlobalConfig::SEED_PREFIX.as_bytes()],
        bump = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        init_if_needed,
        payer = user,
        space = ANCHOR_DISCRIMINATOR + UserPosition::INIT_SPACE,
        seeds = [UserPosition::SEED_PREFIX.as_bytes(), user.key().as_ref(), strategy.key().as_ref()],
        bump
    )]
    pub user_position: Box<Account<'info, UserPosition>>,

    #[account(
        mut,
        constraint = user_token_x.mint == strategy.x_mint,
        constraint = user_token_x.owner == user.key()
    )]
    pub user_token_x: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = strategy_vault_x.key() == strategy.x_vault
    )]
    pub strategy_vault_x: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let user_position = &mut ctx.accounts.user_position;
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;

    // Validate that all positions have up-to-date values
    strategy.validate_position_values_freshness(current_timestamp)?;

    // Ensure token amount is greater than zero
    require!(amount > 0, MaikerError::InvalidDepositAmount);

    // Calculate shares to mint
    let new_shares: u64;
    let current_share_value: u64;
    let mut performance_fee_shares: u64 = 0;

    if strategy.strategy_shares == 0 {
        // Initial deposit case - set initial share price to 1:1
        new_shares = amount;
        current_share_value = 1_000_000; // 1:1
    } else {
        // Get the total value of the strategy before this deposit
        let vault_balance = ctx.accounts.strategy_vault_x.amount;

        // Calculate total strategy value including positions
        let total_strategy_value = strategy.calculate_total_strategy_value(vault_balance)?;

        // Calculate the current share value
        current_share_value = strategy.calculate_share_value(total_strategy_value)?;

        // For existing users, check if performance fee is due
        if user_position.user != Pubkey::default() {
            // Calculate performance fee if share value has increased
            performance_fee_shares = user_position.calculate_performance_fee(
                current_share_value,
                ctx.accounts.global_config.performance_fee_bps,
            )?;

            // Add fee shares to pending fees
            if performance_fee_shares > 0 {
                strategy.fee_shares_pending = strategy
                    .fee_shares_pending
                    .checked_add(performance_fee_shares)
                    .ok_or(MaikerError::ArithmeticOverflow)?;
            }
        }

        // Calculate new shares based on deposit value and current share value
        new_shares = strategy.calculate_shares_for_deposit(amount, current_share_value)?;
    }

    // Update user position
    if user_position.user == Pubkey::default() {
        // Initialize new position
        user_position.initialize_user(
            ctx.accounts.user.key(),
            strategy.key(),
            new_shares,
            current_timestamp,
            *ctx.bumps.get("user_position").unwrap(),
        );
    } else {
        // Calculate current share value for existing position
        let total_strategy_value =
            strategy.calculate_total_strategy_value(ctx.accounts.strategy_vault_x.amount)?;

        let new_share_value = strategy.calculate_share_value(total_strategy_value)?;

        // Update existing position
        user_position.update_after_deposit(
            new_shares,
            performance_fee_shares,
            new_share_value,
            current_timestamp,
        )?;
    }

    // Update strategy shares
    strategy.strategy_shares = strategy
        .strategy_shares
        .checked_add(new_shares)
        .ok_or(MaikerError::ArithmeticOverflow)?;

    // Transfer tokens from user to strategy vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_x.to_account_info(),
                to: ctx.accounts.strategy_vault_x.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // Emit event
    emit!(UserDepositEvent {
        user: ctx.accounts.user.key(),
        strategy: strategy.key(),
        shares_amount: new_shares,
        token_amount: amount,
        current_share_value,
        performance_fee_shares: performance_fee_shares,
        timestamp: current_timestamp,
    });

    Ok(())
}
