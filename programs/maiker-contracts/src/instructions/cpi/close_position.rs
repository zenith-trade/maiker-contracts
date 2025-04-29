use crate::state::*;
use anchor_lang::prelude::*;
use dlmm_interface::{close_position_invoke_signed, ClosePositionAccounts};

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(
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

    /// CHECK: This is the position account to be closed
    #[account(mut)]
    pub position: UncheckedAccount<'info>,

    /// CHECK: This is the LB pair account
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK: Bin array lower
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,

    /// CHECK: Bin array upper
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,

    /// CHECK: Account to receive the rent from the closed position
    #[account(mut)]
    pub rent_receiver: UncheckedAccount<'info>,

    /// The lb_clmm program
    /// CHECK: The lb_clmm program
    #[account(address = dlmm_interface::ID)]
    pub lb_clmm_program: UncheckedAccount<'info>,

    /// CHECK: Event authority for lb_clmm
    pub event_authority: UncheckedAccount<'info>,
}

pub fn close_position_handler(ctx: Context<ClosePosition>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;

    let strategy_signer = strategy.get_pda_signer();
    let strategy_signer_seeds = &[&strategy_signer[..]];

    let accounts = ClosePositionAccounts {
        sender: &strategy.to_account_info(),
        position: &ctx.accounts.position.to_account_info(),
        lb_pair: &ctx.accounts.lb_pair.to_account_info(),
        bin_array_lower: &ctx.accounts.bin_array_lower.to_account_info(),
        bin_array_upper: &ctx.accounts.bin_array_upper.to_account_info(),
        rent_receiver: &ctx.accounts.rent_receiver.to_account_info(),
        event_authority: &ctx.accounts.event_authority.to_account_info(),
        program: &ctx.accounts.lb_clmm_program.to_account_info(),
    };

    close_position_invoke_signed(accounts, strategy_signer_seeds)?;

    // Update the strategy's positions array by removing the closed position using the remove_position method
    strategy.remove_position(ctx.accounts.position.key())?;

    Ok(())
}
