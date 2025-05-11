use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions;
use anchor_lang::Discriminator;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::error::MaikerError;
use crate::state::StrategyConfig;
use crate::{controllers, jupiter_mainnet_6, lighthouse, validate, GlobalConfig};

#[derive(Accounts)]
#[instruction(x_to_y: bool, amount_in: u64)]
pub struct FlashSwap<'info> {
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

    #[account(mut,
        associated_token::mint = in_mint,
        associated_token::authority = strategy
    )]
    pub in_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut,
        associated_token::mint = out_mint,
        associated_token::authority = strategy
    )]
    pub out_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut,
        associated_token::mint = in_mint,
        associated_token::authority = authority
    )]
    pub in_admin_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut,
        associated_token::mint = out_mint,
        associated_token::authority = authority
    )]
    pub out_admin_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        constraint = if x_to_y { in_mint.key() == strategy.x_mint } else { in_mint.key() == strategy.y_mint }
    )]
    pub in_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        constraint = if x_to_y { out_mint.key() == strategy.y_mint } else { out_mint.key() == strategy.x_mint }
    )]
    pub out_mint: Box<InterfaceAccount<'info, Mint>>,

    pub token_program: Interface<'info, TokenInterface>,

    /// CHECK: Instructions sysvar for validation
    #[account(address = instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
}

pub fn begin_swap_handler(ctx: Context<FlashSwap>, _x_to_y: bool, amount_in: u64) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let in_vault = &ctx.accounts.in_vault;
    let in_admin_ata = &ctx.accounts.in_admin_ata;
    let out_admin_ata = &ctx.accounts.out_admin_ata;

    let in_mint = &ctx.accounts.in_mint;
    let out_mint = &ctx.accounts.out_mint;

    let initial_in_amount_admin = in_admin_ata.amount;
    let initial_out_amount_admin = out_admin_ata.amount;

    // 1. Begin the swap process in the strategy config
    strategy.begin_swap(
        amount_in,
        in_mint.key(),
        out_mint.key(),
        initial_in_amount_admin,
        initial_out_amount_admin,
    )?;

    // 2. Transfer tokens from the appropriate vault to the admin
    controllers::token::send_from_program_vault(
        &ctx.accounts.token_program,
        in_vault,
        in_admin_ata,
        strategy,
        amount_in,
        in_mint,
    )?;

    // 3. Assert
    let ixs = ctx.accounts.instructions_sysvar.as_ref();
    let current_index = instructions::load_current_index_checked(ixs)? as usize;

    let current_ix = instructions::load_instruction_at_checked(current_index, ixs)?;
    validate!(
        current_ix.program_id == *ctx.program_id,
        MaikerError::InvalidSwap,
        "Invalid program id"
    )?;

    // The only other maiker program ix allowed is SwapEnd
    let mut index = current_index + 1;
    let mut found_end = false;
    loop {
        let ix = match instructions::load_instruction_at_checked(index, ixs) {
            Ok(ix) => ix,
            Err(ProgramError::InvalidArgument) => break,
            Err(e) => return Err(e.into()),
        };

        // Check that the maiker program key is not used
        if ix.program_id == crate::id() {
            // must be the last ix -- this could possibly be relaxed
            validate!(
                !found_end,
                MaikerError::InvalidSwap,
                "End Swap must be the last ix"
            )?;
            found_end = true;

            // must be the SwapEnd instruction
            let discriminator = crate::instruction::EndSwap::discriminator();
            validate!(
                ix.data[0..8] == discriminator,
                MaikerError::InvalidSwap,
                "Invalid discriminator"
            )?;

            // Assert accounts are equal
            validate!(
                ctx.accounts.authority.key() == ix.accounts[0].pubkey,
                MaikerError::InvalidSwap,
                "Invalid authority"
            )?;

            validate!(
                ctx.accounts.global_config.key() == ix.accounts[1].pubkey,
                MaikerError::InvalidSwap,
                "Invalid global config"
            )?;

            validate!(
                ctx.accounts.strategy.key() == ix.accounts[2].pubkey,
                MaikerError::InvalidSwap,
                "Invalid strategy"
            )?;

            validate!(
                ctx.accounts.in_vault.key() == ix.accounts[3].pubkey,
                MaikerError::InvalidSwap,
                "Invalid vault x"
            )?;

            validate!(
                ctx.accounts.out_vault.key() == ix.accounts[4].pubkey,
                MaikerError::InvalidSwap,
                "Invalid vault y"
            )?;

            validate!(
                ctx.accounts.in_admin_ata.key() == ix.accounts[5].pubkey,
                MaikerError::InvalidSwap,
                "Invalid vault x admin"
            )?;

            validate!(
                ctx.accounts.out_admin_ata.key() == ix.accounts[6].pubkey,
                MaikerError::InvalidSwap,
                "Invalid vault y admin"
            )?;

            validate!(
                ctx.accounts.in_mint.key() == ix.accounts[7].pubkey,
                MaikerError::InvalidSwap,
                "Invalid in mint"
            )?;

            validate!(
                ctx.accounts.token_program.key() == ix.accounts[8].pubkey,
                MaikerError::InvalidSwap,
                "Invalid token program"
            )?;

            validate!(
                ctx.accounts.instructions_sysvar.key() == ix.accounts[9].pubkey,
                MaikerError::InvalidSwap,
                "Invalid instructions sysvar"
            )?;
        } else {
            if found_end {
                if ix.program_id == lighthouse::id() {
                    continue;
                }

                for meta in ix.accounts.iter() {
                    validate!(
                        meta.is_writable == false,
                        MaikerError::InvalidSwap,
                        "instructions after swap end must not have writable accounts"
                    )?;
                }
            } else {
                let whitelisted_programs = vec![AssociatedToken::id(), jupiter_mainnet_6::id()];
                // if !delegate_is_signer {
                //     whitelisted_programs.push(Token::id());
                //     whitelisted_programs.push(Token2022::id());
                //     whitelisted_programs.push(marinade_mainnet::ID);
                // }
                validate!(
                    whitelisted_programs.contains(&ix.program_id),
                    MaikerError::InvalidSwap,
                    "only allowed to pass in ixs to token, and jupiter programs"
                )?;

                for meta in ix.accounts.iter() {
                    validate!(
                        meta.pubkey != crate::id(),
                        MaikerError::InvalidSwap,
                        "instructions between begin and end must not be drift instructions"
                    )?;
                }
            }
        }

        index += 1;
    }

    validate!(
        found_end,
        MaikerError::InvalidSwap,
        "found no SwapEnd instruction in transaction"
    )?;

    msg!("BeginSwap: Transferred {} tokens for swap.", amount_in);

    Ok(())
}

pub fn end_swap_handler(ctx: Context<FlashSwap>, _x_to_y: bool) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let in_vault = &mut ctx.accounts.in_vault;
    let out_vault = &mut ctx.accounts.out_vault;
    let in_admin_ata = &mut ctx.accounts.in_admin_ata;
    let out_admin_ata = &mut ctx.accounts.out_admin_ata;

    let in_mint = &ctx.accounts.in_mint;
    let out_mint = &ctx.accounts.out_mint;

    // Check for residual tokens and transfer back to strategy vault
    let mut amount_in = strategy.swap_amount_in;
    if in_admin_ata.amount > strategy.swap_initial_in_amount_admin {
        let residual = in_admin_ata
            .amount
            .checked_sub(strategy.swap_initial_in_amount_admin)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        controllers::token::receive(
            &ctx.accounts.token_program,
            in_admin_ata,
            in_vault,
            strategy,
            residual,
            &in_mint,
        )?;
        in_admin_ata.reload()?;
        in_vault.reload()?;

        amount_in = amount_in
            .checked_sub(residual)
            .ok_or(MaikerError::ArithmeticOverflow)?;
    }

    // Check the out amount and transfer back to strategy vault
    let mut amount_out = 0_u64;
    if out_admin_ata.amount > strategy.swap_initial_out_amount_admin {
        amount_out = out_admin_ata
            .amount
            .checked_sub(strategy.swap_initial_out_amount_admin)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        controllers::token::receive(
            &ctx.accounts.token_program,
            out_admin_ata,
            out_vault,
            strategy,
            amount_out,
            &out_mint,
        )?;
        out_admin_ata.reload()?;
        out_vault.reload()?;
    }

    strategy.end_swap(amount_in, in_mint.key(), out_mint.key())?;

    msg!(
        "EndSwap: Completed swap. In: {} Out: {}",
        amount_in,
        amount_out,
    );

    Ok(())
}
