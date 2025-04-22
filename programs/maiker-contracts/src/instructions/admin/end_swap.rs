use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::error::MaikerError;
use crate::events::SwapSummary;
use crate::state::StrategyConfig;

#[derive(Accounts)]
pub struct FlashSwapEnd<'info> {
    #[account(
        mut,
        constraint = authority.key() == global_config.admin
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
        associated_token::mint = strategy_config.x_mint,
        associated_token::authority = strategy_config // Strategy PDA is the authority
    )]
    pub vault_x: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = strategy_config.y_mint,
        associated_token::authority = strategy_config
    )]
    pub vault_y: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn end_swap_handler<'c: 'info, 'info>(
    context: Context<'_, '_, 'c, 'info, EndSwapAccountConstraints<'info>>,
    x_to_y: bool,
) -> Result<()> {
    let strategy_config = &mut context.accounts.strategy_config;
    let vault_x = &mut context.accounts.vault_x;
    let vault_y = &mut context.accounts.vault_y;
    let admin_key = context.accounts.admin.key();

    // 1. End the swap process in the strategy config and get amounts
    let (amount_in, amount_out) = strategy_config.end_swap(x_to_y, vault_x, vault_y)?;

    // 2. Transfer the received tokens (amount_out) from the admin's account back to the appropriate vault.
    // This assumes the external swap (e.g., Jupiter) deposited the output tokens
    // into the admin's ATA for the *output* token.
    let source_account_info; // Admin's ATA holding the output tokens
    let destination_vault; // Strategy's vault for the output token
    let output_mint;

    // This logic requires the admin's ATA for the *output* token to be passed in remaining_accounts.
    if x_to_y {
        // Swapped X for Y. Output is Y. Transfer Y from admin's ATA to vault_y.
        destination_vault = vault_y.to_account_info();
        output_mint = strategy_config.y_mint;
        // This is unsafe - requires admin to have the ATA for Y. Better to pass explicitly.
        let admin_ata_y =
            anchor_spl::associated_token::get_associated_token_address(&admin_key, &output_mint);
        source_account_info = context
            .remaining_accounts
            .iter()
            .find(|acc| acc.key() == admin_ata_y)
            .ok_or_else(|| error!(MaikerError::NotAuthorized))?; // Or a better error
    } else {
        // Swapped Y for X. Output is X. Transfer X from admin's ATA to vault_x.
        destination_vault = vault_x.to_account_info();
        output_mint = strategy_config.x_mint;
        // This is unsafe - requires admin to have the ATA for X. Better to pass explicitly.
        let admin_ata_x =
            anchor_spl::associated_token::get_associated_token_address(&admin_key, &output_mint);
        source_account_info = context
            .remaining_accounts
            .iter()
            .find(|acc| acc.key() == admin_ata_x)
            .ok_or_else(|| error!(MaikerError::NotAuthorized))?; // Or a better error
    }

    // We need to ensure the source account (admin's ATA) actually has enough tokens.
    // Reloading the account info might be necessary if the Jupiter CPI didn't update it in the same transaction context.
    // source_account_info.reload()?; // Consider uncommenting if needed
    // let source_token_account = Account::<TokenAccount>::try_from(source_account_info)?;
    // require!(source_token_account.amount >= amount_out, MaikerError::InvalidSwapState);

    let transfer_accounts = Transfer {
        from: source_account_info.clone(),
        to: destination_vault.clone(),
        authority: context.accounts.admin.to_account_info(), // Admin signs this transfer
    };

    let cpi_context = CpiContext::new(
        context.accounts.token_program.to_account_info(),
        transfer_accounts,
    );

    token::transfer(cpi_context, amount_out)?;

    // Emit an event summarizing the swap
    emit!(SwapSummary {
        strategy_config: strategy_config.key(),
        admin: admin_key,
        token_in_mint: if x_to_y {
            strategy_config.x_mint
        } else {
            strategy_config.y_mint
        },
        token_out_mint: if x_to_y {
            strategy_config.y_mint
        } else {
            strategy_config.x_mint
        },
        amount_in,
        amount_out
    });

    msg!("EndSwap: Received {} tokens, completing swap.", amount_out);

    Ok(())
}
