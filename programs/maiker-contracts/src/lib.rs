use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use error::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

declare_id!("27mwfhSgaW1BDyYHcnfRnthvrCUZefXnwawH2YYbx2xx");

#[program]
pub mod maiker_contracts {
    use super::*;

    // Initialize
    pub fn initialize(
        ctx: Context<Initialize>,
        performance_fee_bps: u16,
        withdrawal_fee_bps: u16,
    ) -> Result<()> {
        instructions::initialize_handler(ctx, performance_fee_bps, withdrawal_fee_bps)
    }

    // User instructions
    pub fn create_strategy(ctx: Context<CreateStrategy>) -> Result<()> {
        instructions::create_strategy_handler(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount_x: u64, amount_y: u64) -> Result<()> {
        instructions::deposit_handler(ctx, amount_x, amount_y)
    }

    pub fn withdraw(ctx: Context<Withdraw>, shares_amount: u64) -> Result<()> {
        instructions::withdraw_handler(ctx, shares_amount)
    }

    pub fn get_position_value(ctx: Context<GetPositionValue>) -> Result<()> {
        instructions::get_position_value_handler(ctx)
    }

    // Admin Instructionsxe
    pub fn update_global_config(
        ctx: Context<UpdateGlobalConfig>,
        performance_fee_bps: Option<u16>,
        withdrawal_fee_bps: Option<u16>,
        treasury: Option<Pubkey>,
        new_admin: Option<Pubkey>,
    ) -> Result<()> {
        instructions::update_global_config_handler(
            ctx,
            performance_fee_bps,
            withdrawal_fee_bps,
            treasury,
            new_admin,
        )
    }

    // Claims the actual tokens to treasury wallet
    pub fn claim_fees(ctx: Context<ClaimFees>, shares_to_claim: Option<u64>) -> Result<()> {
        instructions::claim_fees_handler(ctx, shares_to_claim)
    }

    // TODO: Claim Performance Fee on User Position -> Only required for users that infrequently deposit/withdraw funds so we don't leak auto-compound fees

    // CPI instructions
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        liquidity_parameter: LiquidityParameterByWeight,
    ) -> Result<()> {
        instructions::add_liquidity_handler(ctx, liquidity_parameter)
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>) -> Result<()> {
        instructions::remove_all_liquidity_handler(ctx)
    }

    pub fn claim_fee(ctx: Context<ClaimFee>) -> Result<()> {
        instructions::claim_fee_handler(ctx)
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        instructions::close_position_handler(ctx)
    }

    pub fn initialize_position(
        ctx: Context<InitializePosition>,
        lower_bin_id: i32,
        width: i32,
    ) -> Result<()> {
        instructions::initialize_position_handler(ctx, lower_bin_id, width)
    }
}
