use crate::{math::safe_math::SafeMath, MaikerError};
use anchor_lang::prelude::*;
use dlmm_interface::PositionV2;

pub trait PositionExtension {
    fn id_within_position(&self, id: i32) -> Result<()>;
    fn get_idx(&self, bin_id: i32) -> Result<usize>;
    fn get_liquidity_share_in_bin(&self, bin_id: i32) -> Result<u128>;
}

impl PositionExtension for PositionV2 {
    fn id_within_position(&self, id: i32) -> Result<()> {
        require!(
            id >= self.lower_bin_id && id <= self.upper_bin_id,
            MaikerError::InvalidPosition
        );
        Ok(())
    }

    fn get_idx(&self, bin_id: i32) -> Result<usize> {
        self.id_within_position(bin_id)?;
        Ok(bin_id.safe_sub(self.lower_bin_id)? as usize)
    }

    fn get_liquidity_share_in_bin(&self, bin_id: i32) -> Result<u128> {
        let idx = self.get_idx(bin_id)?;
        Ok(self.liquidity_shares[idx])
    }
}
