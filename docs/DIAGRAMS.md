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

## Position Value Update Flow

The following diagram illustrates the client-side flow for updating position values before deposits or withdrawals:

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Blockchain
    participant Strategy
    participant Position1
    participant Position2

    User->>Client: Initiate deposit/withdraw
    
    Note over Client: Check if position values need updating
    
    Client->>Blockchain: get_position_value(Position1)
    Blockchain->>Strategy: Update position_values[0]
    Blockchain->>Strategy: Update last_position_update[0]
    Blockchain-->>Client: Success
    
    Client->>Blockchain: get_position_value(Position2)
    Blockchain->>Strategy: Update position_values[1]
    Blockchain->>Strategy: Update last_position_update[1]
    Blockchain-->>Client: Success
    
    Note over Client: All positions updated in current slot
    
    Client->>Blockchain: deposit/withdraw
    Blockchain->>Strategy: Validate all position updates
    Note over Strategy: Check all last_position_update values
    Blockchain->>Strategy: Process deposit/withdraw
    Blockchain-->>Client: Success
    Client-->>User: Deposit/withdraw completed
```

### Client-Side Implementation Notes

1. **Position Value Update Process**:
   - Before initiating a deposit or withdrawal, the client must ensure all positions have up-to-date values
   - The client should call `get_position_value` for each position in the strategy
   - All these calls should be made within the same transaction as the deposit/withdraw instruction

2. **Transaction Building**:
   - Build a transaction with multiple instructions:
     - One `get_position_value` instruction for each position
     - The final deposit or withdraw instruction
   - This ensures all updates happen atomically with the deposit/withdraw

3. **Error Handling**:
   - If any position value update fails, the entire transaction will fail
   - If the deposit/withdraw validation fails due to stale values, the client should retry the entire process

4. **Optimization**:
   - For strategies with many positions, the client may need to batch updates across multiple transactions
   - In this case, the deposit/withdraw should be in the final transaction after all updates are complete

This design ensures that all position values are fresh when deposits or withdrawals occur, maintaining fair value calculations for all users.