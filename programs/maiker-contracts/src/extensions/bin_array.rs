use crate::*;
use dlmm_interface::{Bin, BinArray};

pub trait BinArrayExtension {
    fn is_bin_id_within_range(&self, bin_id: i32) -> Result<bool>;
    fn get_bin_index_in_array(&self, bin_id: i32) -> Result<usize>;

    fn get_bin_array_lower_upper_bin_id(index: i32) -> Result<(i32, i32)>;

    fn get_bin<'a>(&'a self, bin_id: i32) -> Result<&'a Bin>;
}

impl BinArrayExtension for BinArray {
    fn get_bin_array_lower_upper_bin_id(index: i32) -> Result<(i32, i32)> {
        let lower_bin_id = index
            .checked_mul(MAX_BIN_PER_ARRAY as i32)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        let upper_bin_id = lower_bin_id
            .checked_add(MAX_BIN_PER_ARRAY as i32)
            .ok_or(MaikerError::ArithmeticOverflow)?
            .checked_sub(1)
            .ok_or(MaikerError::ArithmeticOverflow)?;

        Ok((lower_bin_id, upper_bin_id))
    }

    fn is_bin_id_within_range(&self, bin_id: i32) -> Result<bool> {
        let (lower_bin_id, upper_bin_id) =
            BinArray::get_bin_array_lower_upper_bin_id(self.index as i32)?;

        Ok(bin_id >= lower_bin_id && bin_id <= upper_bin_id)
    }

    fn get_bin<'a>(&'a self, bin_id: i32) -> Result<&'a Bin> {
        Ok(&self.bins[self.get_bin_index_in_array(bin_id)?])
    }

    fn get_bin_index_in_array(&self, bin_id: i32) -> Result<usize> {
        require!(
            self.is_bin_id_within_range(bin_id)?,
            MaikerError::InvalidBinId
        );
        let (lower_bin_id, _) = BinArray::get_bin_array_lower_upper_bin_id(self.index as i32)?;
        let index = bin_id
            .checked_sub(lower_bin_id)
            .ok_or(MaikerError::ArithmeticOverflow)?;
        Ok(index as usize)
    }
}
