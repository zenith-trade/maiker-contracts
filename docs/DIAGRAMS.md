# System Diagrams

This document contains diagrams illustrating the account relationships and operational flows of the Meteora DLMM Position Management protocol.

## Account Relationships

```mermaid
graph TD
subgraph "Protocol Level"
GlobalConfig[GlobalConfig PDA]
end
subgraph "Strategy Level"
StrategyConfig[StrategyConfig PDA]
end
subgraph "Position Level"
MeteoraDLMMPosition[Meteora DLMM Position]
end
subgraph "User Level"
UserPosition[UserPosition PDA]
end
GlobalConfig -->|references| StrategyConfig
StrategyConfig -->|has many| MeteoraDLMMPosition
UserPosition -->|references| StrategyConfig
classDef protocol fill:#f9f,stroke:#333,stroke-width:2px;
classDef strategy fill:#bbf,stroke:#333,stroke-width:2px;
classDef position fill:#fbb,stroke:#333,stroke-width:2px;
classDef user fill:#ffb,stroke:#333,stroke-width:2px;
class GlobalConfig protocol;
class StrategyConfig strategy;
class MeteoraDLMMPosition position;
class UserPosition user;
```

## PDA Derivation
```mermaid
graph LR
subgraph "PDA Seeds"
GlobalConfigSeed["global_config"]
StrategyConfigSeed["strategy_config", owner]
UserPositionSeed["user_position", user_pubkey, strategy_pubkey]
end
GlobalConfigSeed -->|derives| GlobalConfig
StrategyConfigSeed -->|derives| StrategyConfig
UserPositionSeed -->|derives| UserPosition
```

## User Flows

### Deposit Flow
```mermaid
sequenceDiagram
participant User
participant Protocol
participant Strategy as Strategy Vaults
participant UserPosition
User->>Protocol: Deposit(strategy, amount_x, amount_y)
Protocol->>UserPosition: Check if exists
alt UserPosition doesn't exist
Protocol->>UserPosition: Create new UserPosition PDA with current share value
else UserPosition exists
Protocol->>Protocol: Calculate current share value
Protocol->>Protocol: Check if performance fee is due
alt Current share value > last share value
Protocol->>Protocol: Calculate performance fee
Protocol->>Strategy: Add fee shares to fee_shares_pending
end
end
Protocol->>Strategy: Calculate shares based on current value
Protocol->>Strategy: Transfer tokens to strategy vaults
Protocol->>UserPosition: Update user's shares and last_share_value
Protocol->>Strategy: Update total strategy shares
Protocol->>User: Return success
```

### Withdraw Flow
```mermaid
sequenceDiagram
participant User
participant Protocol
participant Strategy as Strategy Vaults
participant UserPosition
participant Treasury
User->>Protocol: Withdraw(strategy, shares_amount)
Protocol->>Protocol: Calculate current share value
Protocol->>Protocol: Check if performance fee is due
alt Current share value > last share value
Protocol->>Protocol: Calculate performance fee
Protocol->>Strategy: Add fee shares to fee_shares_pending
end
Protocol->>Strategy: Calculate token amounts based on shares
alt Withdrawal fee enabled
Protocol->>Strategy: Calculate and deduct withdrawal fee
Protocol->>Treasury: Transfer withdrawal fee
end
Protocol->>Strategy: Transfer tokens to user
Protocol->>UserPosition: Update user's shares and last_share_value
Protocol->>Strategy: Update total strategy shares
alt User fully withdrawn
Protocol->>UserPosition: Close UserPosition PDA
end
Protocol->>User: Return success
```

## Admin Flows

### Position Management Flow

```mermaid
sequenceDiagram
participant Admin
participant Protocol
participant Strategy as Strategy Vaults
participant MeteoraDLMM as Meteora DLMM
Admin->>Protocol: ManagePosition(strategy, position, action)
alt Action is AddLiquidity
Protocol->>MeteoraDLMM: AddLiquidityByWeight CPI
Protocol->>Strategy: Update vault balances after adding liquidity
Protocol->>Strategy: Add position to positions array if new
else Action is RemoveLiquidity
Protocol->>MeteoraDLMM: RemoveLiquidity CPI
Protocol->>Strategy: Update vault balances with removed liquidity
else Action is ClaimFee
Protocol->>MeteoraDLMM: ClaimFee CPI
Protocol->>Strategy: Update vault balances with claimed fees
else Action is ClosePosition
Protocol->>MeteoraDLMM: ClaimFee CPI
Protocol->>Strategy: Update vault balances with claimed fees
Protocol->>MeteoraDLMM: RemoveAllLiquidity CPI
Protocol->>Strategy: Update vault balances with removed liquidity
Protocol->>MeteoraDLMM: ClosePosition CPI
Protocol->>Strategy: Remove position from positions array
end
Protocol->>Admin: Return success
```

### Fee Claiming Flow
```mermaid
sequenceDiagram
participant Admin
participant Protocol
participant Strategy as Strategy Vaults
participant Treasury
Admin->>Protocol: ClaimFees(strategy, optional_shares_amount)
alt No shares specified
Protocol->>Protocol: Use all pending fee shares
else Shares specified
Protocol->>Protocol: Validate shares amount <= pending fee shares
end
Protocol->>Protocol: Calculate token amounts based on shares
Protocol->>Strategy: Transfer tokens to treasury
Protocol->>Strategy: Reduce fee_shares_pending
Protocol->>Strategy: Reduce total strategy shares
Protocol->>Protocol: Emit FeesClaimed event
Protocol->>Admin: Return success
```

### Performance Fee Collection Process
```mermaid
sequenceDiagram
participant User
participant Protocol
participant Strategy as Strategy Vaults
participant Admin
participant Treasury

Note over User,Protocol: Phase 1: Fee Accrual (During User Operations)
User->>Protocol: Deposit/Withdraw
Protocol->>Protocol: Calculate current share value
alt Current share value > user's last share value
Protocol->>Protocol: Calculate performance gain
Protocol->>Protocol: Calculate fee shares
Protocol->>Strategy: Add fee shares to fee_shares_pending
Protocol->>Protocol: Reduce user's effective shares
end
Protocol->>User: Complete operation

Note over Admin,Treasury: Phase 2: Fee Claiming (Admin Operation)
Admin->>Protocol: ClaimFees(strategy, optional_amount)
Protocol->>Protocol: Calculate token amounts from shares
Protocol->>Strategy: Transfer tokens to treasury
Protocol->>Strategy: Reduce fee_shares_pending
Protocol->>Strategy: Reduce total strategy shares
Protocol->>Admin: Return success
```

## Create Position Flow
```mermaid
sequenceDiagram
participant Admin
participant Protocol
participant Strategy as Strategy Vaults
participant MeteoraDLMM as Meteora DLMM
Admin->>Protocol: CreatePosition(strategy, lb_pair, lower_bin, upper_bin)
Protocol->>MeteoraDLMM: CreatePosition CPI
Protocol->>MeteoraDLMM: AddLiquidityByWeight CPI
Protocol->>Strategy: Update vault balances
Protocol->>Strategy: Add position to positions array
Protocol->>Strategy: Increment position_count
Protocol->>Admin: Return success
```