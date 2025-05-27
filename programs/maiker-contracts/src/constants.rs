use anchor_lang::prelude::*;

#[constant]
pub const BASIS_POINT_MAX: i32 = 10000;

#[constant]
pub const MAX_BIN_PER_ARRAY: usize = 70;

#[constant]
pub const ANCHOR_DISCRIMINATOR: usize = 8;

#[constant]
pub const MAX_POSITIONS: usize = 10;

#[constant]
pub const SHARE_PRECISION: u64 = 1_000_000;

#[constant]
pub const DLMM_PROGRAM_ID: &str = "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";
