# Product Requirements Document: Meteora DLMM Position Management

## Overview

This document outlines the requirements for a Solana-based smart contract system that manages liquidity positions in Meteora's Dynamic Liquidity Market Maker (DLMM) protocol. The system allows users to deposit funds into strategy vaults, which are then used to create and manage liquidity positions in Meteora pools.

## Architecture

### Account Structures

#### StrategyConfig
- **Purpose**: Defines a liquidity strategy and manages its assets
- **Fields**:
  - `creator`: Creator of the strategy
  - `x_mint`: Token X mint address
  - `y_mint`: Token Y mint address
  - `x_vault`: Associated Token Account for token X
  - `y_vault`: Associated Token Account for token Y
  - `strategy_shares`: Total shares issued for this strategy
  - `fee_shares_pending`: Shares allocated to fees but not yet claimed
  - `position_count`: Number of active positions
  - `positions`: Array of position public keys
  - `positions_value`: Array of position values same ordering as positions array
  - `last_position_update`: Array of timestamp when the position value was last updated. Ordering is same as positions array pubkeys
  - `last_rebalance_time`: Timestamp of the last rebalance
  - `bump`: PDA bump

#### UserPosition
- **Purpose**: Tracks a user's share in a strategy
- **Fields**:
  - `user`: User's wallet address
  - `strategy`: Reference to the StrategyConfig
  - `strategy_share`: User's share of the strategy position
  - `last_share_value`: Last share value when user deposited/withdrew
  - `last_update_timestamp`: Last time the position was updated
  - `bump`: PDA bump

#### GlobalConfig
- **Purpose**: Stores protocol-wide settings and access control
- **Fields**:
  - `admin`: Primary admin with full control
  - `performance_fee_bps`: Performance fee in basis points
  - `withdrawal_fee_bps`: Optional withdrawal fee in basis points
  - `treasury`: Address where fees are sent
  - `bump`: PDA bump

### Instructions

#### User-Facing Instructions
1. **CreateStrategy**
   - Creates a new strategy configuration with specified parameters
   - Sets up token vaults and initializes shares

2. **Deposit**
   - User deposits token X and token Y into strategy vaults
   - Calculates current share value
   - For existing users, collects performance fees if applicable
   - Updates user's strategy shares and total strategy shares
   - Updates user's last_share_value to current share value
   - Creates UserPosition PDA if it doesn't exist

3. **Withdraw**
   - Calculates current share value
   - Collects performance fees if applicable
   - User withdraws their share of tokens from strategy vaults
   - Updates user's strategy shares and total strategy shares
   - May close UserPosition PDA if fully withdrawn

#### Admin Instructions (Position Management)
1. **AddLiquidity**
   - Adds liquidity to a Meteora position
   - Uses funds from strategy vaults
   - Updates position tracking in strategy config

2. **RemoveLiquidity**
   - Removes liquidity from a Meteora position
   - Returns funds to strategy vaults
   - Updates position tracking in strategy config

3. **ClaimFee**
   - Claims accumulated fees from a Meteora position
   - Returns fees to strategy vaults

4. **ClosePosition**
   - Closes a Meteora position
   - Removes position from tracking array in strategy config

#### Admin Instructions (Protocol Management)
1. **UpdateGlobalConfig**
   - Updates protocol-wide settings
   - Can only be called by admin

2. **ClaimFees**
   - Claims accumulated performance fees
   - Converts fee shares to tokens
   - Transfers tokens to treasury
   - Reduces fee_shares_pending and strategy_shares

### Performance Fee Implementation

The protocol implements a capital-efficient, two-phase performance fee system:

#### Phase 1: Fee Accrual
- Performance fees are calculated when users deposit or withdraw
- Fees are collected as shares based on user-specific performance gains
- Fee shares are tracked in `fee_shares_pending` but remain deployed in the strategy
- This allows fees to continue generating returns until claimed

#### Phase 2: Fee Claiming
- Admin can claim accumulated fees via the `claim_fees` instruction
- Fees can be claimed in full or partially
- When claimed, tokens are transferred to the treasury
- Both `fee_shares_pending` and `strategy_shares` are reduced accordingly

### Operational Flows

#### Initial Position Creation
1. Admin creates a new position in Meteora
2. Position public key is stored in the strategy's positions array

#### Fee Autocompounding
1. Admin claims fees from Meteora positions
2. Fees remain in strategy vaults for redeployment

#### Rebalancing
1. Admin claims fees from Meteora positions
2. Admin removes liquidity from positions as needed
3. Admin adds liquidity to new or existing positions
4. Strategy's positions array is updated accordingly

## Risk Management

The system supports flexible position management:
- Admin can create multiple positions with different bin ranges
- Positions can be adjusted based on market conditions
- Rebalancing can be performed at admin's discretion

## Technical Integration

The program integrates with Meteora's DLMM protocol via CPI calls to their program. The necessary Meteora instructions are imported from the `lb_clmm` package.

## Security Considerations

- Only authorized admin can execute admin instructions
- User funds are protected through proper PDA derivation and ownership checks
- Strategy shares calculations use checked arithmetic to prevent overflow errors
- User-specific performance fee tracking ensures fair fee collection
- Capital-efficient fee accrual keeps fees productive until claimed
- Proper error handling for all CPI calls to Meteora

## Events

The program emits the following events to facilitate off-chain tracking:

### User Events
- **StrategyCreated**: When a new strategy is created
- **UserDeposited**: When a user deposits into a strategy
- **UserWithdrew**: When a user withdraws from a strategy

### Admin Events
- **FeesClaimed**: When performance fees are claimed, including fee shares and token amounts
- **GlobalConfigUpdated**: When global config is updated

### CPI Events
- Events related to position management in Meteora

## Future Enhancements

- **Periodic Fee Collection**:
  - Implement a mechanism to collect fees from all users periodically
  - Ensures fair fee collection for both active and passive users
  - Prevents autocompounding advantage for long-term holders

- **Enhanced Position Management**:
  - Automated rebalancing based on price thresholds
  - Dynamic bin range adjustment based on volatility

- **Analytics and Reporting**:
  - Off-chain indexing for position performance tracking
  - User dashboard for visualizing strategy performance
  - Admin dashboard for monitoring and managing positions


## Position Value Calculation

### Overview
The strategy needs to accurately track the value of each position it manages. This is crucial for calculating user shares, determining rebalancing needs, and ensuring fair deposits and withdrawals.

### Position Value Calculation Process
1. Each position's value is calculated separately through a dedicated `get_position_value` instruction
2. The calculation takes into account:
   - The active bin ID from the LB pair
   - The current price derived from the active bin
   - The position's liquidity shares across all bins
   - The token amounts in each bin

3. The value is calculated in terms of the strategy's primary token (x_mint)
4. The calculation results and timestamp are stored in the strategy's `positions_values` and `last_position_update` arrays

### Position Value Freshness Requirement
To ensure fair deposits and withdrawals, all position values must be up-to-date:

1. Before any deposit or withdrawal can be processed, all positions must have their values updated within the current slot
2. This is enforced by validating the `last_position_update` timestamp for each position
3. If any position has a stale value, the deposit/withdrawal transaction will fail

### Implementation Details
- The strategy maintains arrays to track:
  - Position public keys (`positions`)
  - Position values (`positions_values`)
  - Last update timestamps (`last_position_update`)
- The `get_position_value` instruction updates these arrays
- Deposit and withdraw instructions validate the freshness of all position values

### Benefits
- Ensures accurate and fair value calculations for all users
- Prevents exploitation through stale position values
- Enables the strategy to manage multiple positions while maintaining accurate accounting
- Provides a clean separation of concerns between value calculation and deposit/withdrawal logic 