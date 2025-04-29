use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct BinLiquidityDistributionByWeight {
    /// Define the bin ID wish to deposit to.
    pub bin_id: i32,
    /// weight of liquidity distributed for this bin id
    pub weight: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct LiquidityParameterByWeight {
    /// Amount of X token to deposit
    pub amount_x: u64,
    /// Amount of Y token to deposit
    pub amount_y: u64,
    /// Active bin that integrator observe off-chain
    pub active_id: i32,
    /// max active bin slippage allowed
    pub max_active_bin_slippage: i32,
    /// Liquidity distribution to each bins
    pub bin_liquidity_dist: Vec<BinLiquidityDistributionByWeight>,
}

impl From<LiquidityParameterByWeight> for dlmm_interface::LiquidityParameterByWeight {
    fn from(param: LiquidityParameterByWeight) -> Self {
        Self {
            amount_x: param.amount_x,
            amount_y: param.amount_y,
            active_id: param.active_id,
            max_active_bin_slippage: param.max_active_bin_slippage,
            bin_liquidity_dist: param
                .bin_liquidity_dist
                .into_iter()
                .map(Into::into)
                .collect(),
        }
    }
}

impl From<BinLiquidityDistributionByWeight> for dlmm_interface::BinLiquidityDistributionByWeight {
    fn from(dist: BinLiquidityDistributionByWeight) -> Self {
        Self {
            bin_id: dist.bin_id,
            weight: dist.weight,
        }
    }
}
