use crate::{state::*, MaikerError, ProcessWithdrawEvent};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, burn, Burn, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct ProcessWithdrawal<'info> {
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
        seeds = [PendingWithdrawal::SEED_PREFIX.as_bytes(), user.key().as_ref(), strategy.key().as_ref()],
        bump = pending_withdrawal.bump,
        constraint = pending_withdrawal.user == user.key(),
        constraint = pending_withdrawal.strategy == strategy.key(),
        close = user
    )]
    pub pending_withdrawal: Box<Account<'info, PendingWithdrawal>>,

    #[account(
        mut,
        token::mint = strategy.x_mint,
        token::authority = strategy.key(),
    )]
    pub strategy_vault_x: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = strategy.x_mint,
        token::authority = pending_withdrawal.user,
    )]
    pub user_token_x: Box<Account<'info, TokenAccount>>,

    // M-token mint for the strategy
    #[account(
        mut,
        address = strategy.m_token_mint,
        mint::decimals = StrategyConfig::M_TOKEN_DECIMALS,
        mint::authority = strategy,
    )]
    pub m_token_mint: Account<'info, Mint>,

    // User's associated token account for the m-token (LP token)
    #[account(
        mut,
        associated_token::mint = m_token_mint,
        associated_token::authority = user,
    )]
    pub user_m_token_ata: Account<'info, TokenAccount>,

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

        // Burn m-tokens from the user (must match shares withdrawn)
        burn(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.m_token_mint.to_account_info(),
                    from: ctx.accounts.user_m_token_ata.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
                signer,
            ),
            pending_withdrawal.shares_amount,
        )?;

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

    // Reduce total strategy shares by effective_shares_to_withdraw
    strategy.burn_shares(pending_withdrawal.shares_amount)?;

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
