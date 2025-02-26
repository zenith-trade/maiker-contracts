# Product Requirements Document: Meteora DLMM Position Management

## Overview

This document outlines the requirements for a Solana-based smart contract system that manages liquidity positions in Meteora's Dynamic Liquidity Market Maker (DLMM) protocol. The system allows users to deposit funds into strategy vaults, which are then used to create and manage liquidity positions in Meteora pools.

## Architecture

### Account Structures

#### StrategyConfig
- **Purpose**: Defines a liquidity strategy and manages its assets
- **Fields**:
  - `x_mint`: Token X mint address
  - `y_mint`: Token Y mint address
  - `x_vault`: Associated Token Account for token X
  - `y_vault`: Associated Token Account for token Y
  - `strategy_shares`: Total shares issued for this strategy
  - `owner`: Authority that can execute admin operations
  - `strategy_type`: Defines the risk profile (aggressive, low-risk, etc.)
  - `lb_pair`: Reference to the Meteora liquidity pair

#### UserPosition
- **Purpose**: Tracks a user's share in a strategy
- **Fields**:
  - `user`: User's wallet address
  - `strategy`: Reference to the StrategyConfig
  - `strategy_share`: User's share of the strategy position
  - `deposit_timestamp`: When the user deposited
  - `last_update_timestamp`: Last time the position was updated

#### GlobalConfig
- **Purpose**: Stores protocol-wide settings and access control
- **Fields**:
  - `admin`: Primary admin with full control
  - `operators`: Array of addresses with specific permissions
  - `performance_fee_bps`: Performance fee in basis points
  - `withdrawal_fee_bps`: Optional withdrawal fee in basis points
  - `treasury`: Address where fees are sent
  - `paused`: Emergency pause flag
  - `high_water_mark_enabled`: Whether to use high-water mark for fee calculation

#### PerformanceMetrics
- **Purpose**: Tracks performance data for fee calculation
- **Fields**:
  - `strategy`: Reference to the StrategyConfig
  - `last_fee_collection_timestamp`: When fees were last collected
  - `high_water_mark`: Highest value per share historically (fixed-point, 6 decimals)
  - `total_fees_collected_x`: Total token X fees collected
  - `total_fees_collected_y`: Total token Y fees collected

### Instructions

#### User-Facing Instructions
1. **CreateStrategy**
   - Creates a new strategy configuration with specified parameters
   - Sets up token vaults and initializes shares

2. **Deposit**
   - User deposits token X and token Y into strategy vaults
   - Updates user's strategy shares and total strategy shares
   - Creates UserPosition PDA if it doesn't exist

3. **Withdraw**
   - User withdraws their share of tokens from strategy vaults
   - Updates user's strategy shares and total strategy shares
   - May close UserPosition PDA if fully withdrawn

#### Admin Instructions (Called by Risk Engine)
1. **InitializePositionCpi**
   - Creates a new position in the Meteora DLMM
   - Uses funds from strategy vaults

2. **AddLiquidityByWeightCpi**
   - Adds liquidity to an existing Meteora position
   - Uses funds from strategy vaults

3. **RemoveAllLiquidityCpi**
   - Removes all liquidity from a Meteora position
   - Returns funds to strategy vaults

4. **ClaimFeeCpi**
   - Claims accumulated fees from a Meteora position
   - Returns fees to strategy vaults

5. **ClosePositionCpi**
   - Closes a Meteora position
   - Cleans up position accounts

#### Admin Instructions (Protocol Management)
1. **UpdateGlobalConfig**
   - Updates protocol-wide settings
   - Can only be called by admin

2. **CollectPerformanceFees**
   - Calculates and collects performance fees
   - Updates high-water mark when new all-time-high value per share is reached
   - Transfers fees to treasury
   - Only collects fees on gains above the previous high water mark
   - Proportionally takes fees in both token X and token Y

3. **EmergencyPause**
   - Pauses specific or all protocol operations
   - Can only be called by admin

### Operational Flows

#### Initial Position Creation
1. CreatePosition
2. AddLiquidityByWeight

#### Fee Autocompounding
1. ClaimFee
2. AddLiquidityByWeight

#### Full Rebalance (Same Position)
1. ClaimFee (for both tokens)
2. RemoveAllLiquidity
3. AddLiquidityByWeight

#### Full Rebalance (New Position)
1. ClaimFee (for both tokens)
2. RemoveAllLiquidity
3. ClosePosition
4. CreatePosition
5. AddLiquidityByWeight

## Risk Management

The system will support multiple strategy configurations with different risk profiles:
- Aggressive strategies (e.g., narrow price ranges)
- Low-risk strategies (e.g., wider price ranges)

## Technical Integration

The program will integrate with Meteora's DLMM protocol via CPI calls to their program. The necessary Meteora instructions are imported from the `lb_clmm` package.

## Security Considerations

- Only authorized risk engine can execute admin instructions
- User funds are protected through proper PDA derivation and ownership checks
- Strategy shares calculations must be precise to ensure fair distribution of returns
- Proper error handling for all CPI calls to Meteora
- Role-based access control for different admin functions
- High-water mark mechanism to prevent charging fees on recovered losses, ensuring fees are only collected on new profits
- Fixed-point math for precise fee calculations without floating point errors
- Proportional fee collection to maintain strategy token ratios
- Emergency pause functionality for critical situations

## Events

The program will emit the following events to facilitate off-chain tracking:

### User Events
- **StrategyCreated**: When a new strategy is created
- **UserDeposited**: When a user deposits into a strategy
- **UserWithdrew**: When a user withdraws from a strategy
- **SharesUpdated**: When a user's shares are updated

### Admin Events
- **PositionCreated**: When a new Meteora position is created
- **PositionClosed**: When a Meteora position is closed
- **LiquidityAdded**: When liquidity is added to a position
- **LiquidityRemoved**: When liquidity is removed from a position
- **FeeClaimed**: When fees are claimed from a position
- **PerformanceFeeCollected**: When performance fees are collected, including fee amounts, new high water mark, and strategy value
- **ConfigUpdated**: When global config is updated
- **EmergencyAction**: When emergency functions are called

## Future Enhancements

- Support for multiple LB pairs per strategy and multiple positions per LB pair:
  - Each strategy can manage multiple LB pairs with different allocation weights
  - Each LB pair can have multiple active positions with different bin ranges
  - Position tracking system to monitor all active positions
  - Rebalancing capabilities between different LB pairs and positions

- Auto-rebalancing based on price movement thresholds

- Fee autocompounding:
  - Automatic fee collection from all positions
  - Reinvestment of fees according to current allocation strategy
  - Batch operations to optimize gas costs

- Strategy performance analytics 