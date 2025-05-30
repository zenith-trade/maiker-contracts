# Maiker Protocol Documentation

Welcome to the Maiker Protocol documentation. This documentation provides a comprehensive overview of the protocol, its architecture, and how it works.

As part of the Solana Colosseum Hackathon submission 
The program is deployed on devnet right now and a working demo can be tried at https://app.maiker.fun

- [X](https://x.com/maikerfun)
- [Telegram](https://t.co/xPK9SafJeT)
- [Pitch video](https://youtu.be/MHn3dD4GBIg)
- [Technical video](https://youtu.be/FPF3FzMsdh0)
- [Article about the changing game of LPing on Solana—and why managed vaults are winning](https://x.com/KultureElectric/status/1915860087232774368)

## Overview

Maiker is a Solana protocol that allows users to deposit token X into strategies. These strategies manage positions in liquidity pools (using DLMM protocol) to generate yield. Users receive shares proportional to their contributions, and the protocol charges fees for performance gains and withdrawals.

Key features of the Maiker protocol:

- Single-token deposits (token X)
- Share-based accounting system
- Delayed withdrawals for security
- Performance and withdrawal fees
- Position value freshness validation
- Support for external liquidity positions

## Documentation Structure

This documentation is organized into the following sections:

1. [**Flow Documentation**](FLOW.md) - Detailed explanation of the protocol's processes and calculations
2. [**Account Structure**](ACCOUNTS.md) - Information about the account types and their relationships
3. [**Calculations**](CALCULATIONS.md) - Detailed explanation of the mathematical formulas with examples
4. [**Performance Fee**](PerformanceFee.md) - In-depth explanation of the performance fee mechanism
5. [**Product Requirements**](PRD.md) - Product requirements document
6. [**Diagrams**](DIAGRAMS.md) - Visual representations of the protocol

## Protocol Flow

The Maiker protocol involves the following key processes:

1. **Deposit**:
   - Users deposit token X into a strategy
   - They receive shares proportional to their contribution
   - Performance fees are charged on existing positions if value has increased

2. **Position Value Updates**:
   - Position values must be updated before any deposit or withdrawal
   - Ensures that all operations use fresh and accurate values

3. **Withdrawal**:
   - Two-step process: initiate and then process after a waiting period
   - Performance and withdrawal fees are collected
   - Token amount is calculated based on current share value

## Fees

The protocol charges two types of fees:

1. **Performance Fee**:
   - Charged on any increase in share value
   - Calculated when users deposit or withdraw
   - Represents a percentage of the value gain

2. **Withdrawal Fee**:
   - Small fee charged on withdrawals
   - Helps prevent abuse and compensate for costs

## Account Structure

The protocol uses several account types:

1. **GlobalConfig**: Stores protocol-wide settings
2. **StrategyConfig**: Manages strategy-specific data and positions
3. **UserPosition**: Tracks individual user deposits and shares
4. **PendingWithdrawal**: Manages withdrawal requests during the waiting period

## Security Features

Maiker incorporates several security features:

1. **Freshness Validation**: Ensures position values are up-to-date before critical operations
2. **Delayed Withdrawals**: Introduces a time buffer to prevent flash loan attacks
3. **Secure Calculations**: Uses checked arithmetic to prevent overflows and underflows
4. **PDA Architecture**: Secures accounts with program-derived addresses

## Getting Started

For developers interested in integrating with the Maiker protocol:

1. Review the [Flow Documentation](FLOW.md) to understand the protocol processes
2. Study the [Account Structure](ACCOUNTS.md) to understand the data model
3. Explore the [Calculations](CALCULATIONS.md) to understand the mathematics
4. Check the [PRD](PRD.md) for product requirements and rationale 