# Maiker Protocol Flow Documentation

This document provides a comprehensive explanation of the flow of actions, calculations, and fees in the Maiker protocol. It details each process from deposit to withdrawal, explaining the mathematical formulas and fee structures.

## Table of Contents

- [Overview](#overview)
- [Deposit Flow](#deposit-flow)
- [Withdrawal Flow](#withdrawal-flow)
- [Position Value Updates](#position-value-updates)
- [Fee Calculations](#fee-calculations)
- [Formulas](#formulas)

## Overview

Maiker is a Solana protocol that allows users to deposit token X into strategies. The protocol manages strategies that can hold positions in liquidity pools (using DLMM protocol). Users receive shares proportional to their contributions, and the protocol charges fees for performance gains and withdrawals.

Key components:
- **GlobalConfig**: Stores protocol-wide settings including fee rates and withdrawal intervals
- **StrategyConfig**: Manages strategy-specific data, positions, and share calculations
- **UserPosition**: Tracks individual user deposits, shares, and last share values
- **PendingWithdrawal**: Manages withdrawal requests that are time-locked

## Deposit Flow

The deposit process allows users to contribute token X to a strategy and receive shares:

1. **Validation**:
   - Ensures all position values are fresh (updated in current timestamp)
   - Verifies deposit amount is greater than zero

2. **Share Calculation**:
   - For first deposit in a strategy (when `strategy_shares == 0`):
     - New shares = deposit amount (1:1 ratio with initial share value of 1.0)
   - For subsequent deposits:
     - Calculate current share value: `(total_strategy_value * SHARE_PRECISION) / total_shares`
     - New shares = `(deposit_amount * SHARE_PRECISION) / current_share_value`

3. **Position Update**:
   - For new users:
     - Initialize user position with new shares
     - Set initial share value to `SHARE_PRECISION` (1.0)
   - For existing users:
     - Calculate performance fee if share value has increased
     - Update user's shares by adding new shares and subtracting performance fee shares
     - Update last share value and timestamp

4. **Fee Processing**:
   - Performance fee shares are calculated for existing positions:
     - Calculate value gain percentage: `(current_value - last_value) * 10000 / last_value`
     - Calculate fee shares: `user_shares * value_gain_percentage * performance_fee_bps / 100_000_000`
   - Fee shares are added to strategy's fee pool

5. **Strategy Update**:
   - Mint new shares by adding to `strategy_shares`
   - Transfer tokens from user to strategy vault

6. **Event Emission**:
   - Emit `UserDepositEvent` with details of the deposit

## Withdrawal Flow

Withdrawals follow a two-step process to enhance security and protect the protocol:

### Step 1: Initiate Withdrawal

1. **Validation**:
   - Ensures all position values are fresh
   - Verifies withdrawal amount is valid (> 0 and <= user's shares)

2. **Fee Calculation**:
   - Calculate performance fee based on share value increase since last update
   - Calculate withdrawal fee based on shares amount being withdrawn
   - Calculate effective shares (original shares minus fees)

3. **Token Amount Calculation**:
   - Calculate token amount to return: `(effective_shares * current_share_value) / SHARE_PRECISION`
   - This amount is locked in at initiation time

4. **Withdrawal Schedule**:
   - Calculate available timestamp based on withdrawal interval
   - Create `PendingWithdrawal` account with withdrawal details

5. **Account Updates**:
   - Reduce user's shares by the requested amount
   - Add fee shares to strategy's fee pool
   - Reduce total strategy shares by effective shares
   - Update user's last share value and timestamp

6. **Event Emission**:
   - Emit `InitiateWithdrawEvent` with withdrawal details

### Step 2: Process Withdrawal

1. **Validation**:
   - Verify withdrawal is ready (current time >= available time)

2. **Token Transfer**:
   - Transfer calculated token amount from strategy vault to user

3. **Account Cleanup**:
   - Close the `PendingWithdrawal` account

4. **Event Emission**:
   - Emit `ProcessWithdrawEvent` with withdrawal details

## Position Value Updates

Position values must be updated before any deposit or withdrawal to ensure accurate share calculations:

1. **Position Value Calculation**:
   - Each strategy's position in external liquidity pools is valued
   - For DLMM positions:
     - Calculate token X and token Y in the position across all bins
     - Convert to a single token value based on current price

2. **Freshness Validation**:
   - The `validate_position_values_freshness` function ensures all positions have values updated in the current timestamp
   - This prevents deposits/withdrawals based on stale values

## Fee Calculations

The protocol charges two types of fees:

### Performance Fee

- Charged on any gain in share value when users deposit or withdraw
- Formula: `user_shares * value_gain_percentage * performance_fee_bps / 100_000_000`
- Where `value_gain_percentage = (current_share_value - last_share_value) * 10000 / last_share_value`

### Withdrawal Fee

- Charged as a percentage of shares being withdrawn
- Formula: `shares_amount * withdrawal_fee_bps / 10_000`

Both fees are collected as shares and added to the strategy's fee pool. These shares can later be claimed by the admin and converted to tokens.

## Formulas

### Share Value Calculation

```
share_value = (total_strategy_value * SHARE_PRECISION) / total_strategy_shares
```

Where:
- `total_strategy_value = vault_balance + total_positions_value`
- `SHARE_PRECISION = 1,000,000` (representing 1.0 with 6 decimal places)

### Shares for Deposit

```
new_shares = (deposit_amount * SHARE_PRECISION) / current_share_value
```

### Token Amount for Withdrawal

```
token_amount = (shares_amount * current_share_value) / SHARE_PRECISION
```

### Performance Fee Shares

```
performance_fee_shares = user_shares * value_gain_percentage * performance_fee_bps / 100_000_000
```

Where:
- `value_gain_percentage = (current_share_value - last_share_value) * 10000 / last_share_value`

### Withdrawal Fee Shares

```
withdrawal_fee_shares = shares_amount * withdrawal_fee_bps / 10_000
``` 