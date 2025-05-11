use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata as Metaplex},
    token::{Mint as TokenMint, Token, TokenAccount as TokenTokenAccount, MintTo, Burn},
    token_interface::{self, Mint as TokenInterfaceMint, TokenAccount as TokenInterfaceAccount, TokenInterface, TransferChecked},
};
use anchor_spl::metadata::mpl_token_metadata::types::DataV2;
use anchor_spl::token_2022::spl_token_2022::extension::transfer_fee::TransferFeeConfig;
use anchor_spl::token_2022::spl_token_2022::extension::{
    BaseStateWithExtensions, StateWithExtensions,
};
use anchor_spl::token_2022::spl_token_2022::state::Mint as MintInner;

use crate::{MaikerError, StrategyConfig};

pub fn send_from_program_vault<'info>(
    token_program: &Interface<'info, TokenInterface>,
    from: &InterfaceAccount<'info, TokenInterfaceAccount>,
    to: &InterfaceAccount<'info, TokenInterfaceAccount>,
    strategy: &Account<'info, StrategyConfig>,
    amount: u64,
    mint: &InterfaceAccount<'info, TokenInterfaceMint>,
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
    from: &InterfaceAccount<'info, TokenInterfaceAccount>,
    to: &InterfaceAccount<'info, TokenInterfaceAccount>,
    strategy: &Account<'info, StrategyConfig>,
    amount: u64,
    mint: &InterfaceAccount<'info, TokenInterfaceMint>,
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

pub fn create_metadata<'info>(
    token_metadata_program: &Program<'info, Metaplex>,
    creator: &Signer<'info>,
    strategy: &Account<'info, StrategyConfig>,
    m_token_mint: &Account<'info, TokenMint>,
    metadata: &UncheckedAccount<'info>,
    system_program: &Program<'info, System>,
    rent: &Sysvar<'info, Rent>,
    name: String,
    symbol: String,
    uri: String,
    strategy_bump: u8,
) -> Result<()> {
    let data_v2 = DataV2 {
        name,
        symbol,
        uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let seeds = &[
        StrategyConfig::SEED_PREFIX.as_bytes(),
        strategy.creator.as_ref(),
        &[strategy_bump],
    ];

    let signer = &[&seeds[..]];

    create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: metadata.to_account_info(),
                mint: m_token_mint.to_account_info(),
                mint_authority: strategy.to_account_info(),
                payer: creator.to_account_info(),
                update_authority: strategy.to_account_info(),
                system_program: system_program.to_account_info(),
                rent: rent.to_account_info(),
            },
            signer,
        ),
        data_v2,
        true,
        true,
        None,
    )
}

pub fn mint_to<'info>(
    token_program: &Program<'info, Token>,
    mint: &Account<'info, TokenMint>,
    to: &Account<'info, TokenTokenAccount>,
    authority: &Account<'info, StrategyConfig>,
    amount: u64,
) -> Result<()> {
    anchor_spl::token::mint_to(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            MintTo {
                mint: mint.to_account_info(),
                to: to.to_account_info(),
                authority: authority.to_account_info(),
            },
            &[&authority.get_pda_signer()],
        ),
        amount,
    )
}

pub fn burn<'info>(
    token_program: &Program<'info, Token>,
    mint: &Account<'info, TokenMint>,
    from: &Account<'info, TokenTokenAccount>,
    authority: &AccountInfo<'info>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    anchor_spl::token::burn(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            Burn {
                mint: mint.to_account_info(),
                from: from.to_account_info(),
                authority: authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )
}
