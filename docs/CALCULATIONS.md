# Protocol Calculations Documentation

This document provides a detailed explanation of the mathematical calculations used in the Maiker protocol, including examples to illustrate how they work.

## Table of Contents

- [Constants](#constants)
- [Share Calculation](#share-calculation)
- [Share Value](#share-value)
- [Deposit Calculations](#deposit-calculations)
- [Withdrawal Calculations](#withdrawal-calculations)
- [Fee Calculations](#fee-calculations)
- [Position Value Calculation](#position-value-calculation)
- [Examples](#examples)

## Constants

The protocol uses the following constants:

```rust
pub const SHARE_PRECISION: u64 = 1_000_000;
```

`SHARE_PRECISION` represents 1.0 with 6 decimal places precision. This allows for fractional share values while working with integer arithmetic.

## Share Calculation

Shares are the fundamental unit that represents a user's ownership portion of a strategy. All calculations involving shares are designed to ensure proportional ownership and fair distribution of gains and losses.

## Share Value

The share value represents the worth of a single share in terms of the underlying token. It is calculated as:

```
share_value = (total_strategy_value * SHARE_PRECISION) / total_strategy_shares
```

Where:
- `total_strategy_value` is the sum of the token X in the vault plus the value of all positions
- `total_strategy_shares` is the total number of shares issued by the strategy

If no shares have been issued (`total_strategy_shares = 0`), the share value defaults to `SHARE_PRECISION` (1.0).

## Deposit Calculations

### First Deposit

For the first deposit in a strategy (when `strategy_shares = 0`):

```
new_shares = deposit_amount
```

This establishes the initial share price at 1:1 (one token X = one share).

### Subsequent Deposits

For subsequent deposits, the number of new shares is calculated based on the current share value:

```
new_shares = (deposit_amount * SHARE_PRECISION) / current_share_value
```

This ensures that users receive shares proportional to their contribution relative to the current strategy value.

## Withdrawal Calculations

When a user withdraws, the amount of tokens they receive is calculated as:

```
token_amount = (shares_amount * current_share_value) / SHARE_PRECISION
```

This formula ensures that users receive tokens proportional to their share ownership and the current strategy value.

## Fee Calculations

### Performance Fee

Performance fees are charged on any increase in share value since a user's last deposit or withdrawal:

```
value_gain_percentage = (current_share_value - last_share_value) * 10000 / last_share_value
performance_fee_shares = user_shares * value_gain_percentage * performance_fee_bps / 100_000_000
```

Where:
- `value_gain_percentage` is the percentage increase in share value (in basis points)
- `performance_fee_bps` is the performance fee rate in basis points (e.g., 2000 = 20%)
- The divisor `100_000_000` normalizes the calculation (10000 for percentage * 10000 for bps)

### Withdrawal Fee

Withdrawal fees are charged as a percentage of the shares being withdrawn:

```
withdrawal_fee_shares = shares_amount * withdrawal_fee_bps / 10_000
```

Where:
- `withdrawal_fee_bps` is the withdrawal fee rate in basis points (e.g., 50 = 0.5%)

## Position Value Calculation

The protocol calculates the value of positions in external liquidity pools in terms of token X. For DLMM positions, this involves:

1. Retrieving the token amounts (X and Y) in each bin of the position
2. Calculating the position's share of each bin based on liquidity ownership
3. Converting token Y to a token X equivalent using the current price
4. Summing all values to get the total position value in token X

## Examples

### Example 1: Initial Deposit

Alice is the first user to deposit into a strategy:
- Deposit amount: 1,000 token X
- Initial share value: 1.0 (represented as 1,000,000)
- New shares: 1,000
- Strategy shares after deposit: 1,000
- Alice's share: 100% of the strategy

### Example 2: Subsequent Deposit (No Value Change)

Bob deposits after Alice, with no change in strategy value:
- Current strategy shares: 1,000
- Current strategy value: 1,000 token X
- Current share value: 1.0 (1,000,000)
- Bob's deposit: 500 token X
- New shares for Bob: (500 * 1,000,000) / 1,000,000 = 500
- Strategy shares after deposit: 1,500
- Alice's ownership: 66.67% (1,000/1,500)
- Bob's ownership: 33.33% (500/1,500)

### Example 3: Deposit After Value Increase

Carol deposits after the strategy value has increased:
- Current strategy shares: 1,500
- Current strategy value: 3,000 token X (100% increase)
- Current share value: (3,000 * 1,000,000) / 1,500 = 2,000,000 (2.0)
- Carol's deposit: 1,000 token X
- New shares for Carol: (1,000 * 1,000,000) / 2,000,000 = 500
- Strategy shares after deposit: 2,000
- Alice's ownership: 50% (1,000/2,000)
- Bob's ownership: 25% (500/2,000)
- Carol's ownership: 25% (500/2,000)

### Example 4: Performance Fee Calculation

Dave has an existing position and deposits more after a value increase:
- Dave's current shares: 1,000
- Last share value when Dave deposited: 1.0 (1,000,000)
- Current share value: 1.2 (1,200,000) - 20% increase
- Performance fee rate: 20% (2,000 bps)

Performance fee calculation:
1. Value gain percentage: (1,200,000 - 1,000,000) * 10000 / 1,000,000 = 2,000 (20%)
2. Performance fee shares: 1,000 * 2,000 * 2,000 / 100,000,000 = 40 shares

New deposit:
- Dave deposits 600 token X
- New shares: (600 * 1,000,000) / 1,200,000 = 500
- Dave's shares after deposit: 1,000 - 40 + 500 = 1,460

### Example 5: Withdrawal with Fees

Eve wants to withdraw half of her shares:
- Eve's shares: 1,000
- Current share value: 1.5 (1,500,000)
- Withdrawal amount: 500 shares
- Withdrawal fee rate: 0.5% (50 bps)

Withdrawal calculation:
1. Withdrawal fee shares: 500 * 50 / 10,000 = 2.5 shares (rounds to 2)
2. Effective shares to withdraw: 500 - 2 = 498
3. Token amount: (498 * 1,500,000) / 1,000,000 = 747 token X

After withdrawal:
- Eve's remaining shares: 500
- Strategy's fee shares increased by 2 