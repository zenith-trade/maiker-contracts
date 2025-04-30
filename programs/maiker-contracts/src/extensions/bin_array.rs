use crate::*;
use dlmm_interface::{Bin, BinArray};
use math::safe_math::SafeMath;

pub trait BinArrayExtension {
    fn is_bin_id_within_range(&self, bin_id: i32) -> Result<bool>;
    fn get_bin_index_in_array(&self, bin_id: i32) -> Result<usize>;

    fn get_bin_array_lower_upper_bin_id(index: i32) -> Result<(i32, i32)>;

    fn get_bin<'a>(&'a self, bin_id: i32) -> Result<&'a Bin>;
}

impl BinArrayExtension for BinArray {
    fn get_bin_array_lower_upper_bin_id(index: i32) -> Result<(i32, i32)> {
        let lower_bin_id = index.safe_mul(MAX_BIN_PER_ARRAY as i32)?;
        let upper_bin_id = lower_bin_id
            .safe_add(MAX_BIN_PER_ARRAY as i32)?
            .safe_sub(1)?;

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
        self.is_bin_id_within_range(bin_id)?;

        let (lower_bin_id, upper_bin_id) =
            BinArray::get_bin_array_lower_upper_bin_id(self.index as i32)?;

        let index = if bin_id.is_positive() {
            // When bin id is positive, the index is ascending
            bin_id.safe_sub(lower_bin_id)?
        } else {
            // When bin id is negative, the index is descending. Eg: bin id -1 will be located at last index of the bin array
            ((MAX_BIN_PER_ARRAY as i32).safe_sub(upper_bin_id.safe_sub(bin_id)?)?).safe_sub(1)?
        };

        if index >= 0 && index < MAX_BIN_PER_ARRAY as i32 {
            Ok(index as usize)
        } else {
            Err(MaikerError::InvalidBinId.into())
        }
    }
}
