use crate::{
    extensions::{BinArrayExtension, PositionExtension},
    math::{
        price_math::get_price_from_id,
        u128x128_math::Rounding,
        u64x64_math::SCALE_OFFSET,
        utils_math::{safe_mul_div_cast, safe_mul_shr_cast, safe_shl_div_cast},
    },
};
use anchor_lang::prelude::*;
use bytemuck::from_bytes;
use dlmm_interface::{BinArray, LbPair, PositionV2};

use crate::{MaikerError, StrategyConfig};

#[derive(Accounts)]
pub struct GetPositionValue<'info> {
    #[account(mut)]
    pub strategy: Account<'info, StrategyConfig>,

    /// CHECK: The position account
    pub position: UncheckedAccount<'info>,

    /// CHECK: The lb_pair account
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK: The bin array lower account
    pub bin_array_lower: UncheckedAccount<'info>,

    /// CHECK: The bin array upper account
    pub bin_array_upper: UncheckedAccount<'info>,

    pub user: Signer<'info>,
}

pub fn get_position_value_handler(ctx: Context<GetPositionValue>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;

    // Validate position belongs to strategy
    require!(
        strategy.positions.contains(&ctx.accounts.position.key()),
        MaikerError::InvalidPosition
    );

    let bin_array_lower_data = &ctx.accounts.bin_array_lower.data.borrow()[8..];
    let bin_array_upper_data = &ctx.accounts.bin_array_upper.data.borrow()[8..];

    let bin_array_lower = from_bytes::<BinArray>(bin_array_lower_data);
    let bin_array_upper = from_bytes::<BinArray>(bin_array_upper_data);

    // Zero-copy access to position data - skip the 8-byte discriminator
    let position_data = &ctx.accounts.position.data.borrow()[8..];
    let position = from_bytes::<PositionV2>(position_data);

    // Zero-copy access to lb_pair data - skip the 8-byte discriminator
    let lb_pair_data = &ctx.accounts.lb_pair.data.borrow()[8..];
    let lb_pair = from_bytes::<LbPair>(lb_pair_data);

    let active_bin_id = lb_pair.active_id;

    // Get Price
    let price = get_price_from_id(active_bin_id, lb_pair.bin_step)?;

    // Initialize variables to track total token amounts
    let mut total_token_x: u64 = 0;
    let mut total_token_y: u64 = 0;

    // Iterate through the position's bin range
    for bin_id in position.lower_bin_id..=position.upper_bin_id {
        // Get the liquidity share for this bin
        let liquidity_share = position.get_liquidity_share_in_bin(bin_id)?;

        // Skip if no liquidity in this bin
        if liquidity_share == 0 {
            continue;
        }

        // Determine which bin array contains this bin and get the bin
        let bin = if bin_array_lower.is_bin_id_within_range(bin_id)? {
            bin_array_lower.get_bin(bin_id)?
        } else if bin_array_upper.is_bin_id_within_range(bin_id)? {
            bin_array_upper.get_bin(bin_id)?
        } else {
            // Bin not found in either array
            msg!("Bin not found in either array");
            return Err(MaikerError::InvalidBinId.into());
        };

        // Calculate token amounts based on bin position relative to active bin
        if bin_id < active_bin_id {
            // Bins below active bin contain only token Y
            let bin_token_y = bin.amount_y;
            if bin_token_y > 0 && bin.liquidity_supply > 0 {
                // Calculate proportional amount based on liquidity share
                let position_token_y = safe_mul_div_cast(
                    liquidity_share,
                    bin_token_y.into(),
                    bin.liquidity_supply,
                    Rounding::Down,
                )?;

                total_token_y = total_token_y
                    .checked_add(position_token_y)
                    .ok_or(MaikerError::ArithmeticOverflow)?;
            }
        } else if bin_id > active_bin_id {
            // Bins above active bin contain only token X
            let bin_token_x = bin.amount_x;
            if bin_token_x > 0 && bin.liquidity_supply > 0 {
                // Calculate proportional amount based on liquidity share
                let position_token_x = safe_mul_div_cast(
                    liquidity_share,
                    bin_token_x.into(),
                    bin.liquidity_supply,
                    Rounding::Down,
                )?;

                total_token_x = total_token_x
                    .checked_add(position_token_x)
                    .ok_or(MaikerError::ArithmeticOverflow)?;
            }
        } else {
            // Active bin contains both tokens
            let bin_token_x = bin.amount_x;
            let bin_token_y = bin.amount_y;

            if bin.liquidity_supply > 0 {
                // Calculate proportional amounts based on liquidity share
                if bin_token_x > 0 {
                    let position_token_x = safe_mul_div_cast(
                        liquidity_share,
                        bin_token_x.into(),
                        bin.liquidity_supply,
                        Rounding::Down,
                    )?;

                    total_token_x = total_token_x
                        .checked_add(position_token_x)
                        .ok_or(MaikerError::ArithmeticOverflow)?;
                }

                if bin_token_y > 0 {
                    let position_token_y = safe_mul_div_cast(
                        liquidity_share,
                        bin_token_y.into(),
                        bin.liquidity_supply,
                        Rounding::Down,
                    )?;

                    total_token_y = total_token_y
                        .checked_add(position_token_y)
                        .ok_or(MaikerError::ArithmeticOverflow)?;
                }
            }
        }
    }

    msg!("Total token x: {}", total_token_x);
    msg!("Total token y: {}", total_token_y);
    msg!("Price per token y: {}", price);

    let calculate_in_x = strategy.x_mint == lb_pair.token_x_mint;
    let total_value;

    if calculate_in_x {
        // Strategy's mint_x === lb_pair's token_x_mint
        // Calculate value in terms of token X
        let token_y_in_x = if total_token_y > 0 {
            // Use safe_shl_div_cast to shift right by SCALE_OFFSET and divide token_y by price
            safe_shl_div_cast(total_token_y.into(), price, SCALE_OFFSET, Rounding::Down)?
        } else {
            0
        };

        msg!("Token y in x: {}", token_y_in_x);

        // Total value in terms of token X
        total_value = total_token_x
            .checked_add(token_y_in_x)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        msg!("Total value in terms of token X: {}", total_value);
    } else {
        // Strategy's mint_x !== lb_pair's token_y_mint
        // Calculate value in terms of token Y
        let token_x_in_y = if total_token_x > 0 {
            // Use safe_mul_shr_cast to multiply token_x by price and shift right by SCALE_OFFSET
            safe_mul_shr_cast(total_token_x.into(), price, SCALE_OFFSET, Rounding::Down)?
        } else {
            0
        };

        msg!("Token x in y: {}", token_x_in_y);

        // Total value in terms of token Y
        total_value = total_token_y
            .checked_add(token_x_in_y)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        msg!("Total value in terms of token Y: {}", total_value);
    }

    // Update strategy config with position value
    strategy.update_position_value(ctx.accounts.position.key(), total_value, Clock::get()?.slot);

    Ok(())
}
