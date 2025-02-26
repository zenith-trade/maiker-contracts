# Multiple LB Pairs and Positions Design

## Enhanced Data Model

### StrategyConfig (Updated)

    pub struct StrategyConfig {
        // Existing fields
        pub x_mint: Pubkey,
        pub y_mint: Pubkey,
        pub x_vault: Pubkey,
        pub y_vault: Pubkey,
        pub strategy_shares: u64,
        pub owner: Pubkey,
        pub strategy_type: u8,
        
        // New fields
        pub active_lb_pairs_count: u8,  // Number of active LB pairs
        pub max_lb_pairs: u8,           // Maximum number of LB pairs allowed
    }

### LBPairConfig

    pub struct LBPairConfig {
        pub strategy: Pubkey,           // Parent strategy
        pub lb_pair: Pubkey,            // Meteora LB pair address
        pub active_positions_count: u8, // Number of active positions
        pub max_positions: u8,          // Maximum number of positions allowed
        pub weight: u8,                 // Allocation weight (percentage)
        pub status: u8,                 // Active, paused, etc.
    }

### PositionTracker

    pub struct PositionTracker {
        pub strategy: Pubkey,           // Parent strategy
        pub lb_pair_config: Pubkey,     // Parent LB pair config
        pub position_pubkey: Pubkey,    // Meteora position address
        pub lower_bin_id: i32,          // Lower bin ID
        pub upper_bin_id: i32,          // Upper bin ID
        pub liquidity: u128,            // Current liquidity amount
        pub created_at: i64,            // Creation timestamp
        pub last_updated_at: i64,       // Last update timestamp
        pub status: u8,                 // Active, closed, etc.
    }

## Position Management

1. **Creating Positions**:
   - Check if the LB pair has capacity for a new position
   - Create the position in Meteora via CPI
   - Create a PositionTracker to track this position
   - Update the LBPairConfig's active_positions_count

2. **Tracking Positions**:
   - Use the PositionTracker accounts to maintain a registry of all active positions
   - Query positions by strategy, by LB pair, or individually

3. **Rebalancing**:
   - Can target specific positions or all positions in an LB pair
   - Can shift allocation between different LB pairs

## Allocation Management

1. **Initial Allocation**:
   - Distribute funds across LB pairs according to their weights
   - Within each LB pair, distribute across positions as needed

2. **Rebalancing Between Pairs**:
   - Close positions in over-allocated pairs
   - Open positions in under-allocated pairs
   - Transfer funds between vaults if needed

## Fee Autocompounding

For autocompounding fees across multiple positions:

1. **Claim Fees**:
   - Iterate through all active positions
   - Claim fees from each position via CPI
   - Accumulate claimed fees in strategy vaults

2. **Reinvest**:
   - Distribute accumulated fees across positions according to allocation strategy
   - Add liquidity to positions via CPI

## Implementation Approach

Here's how you can implement this in your Anchor program:

1. **Create LB Pair Config Instruction**:

    #[derive(Accounts)]
    pub struct CreateLbPairConfig<'info> {
        #[account(mut)]
        pub strategy: Account<'info, StrategyConfig>,
        
        #[account(
            init,
            payer = authority,
            space = 8 + size_of::<LBPairConfig>(),
            seeds = [b"lb_pair_config", strategy.key().as_ref(), lb_pair.key().as_ref()],
            bump
        )]
        pub lb_pair_config: Account<'info, LBPairConfig>,
        
        pub lb_pair: AccountInfo<'info>,
        
        #[account(constraint = authority.key() == strategy.owner)]
        pub authority: Signer<'info>,
        
        pub system_program: Program<'info, System>,
    }

2. **Create Position Tracker Instruction**:

    #[derive(Accounts)]
    pub struct CreatePositionTracker<'info> {
        #[account(mut)]
        pub strategy: Account<'info, StrategyConfig>,
        
        #[account(
            mut,
            constraint = lb_pair_config.strategy == strategy.key(),
            seeds = [b"lb_pair_config", strategy.key().as_ref(), lb_pair_config.lb_pair.as_ref()],
            bump
        )]
        pub lb_pair_config: Account<'info, LBPairConfig>,
        
        #[account(
            init,
            payer = authority,
            space = 8 + size_of::<PositionTracker>(),
            seeds = [
                b"position_tracker", 
                strategy.key().as_ref(), 
                lb_pair_config.key().as_ref(),
                position.key().as_ref()
            ],
            bump
        )]
        pub position_tracker: Account<'info, PositionTracker>,
        
        pub position: AccountInfo<'info>,
        
        #[account(constraint = authority.key() == strategy.owner)]
        pub authority: Signer<'info>,
        
        pub system_program: Program<'info, System>,
    }

3. **Batch Fee Collection and Reinvestment**:

    pub fn collect_and_reinvest_fees(
        ctx: Context<CollectAndReinvestFees>,
    ) -> Result<()> {
        // 1. Iterate through all position trackers for this strategy
        // 2. For each position, claim fees via CPI
        // 3. Calculate new allocation based on strategy rules
        // 4. Reinvest collected fees by adding liquidity to positions
        
        Ok(())
    } 