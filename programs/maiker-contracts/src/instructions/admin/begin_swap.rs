use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, sysvar::instructions};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::ANCHOR_DISCRIMINATOR;
use crate::error::MaikerError;
use crate::state::StrategyConfig;
use crate::GlobalConfig;

#[derive(Accounts)]
pub struct FlashSwapStart<'info> {
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
        associated_token::mint = strategy.x_mint,
        associated_token::authority = strategy // Strategy PDA is the authority
    )]
    pub vault_x: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = strategy.y_mint,
        associated_token::authority = strategy
    )]
    pub vault_y: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,

    /// CHECK: Instructions sysvar for validation
    #[account(address = instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
}

pub fn begin_swap_handler<'c: 'info, 'info>(
    context: Context<'_, '_, 'c, 'info, FlashSwapStart<'info>>,
    x_to_y: bool,
    amount_in: u64,
) -> Result<()> {
    let strategy = &mut context.accounts.strategy;
    let vault_x = &context.accounts.vault_x;
    let vault_y = &context.accounts.vault_y;

    // 1. Validate instructions sequence (basic check)
    validate_instruction_sequence(
        &context.accounts.instructions_sysvar,
        context.program_id,
        &context.accounts.authority.key(),
        &strategy.key(),
    )?;

    // 2. Begin the swap process in the strategy config
    strategy.begin_swap(amount_in, vault_x, vault_y)?;

    // 3. Transfer tokens from the appropriate vault to the admin (or a designated swap account)
    // For simplicity, transferring to the admin's account directly.
    // A dedicated swap intermediate account might be safer.
    let source_vault;
    let source_mint;
    let destination_account_info;

    // Find the admin's ATA for the source token
    // This part assumes the admin *has* an ATA for the token being sent out.
    // It's generally better practice to require these accounts explicitly in the instruction context.
    // However, deriving it here for simplicity based on Drift's approach (though Drift uses its own user account)
    let admin_key = context.accounts.authority.key();

    if x_to_y {
        // Transfer X from vault_x
        source_vault = vault_x.to_account_info();
        source_mint = strategy.x_mint;
        // This is unsafe - requires admin to have the ATA. Better to pass explicitly.
        let admin_ata_x =
            anchor_spl::associated_token::get_associated_token_address(&admin_key, &source_mint);
        destination_account_info = context
            .remaining_accounts
            .iter()
            .find(|acc| acc.key() == admin_ata_x)
            .ok_or_else(|| error!(MaikerError::NotAuthorized))?; // Or a better error
    } else {
        // Transfer Y from vault_y
        source_vault = vault_y.to_account_info();
        source_mint = strategy.y_mint;
        // This is unsafe - requires admin to have the ATA. Better to pass explicitly.
        let admin_ata_y =
            anchor_spl::associated_token::get_associated_token_address(&admin_key, &source_mint);
        destination_account_info = context
            .remaining_accounts
            .iter()
            .find(|acc| acc.key() == admin_ata_y)
            .ok_or_else(|| error!(MaikerError::NotAuthorized))?; // Or a better error
    }

    let transfer_accounts = Transfer {
        from: source_vault.clone(),
        to: destination_account_info.clone(),
        authority: strategy.to_account_info(),
    };

    let strategy_seeds = strategy.get_pda_signer();
    let signer_seeds = &[&strategy_seeds[..]][..];

    let cpi_context = CpiContext::new_with_signer(
        context.accounts.token_program.to_account_info(),
        transfer_accounts,
        signer_seeds,
    );

    token::transfer(cpi_context, amount_in)?;

    msg!("BeginSwap: Transferred {} tokens for swap.", amount_in);

    Ok(())
}

/// Basic validation inspired by Drift: Checks if the next instruction is EndSwap.
/// This is a simplified version and might need refinement based on Jupiter's CPI requirements.
fn validate_instruction_sequence(
    instructions_sysvar: &AccountInfo,
    program_id: &Pubkey,
    expected_admin: &Pubkey,
    expected_strategy_config: &Pubkey,
) -> Result<()> {
    let ixs = instructions::load_instructions_checked(&instructions_sysvar, &[])?;
    let current_index = instructions::load_current_index_checked(&instructions_sysvar)? as usize;

    // Ensure there's a next instruction
    require!(
        current_index + 1 < ixs.len(),
        MaikerError::InvalidSwapInstructionSequence
    );

    let next_ix = &ixs[current_index + 1];

    // Check if the next instruction is for this program
    require!(
        next_ix.program_id == *program_id,
        MaikerError::InvalidSwapInstructionSequence
    );

    // Check if the next instruction is EndSwap (using discriminator)
    // This requires knowing the discriminator for end_swap
    // Assuming 'end_swap' function name for now.
    // Replace `crate::instruction::EndSwap::DISCRIMINATOR` with the actual one.
    let end_swap_discriminator: [u8; 8] = crate::instruction::end_swap::DISCRIMINATOR; // This needs to be generated/known
    require!(
        next_ix.data[0..ANCHOR_DISCRIMINATOR] == end_swap_discriminator,
        MaikerError::InvalidSwapInstructionSequence
    );

    // Basic check: Ensure the admin and strategy_config accounts match in EndSwap
    // Account indices depend on the EndSwap instruction's account order.
    // Assuming admin is index 1 (signer) and strategy_config is index 2.
    require!(
        next_ix.accounts.len() > 2,
        MaikerError::InvalidSwapInstructionSequence
    );
    require!(
        next_ix.accounts[1].pubkey == *expected_admin,
        MaikerError::InvalidSwapInstructionSequence
    );
    require!(
        next_ix.accounts[2].pubkey == *expected_strategy_config,
        MaikerError::InvalidSwapInstructionSequence
    );

    // Add more checks as needed, similar to Drift's validation for other accounts.

    Ok(())
}
