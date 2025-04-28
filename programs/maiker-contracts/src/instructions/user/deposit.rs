use crate::{
    error::MaikerError, state::*, UserDepositEvent, ANCHOR_DISCRIMINATOR, SHARE_PRECISION,
};
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
    let slot = clock.slot;

    // Validate that all positions have up-to-date values
    strategy.validate_position_values_freshness(slot)?;

    // Ensure token amount is greater than zero
    require!(amount > 0, MaikerError::InvalidDepositAmount);

    // Calculate shares to mint
    let new_shares: u64;
    let current_share_value: u64;
    let mut performance_fee_shares: u64 = 0;

    // Calculate shares to mint and current share value
    if strategy.strategy_shares == 0 {
        // Initial deposit case - set initial share price to 1:1
        new_shares = amount;
        current_share_value = SHARE_PRECISION; // 1:1
    } else {
        // Get the total value of the strategy before this deposit
        let vault_x_balance = ctx.accounts.strategy_vault_x.amount;
        msg!("Vault balance: {}", vault_x_balance);

        // TODO: Make sure vault y balance is also accounted for
        // let vault_y_balance = ctx.accounts.strategy_vault_y.amount;
        // msg!("Vault balance: {}", vault_y_balance);

        // Calculate total strategy value including positions
        let total_strategy_value = strategy.calculate_total_strategy_value(vault_x_balance)?;
        msg!("Total strategy value: {}", total_strategy_value);

        // Calculate the current share value
        current_share_value = strategy.calculate_share_value(total_strategy_value)?;
        msg!("Current share value: {}", current_share_value);

        // Calculate new shares based on deposit value and current share value
        new_shares = strategy.calculate_shares_for_deposit(amount, current_share_value)?;
    }

    // Update strategy shares
    msg!("Minting shares: {}", new_shares);
    strategy.mint_shares(new_shares)?;

    if user_position.user == Pubkey::default() {
        // Initialize new position
        user_position.initialize_user(
            ctx.accounts.user.key(),
            strategy.key(),
            new_shares,
            slot,
            ctx.bumps.user_position,
        );
    } else {
        // Calculate performance fee if share value has increased
        performance_fee_shares = user_position.calculate_performance_fee_shares(
            current_share_value,
            ctx.accounts.global_config.performance_fee_bps,
        )?;
        msg!("Performance fee shares: {}", performance_fee_shares);

        // Add fee shares to pending fees
        if performance_fee_shares > 0 {
            strategy.add_fee_shares(performance_fee_shares)?;
        }

        // Update existing position
        user_position.update_after_deposit(
            new_shares,
            performance_fee_shares,
            current_share_value,
            slot,
        )?;
    }

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
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
