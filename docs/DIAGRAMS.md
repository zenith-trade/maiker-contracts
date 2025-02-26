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
PerformanceMetrics[PerformanceMetrics PDA]
end
subgraph "LB Pair Level"
LBPairConfig[LBPairConfig PDA]
end
subgraph "Position Level"
PositionTracker[PositionTracker PDA]
MeteoraDLMMPosition[Meteora DLMM Position]
end
subgraph "User Level"
UserPosition[UserPosition PDA]
end
GlobalConfig -->|references| StrategyConfig
StrategyConfig -->|has many| LBPairConfig
StrategyConfig -->|tracked by| PerformanceMetrics
LBPairConfig -->|has many| PositionTracker
PositionTracker -->|tracks| MeteoraDLMMPosition
UserPosition -->|references| StrategyConfig
classDef protocol fill:#f9f,stroke:#333,stroke-width:2px;
classDef strategy fill:#bbf,stroke:#333,stroke-width:2px;
classDef lbpair fill:#bfb,stroke:#333,stroke-width:2px;
classDef position fill:#fbb,stroke:#333,stroke-width:2px;
classDef user fill:#ffb,stroke:#333,stroke-width:2px;
class GlobalConfig protocol;
class StrategyConfig,PerformanceMetrics strategy;
class LBPairConfig lbpair;
class PositionTracker,MeteoraDLMMPosition position;
class UserPosition user;
```

## PDA Derivation
```mermaid
graph LR
subgraph "PDA Seeds"
GlobalConfigSeed["global_config"]
StrategyConfigSeed["strategy_config", owner]
PerformanceMetricsSeed["performance_metrics", strategy_pubkey]
LBPairConfigSeed["lb_pair_config", strategy_pubkey, lb_pair_pubkey]
PositionTrackerSeed["position_tracker", strategy_pubkey, lb_pair_config_pubkey, position_pubkey]
UserPositionSeed["user_position", user_pubkey, strategy_pubkey]
end
GlobalConfigSeed -->|derives| GlobalConfig
StrategyConfigSeed -->|derives| StrategyConfig
PerformanceMetricsSeed -->|derives| PerformanceMetrics
LBPairConfigSeed -->|derives| LBPairConfig
PositionTrackerSeed -->|derives| PositionTracker
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
Protocol->>UserPosition: Create new UserPosition PDA
end
Protocol->>Strategy: Calculate shares based on current value
Protocol->>Strategy: Transfer tokens to strategy vaults
Protocol->>UserPosition: Update user's shares
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
participant PerformanceMetrics
User->>Protocol: Withdraw(strategy, shares_amount)
Protocol->>PerformanceMetrics: Collect any pending performance fees
Protocol->>Strategy: Calculate token amounts based on shares
alt Withdrawal fee enabled
Protocol->>Strategy: Calculate and deduct withdrawal fee
Protocol->>Treasury: Transfer withdrawal fee
end
Protocol->>Strategy: Transfer tokens to user
Protocol->>UserPosition: Update user's shares
Protocol->>Strategy: Update total strategy shares
alt User fully withdrawn
Protocol->>UserPosition: Close UserPosition PDA
end
Protocol->>User: Return success
```

## Admin Flows

### Rebalance Flow (Same Position)

```mermaid
sequenceDiagram
participant Admin
participant Protocol
participant Strategy as Strategy Vaults
participant PositionTracker
participant MeteoraDLMM as Meteora DLMM
Admin->>Protocol: Rebalance(strategy, lb_pair, position)
Protocol->>PositionTracker: Get position details
Protocol->>MeteoraDLMM: ClaimFee CPI
Protocol->>Strategy: Update vault balances with claimed fees
Protocol->>MeteoraDLMM: RemoveAllLiquidity CPI
Protocol->>Strategy: Update vault balances with removed liquidity
Protocol->>MeteoraDLMM: AddLiquidityByWeight CPI
Protocol->>Strategy: Update vault balances after adding liquidity
Protocol->>PositionTracker: Update position details
Protocol->>Admin: Return success
```

### Rebalance Flow (New Position)
```mermaid
sequenceDiagram
participant Admin
participant Protocol
participant Strategy as Strategy Vaults
participant LBPairConfig
participant OldPositionTracker
participant NewPositionTracker
participant MeteoraDLMM as Meteora DLMM
Admin->>Protocol: RebalanceNewPosition(strategy, lb_pair, old_position, new_lower_bin, new_upper_bin)
Protocol->>OldPositionTracker: Get old position details
Protocol->>MeteoraDLMM: ClaimFee CPI for old position
Protocol->>Strategy: Update vault balances with claimed fees
Protocol->>MeteoraDLMM: RemoveAllLiquidity CPI for old position
Protocol->>Strategy: Update vault balances with removed liquidity
Protocol->>MeteoraDLMM: ClosePosition CPI for old position
Protocol->>OldPositionTracker: Mark as closed
Protocol->>MeteoraDLMM: CreatePosition CPI with new bin range
Protocol->>NewPositionTracker: Create new position tracker
Protocol->>MeteoraDLMM: AddLiquidityByWeight CPI to new position
Protocol->>Strategy: Update vault balances after adding liquidity
Protocol->>LBPairConfig: Update active positions count
Protocol->>Admin: Return success
```

### Performance Fee Collection Flow
```mermaid
sequenceDiagram
participant Admin
participant Protocol
participant Strategy as Strategy Vaults
participant PerformanceMetrics
participant Treasury
Admin->>Protocol: CollectPerformanceFees(strategy)
Protocol->>Strategy: Get current vault balances
Protocol->>PerformanceMetrics: Get high water mark
Protocol->>Protocol: Calculate current value per share
alt Current value > high water mark
Protocol->>Protocol: Calculate performance gain
Protocol->>Protocol: Calculate fee amount
Protocol->>Strategy: Transfer fee to treasury
Protocol->>PerformanceMetrics: Update high water mark
Protocol->>PerformanceMetrics: Update fee collection stats
else Current value <= high water mark
Protocol->>Admin: No fees to collect
end
Protocol->>Admin: Return success
```

## Multi-Position Management Flows

### Add New LB Pair to Strategy
```mermaid
sequenceDiagram
participant Admin
participant Protocol
participant StrategyConfig
participant LBPairConfig
Admin->>Protocol: AddLBPair(strategy, lb_pair, weight, max_positions)
Protocol->>StrategyConfig: Check if under max_lb_pairs limit
Protocol->>LBPairConfig: Create new LBPairConfig PDA
Protocol->>StrategyConfig: Increment active_lb_pairs_count
Protocol->>Admin: Return success
```

### Create Position in LB Pair
```mermaid
sequenceDiagram
participant Admin
participant Protocol
participant Strategy as Strategy Vaults
participant LBPairConfig
participant PositionTracker
participant MeteoraDLMM as Meteora DLMM
Admin->>Protocol: CreatePosition(strategy, lb_pair, lower_bin, upper_bin)
Protocol->>LBPairConfig: Check if under max_positions limit
Protocol->>MeteoraDLMM: CreatePosition CPI
Protocol->>PositionTracker: Create new PositionTracker PDA
Protocol->>MeteoraDLMM: AddLiquidityByWeight CPI
Protocol->>Strategy: Update vault balances
Protocol->>LBPairConfig: Increment active_positions_count
Protocol->>Admin: Return success
```