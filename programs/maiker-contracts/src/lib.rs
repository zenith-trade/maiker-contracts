use anchor_lang::prelude::*;

declare_id!("27mwfhSgaW1BDyYHcnfRnthvrCUZefXnwawH2YYbx2xx");

#[program]
pub mod maiker_contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
