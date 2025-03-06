use crate::error::*;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializePosition<'info> {
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
    /// CHECK: This is the position account that will be initialized
    #[account(mut)]
    pub position: Signer<'info>,

    /// CHECK: This is the LB pair account
    pub lb_pair: UncheckedAccount<'info>,

    /// The lb_clmm program
    #[account(address = lb_clmm::ID)]
    pub lb_clmm_program: Program<'info, lb_clmm::program::LbClmm>,

    /// CHECK: This is the event authority for lb_clmm
    pub event_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_position_handler(
    ctx: Context<InitializePosition>,
    lower_bin_id: i32,
    width: i32,
) -> Result<()> {
    // TODO: Validation that LB pair is valid for token pair of this strategy
    let strategy = &mut ctx.accounts.strategy;

    let strategy_signer = strategy.get_pda_signer();
    let strategy_signer_seeds = &[&strategy_signer[..]];

    let accounts = lb_clmm::cpi::accounts::InitializePosition {
        payer: ctx.accounts.authority.to_account_info(), // Authority pays for account creation
        position: ctx.accounts.position.to_account_info(),
        lb_pair: ctx.accounts.lb_pair.to_account_info(),
        owner: strategy.to_account_info(), // Strategy PDA
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.lb_clmm_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.lb_clmm_program.to_account_info(),
        accounts,
        strategy_signer_seeds,
    );

    lb_clmm::cpi::initialize_position(cpi_ctx, lower_bin_id, width)?;

    // Update the strategy's positions array using the add_position method
    strategy.add_position(ctx.accounts.position.key())?;

    Ok(())
}
