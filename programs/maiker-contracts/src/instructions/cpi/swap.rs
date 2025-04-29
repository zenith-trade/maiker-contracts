use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use dlmm_interface::{swap_invoke_signed, SwapAccounts, SwapIxArgs};

use crate::{GlobalConfig, StrategyConfig};

#[derive(Accounts)]
pub struct Swap<'info> {
    /// The authority of the strategy
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

    // CPI accounts below
    /// CHECK: The LB pair account that will be used for swapping
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK: The bin array bitmap extension
    pub bin_array_bitmap_extension: Option<UncheckedAccount<'info>>,

    /// CHECK: The reserve account for token X
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,

    /// CHECK: The reserve account for token Y
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,

    /// The strategy vault for token X, which will be used for swapping
    #[account(mut)]
    pub strategy_vault_x: Account<'info, TokenAccount>,

    /// The strategy vault for token Y, which will be used for swapping
    #[account(mut)]
    pub strategy_vault_y: Account<'info, TokenAccount>,

    /// CHECK: Token X mint
    pub token_x_mint: UncheckedAccount<'info>,

    /// CHECK: Token Y mint
    pub token_y_mint: UncheckedAccount<'info>,

    /// CHECK: The oracle account for the LB pair
    #[account(mut)]
    pub oracle: UncheckedAccount<'info>,

    /// CHECK: Optional host fee account
    #[account(mut)]
    pub host_fee_in: Option<UncheckedAccount<'info>>,

    /// The lb_clmm program
    /// CHECK: The lb_clmm program
    #[account(address = dlmm_interface::ID)]
    pub lb_clmm_program: UncheckedAccount<'info>,

    /// CHECK: The event authority for the lb_clmm program
    pub event_authority: UncheckedAccount<'info>,

    /// The token program for token X
    pub token_x_program: Program<'info, Token>,

    /// The token program for token Y
    pub token_y_program: Program<'info, Token>,
}

/// Handle exact input swap - specifies the exact input amount and a minimum output amount
pub fn swap_exact_in_handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, Swap<'info>>,
    amount_in: u64,
    min_amount_out: u64,
    x_to_y: bool, // true if swapping from X to Y, false if swapping from Y to X
) -> Result<()> {
    // Get the strategy signer seeds for the CPI call
    let strategy_signer = ctx.accounts.strategy.get_pda_signer();
    let strategy_signer_seeds = &[&strategy_signer[..]];

    // Determine which strategy vault is the input and which is the output based on swap direction
    let (user_token_in, user_token_out) = if x_to_y {
        (
            ctx.accounts.strategy_vault_x.to_account_info(),
            ctx.accounts.strategy_vault_y.to_account_info(),
        )
    } else {
        (
            ctx.accounts.strategy_vault_y.to_account_info(),
            ctx.accounts.strategy_vault_x.to_account_info(),
        )
    };

    // Store account infos in variables
    let lb_pair_info = ctx.accounts.lb_pair.to_account_info();
    let program_info = ctx.accounts.lb_clmm_program.to_account_info();
    let reserve_x_info = ctx.accounts.reserve_x.to_account_info();
    let reserve_y_info = ctx.accounts.reserve_y.to_account_info();
    let token_x_mint_info = ctx.accounts.token_x_mint.to_account_info();
    let token_y_mint_info = ctx.accounts.token_y_mint.to_account_info();
    let oracle_info = ctx.accounts.oracle.to_account_info();
    let strategy_info = ctx.accounts.strategy.to_account_info();
    let token_x_program_info = ctx.accounts.token_x_program.to_account_info();
    let token_y_program_info = ctx.accounts.token_y_program.to_account_info();
    let event_authority_info = ctx.accounts.event_authority.to_account_info();

    // Get bitmap extension info
    let bitmap_extension_info = if let Some(account) = &ctx.accounts.bin_array_bitmap_extension {
        account.to_account_info()
    } else {
        program_info.clone()
    };

    // Get host fee info
    let host_fee_info = if let Some(account) = &ctx.accounts.host_fee_in {
        account.to_account_info()
    } else {
        program_info.clone()
    };

    let accounts = SwapAccounts {
        lb_pair: &lb_pair_info,
        bin_array_bitmap_extension: &bitmap_extension_info,
        reserve_x: &reserve_x_info,
        reserve_y: &reserve_y_info,
        user_token_in: &user_token_in,
        user_token_out: &user_token_out,
        token_x_mint: &token_x_mint_info,
        token_y_mint: &token_y_mint_info,
        oracle: &oracle_info,
        host_fee_in: &host_fee_info,
        user: &strategy_info,
        token_x_program: &token_x_program_info,
        token_y_program: &token_y_program_info,
        event_authority: &event_authority_info,
        program: &program_info,
    };

    let args = SwapIxArgs {
        amount_in,
        min_amount_out,
    };

    swap_invoke_signed(accounts, args, strategy_signer_seeds)?;

    Ok(())
}
