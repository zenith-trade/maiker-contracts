use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::extension::transfer_fee::TransferFeeConfig;
use anchor_spl::token_2022::spl_token_2022::extension::{
    BaseStateWithExtensions, StateWithExtensions,
};
use anchor_spl::token_2022::spl_token_2022::state::Mint as MintInner;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{MaikerError, StrategyConfig};

pub fn send_from_program_vault<'info>(
    token_program: &Interface<'info, TokenInterface>,
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    strategy: &Account<'info, StrategyConfig>,
    amount: u64,
    mint: &InterfaceAccount<'info, Mint>,
) -> Result<()> {
    let signature_seeds = strategy.get_pda_signer();
    let signers = &[&signature_seeds[..]];

    let mint_account_info = mint.to_account_info();

    validate_mint_fee(&mint_account_info)?;

    let cpi_accounts = TransferChecked {
        from: from.to_account_info(),
        mint: mint_account_info,
        to: to.to_account_info(),
        authority: strategy.to_account_info(),
    };

    let cpi_program = token_program.to_account_info();
    let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
    token_interface::transfer_checked(cpi_context, amount, mint.decimals)
}

pub fn receive<'info>(
    token_program: &Interface<'info, TokenInterface>,
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    strategy: &Account<'info, StrategyConfig>,
    amount: u64,
    mint: &InterfaceAccount<'info, Mint>,
) -> Result<()> {
    let mint_account_info = mint.to_account_info();

    validate_mint_fee(&mint_account_info)?;

    let cpi_accounts = TransferChecked {
        from: from.to_account_info(),
        to: to.to_account_info(),
        mint: mint_account_info,
        authority: strategy.to_account_info(),
    };
    let cpi_program = token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token_interface::transfer_checked(cpi_context, amount, mint.decimals)
}

pub fn validate_mint_fee(account_info: &AccountInfo) -> Result<()> {
    let mint_data = account_info.try_borrow_data()?;
    let mint_with_extension = StateWithExtensions::<MintInner>::unpack(&mint_data)?;
    if let Ok(fee_config) = mint_with_extension.get_extension::<TransferFeeConfig>() {
        let fee = u16::from(
            fee_config
                .get_epoch_fee(Clock::get()?.epoch)
                .transfer_fee_basis_points,
        );
        require!(fee == 0, MaikerError::NonZeroTransferFee)
    }

    Ok(())
}
