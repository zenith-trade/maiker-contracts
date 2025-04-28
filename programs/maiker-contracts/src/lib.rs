use anchor_lang::prelude::*;

pub mod constants;
pub mod controllers;
pub mod error;
pub mod events;
pub mod extensions;
pub mod ids;
pub mod instructions;
pub mod macros;
pub mod math;
pub mod state;

pub use constants::*;
pub use controllers::*;
pub use error::*;
pub use events::*;
pub use ids::*;
pub use instructions::*;
pub use state::*;
declare_id!("27mwfhSgaW1BDyYHcnfRnthvrCUZefXnwawH2YYbx2xx");

#[program]
pub mod maiker_contracts {
    use super::*;

    // Initialize
    pub fn initialize(
        ctx: Context<Initialize>,
        global_config_args: GlobalConfigArgs,
    ) -> Result<()> {
        instructions::initialize_handler(ctx, global_config_args)
    }

    // User instructions
    pub fn create_strategy(ctx: Context<CreateStrategy>) -> Result<()> {
        instructions::create_strategy_handler(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit_handler(ctx, amount)
    }

    pub fn initiate_withdrawal(ctx: Context<InitiateWithdrawal>, shares_amount: u64) -> Result<()> {
        instructions::initiate_withdrawal_handler(ctx, shares_amount)
    }

    pub fn process_withdrawal(ctx: Context<ProcessWithdrawal>) -> Result<()> {
        instructions::process_withdrawal_handler(ctx)
    }

    pub fn get_position_value(ctx: Context<GetPositionValue>) -> Result<()> {
        instructions::get_position_value_handler(ctx)
    }

    // Admin Instructions
    pub fn update_global_config(
        ctx: Context<UpdateGlobalConfig>,
        global_config_args: GlobalConfigArgs,
    ) -> Result<()> {
        instructions::update_global_config_handler(ctx, global_config_args)
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

    pub fn swap_exact_in<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, Swap<'info>>,
        amount_in: u64,
        min_amount_out: u64,
        x_to_y: bool,
    ) -> Result<()> {
        instructions::swap_exact_in_handler(ctx, amount_in, min_amount_out, x_to_y)
    }

    pub fn begin_swap(ctx: Context<FlashSwap>, x_to_y: bool, amount_in: u64) -> Result<()> {
        instructions::begin_swap_handler(ctx, x_to_y, amount_in)
    }

    pub fn end_swap(ctx: Context<FlashSwap>, x_to_y: bool) -> Result<()> {
        instructions::end_swap_handler(ctx, x_to_y)
    }
}
