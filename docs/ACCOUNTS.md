# Account Structure Documentation

This document provides detailed information about the account structure in the Maiker protocol, explaining the purpose, fields, and relationships between different account types.

## Table of Contents

- [Overview](#overview)
- [GlobalConfig](#globalconfig)
- [StrategyConfig](#strategyconfig)
- [UserPosition](#userposition)
- [PendingWithdrawal](#pendingwithdrawal)
- [Account Relationships](#account-relationships)
- [PDA Derivation](#pda-derivation)

## Overview

The Maiker protocol uses several account types to manage protocol configuration, strategies, user positions, and withdrawals. These accounts are Program Derived Addresses (PDAs) with specific seed derivations.

## GlobalConfig

The `GlobalConfig` account stores protocol-wide settings and is a singleton PDA.

```rust
#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub admin: Pubkey,                    // Primary admin with full control
    pub performance_fee_bps: u16,         // Performance fee in basis points
    pub withdrawal_fee_bps: u16,          // Optional withdrawal fee in basis points
    pub treasury: Pubkey,                 // Address where fees are sent
    pub withdrawal_interval_seconds: u64, // Time interval for withdrawal windows
    pub bump: u8,                         // PDA bump
}
```

**Purpose**: 
- Stores global configuration parameters for the entire protocol
- Controls fee rates and withdrawal timing
- Designates admin and treasury addresses

**Seed Derivation**:
- `["global-config"]`

## StrategyConfig

The `StrategyConfig` account manages strategy-specific data, including positions, shares, and vaults.

```rust
#[account]
#[derive(InitSpace)]
pub struct StrategyConfig {
    pub creator: Pubkey,
    pub x_mint: Pubkey,
    pub y_mint: Pubkey,
    pub x_vault: Pubkey,
    pub y_vault: Pubkey,

    // Total shares issued
    pub strategy_shares: u64,

    // Fee Shares
    pub fee_shares: u64,

    // Direct position tracking
    pub position_count: u8,
    pub positions: [Pubkey; MAX_POSITIONS],
    pub positions_values: [u64; MAX_POSITIONS], // Total position value in token X
    pub last_position_update: [i64; MAX_POSITIONS],

    // Rebalancing info
    pub last_rebalance_time: i64,

    // For PDA derivation
    pub bump: u8,
}
```

**Purpose**:
- Manages a specific strategy's settings and state
- Tracks positions in external liquidity pools
- Accounts for total shares issued and fees collected
- Stores references to token vaults

**Seed Derivation**:
- `["strategy-config", creator]`

## UserPosition

The `UserPosition` account tracks an individual user's deposit in a specific strategy.

```rust
#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub user: Pubkey,               // User's wallet address
    pub strategy: Pubkey,           // Reference to the StrategyConfig
    pub strategy_share: u64,        // User's share of the strategy position
    pub last_share_value: u64,      // Last share value when user deposited/withdrew
    pub last_update_timestamp: i64, // Last time the position was updated
    pub bump: u8,                   // PDA bump
}
```

**Purpose**:
- Tracks a user's shares in a specific strategy
- Records the last share value for performance fee calculations
- Maintains timestamp for tracking value changes

**Seed Derivation**:
- `["user-position", user, strategy]`

## PendingWithdrawal

The `PendingWithdrawal` account manages a user's withdrawal request during the waiting period.

```rust
#[account]
#[derive(InitSpace)]
pub struct PendingWithdrawal {
    pub user: Pubkey,              // User who initiated the withdrawal
    pub strategy: Pubkey,          // Strategy from which to withdraw
    pub shares_amount: u64,        // Amount of shares to withdraw
    pub token_amount: u64,         // Amount of tokens to withdraw (calculated at initiation)
    pub initiation_timestamp: i64, // When the withdrawal was initiated
    pub available_timestamp: i64,  // When the withdrawal becomes available
    pub bump: u8,                  // PDA bump
}
```

**Purpose**:
- Stores withdrawal request details during the waiting period
- Locks in token amount at initiation time
- Tracks when the withdrawal becomes available

**Seed Derivation**:
- `["pending-withdrawal", user, strategy]`

## Account Relationships

The accounts in the Maiker protocol have the following relationships:

1. **GlobalConfig** (1) → **StrategyConfig** (many)
   - The GlobalConfig influences all strategies with global fee settings

2. **StrategyConfig** (1) → **UserPosition** (many)
   - Each strategy can have multiple user positions
   - UserPositions reference their parent strategy

3. **StrategyConfig** (1) → External Positions (many)
   - Strategies track external positions in liquidity pools

4. **UserPosition** (1) → **PendingWithdrawal** (0..1)
   - A user position may have at most one pending withdrawal at a time

## PDA Derivation

All accounts in the system are Program Derived Addresses (PDAs) with specific seed derivations:

1. **GlobalConfig**:
   ```rust
   pub const SEED_PREFIX: &'static str = "global-config";
   [SEED_PREFIX.as_bytes()]
   ```

2. **StrategyConfig**:
   ```rust
   pub const SEED_PREFIX: &'static str = "strategy-config";
   [SEED_PREFIX.as_bytes(), creator.as_ref()]
   ```

3. **UserPosition**:
   ```rust
   pub const SEED_PREFIX: &'static str = "user-position";
   [SEED_PREFIX.as_bytes(), user.key().as_ref(), strategy.key().as_ref()]
   ```

4. **PendingWithdrawal**:
   ```rust
   pub const SEED_PREFIX: &'static str = "pending-withdrawal";
   [SEED_PREFIX.as_bytes(), user.key().as_ref(), strategy.key().as_ref()]
   ``` 