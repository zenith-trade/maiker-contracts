# Maiker JavaScript SDK

This SDK provides a convenient interface for interacting with Maiker strategies on Solana. It wraps the core Maiker program functionality in an easy-to-use class-based API.

## Overview

The SDK is built around the `MaikerSDK` class which represents a single strategy. The class provides methods for:

- Creating new strategies
- Depositing funds
- Initiating withdrawals 
- Processing withdrawals
- Fetching strategy and user position data
- Managing liquidity positions

Most of the underlying functionality leverages the DLMM SDK directly to avoid code duplication, particularly for:

- Position management
- Liquidity calculations
- Price calculations
- Common utilities

## Custom Implementations

While we aim to reuse DLMM SDK code where possible, there are two key functions that needed custom implementation to support testing with Bankrun:

1. `getOrCreateATAInstruction` - Custom implementation to properly handle token account creation errors in Bankrun environment

2. `chunkedGetMultipleAccountInfos` - Custom implementation to fetch multiple accounts in chunks that works with Bankrun's connection proxy

These implementations maintain the same interface as their DLMM counterparts but handle Bankrun-specific error cases.

## Installation

```bash
npm install @builderz/maiker-sdk
```

## Usage

### Initializing the SDK

The SDK is designed around a singleton instance per strategy. You can create a new instance for an existing strategy:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { MaikerSDK } from '@zth/maiker-sdk';

// Initialize connection
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Strategy public key
const strategyPubkey = new PublicKey('your_strategy_address');

// Create SDK instance
const maikerSdk = await MaikerSDK.create(connection, strategyPubkey);

// Access strategy data
console.log('Strategy data:', maikerSdk.strategyAcc);
```

### Creating a New Strategy

To create a new strategy:

```typescript
import { MaikerSDK } from '@zth/maiker-sdk';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';

// Initialize connection
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Creator wallet (will be the strategy owner)
const creator = Keypair.generate(); // or load from elsewhere

// Token mints for the strategy
const xMint = new PublicKey('your_x_token_mint');
const yMint = new PublicKey('your_y_token_mint');

// Get create strategy instructions
const createStrategyIxs = await MaikerSDK.createStrategy(
  connection,
  {
    creator: creator.publicKey,
    xMint: xMint,
    yMint: yMint
  }
);

// Create transaction
const transaction = new Transaction();
transaction.add(...createStrategyIxs);

// Send transaction
const txid = await sendAndConfirmTransaction(
  connection,
  transaction,
  [creator]
);

console.log('Strategy created:', txid);

// Derive strategy address
const strategy = deriveStrategy(creator.publicKey);

// Create SDK instance for the new strategy
const maikerSdk = await MaikerSDK.create(connection, strategy);
```

### Refreshing Strategy Data

The SDK maintains local state data that can be refreshed to get the latest on-chain data:

```typescript
// Refresh all strategy data (account data, positions, etc.)
await maikerSdk.refresh();

// Access updated data
console.log('Updated strategy data:', maikerSdk.strategyAcc);
```

The `refresh()` method will:
1. Fetch updated strategy account data
2. Fetch all position data for the strategy
3. Update internal maps and caches

This is particularly important to call after any state-changing transactions to ensure the SDK has the latest data.

### Managing Positions

#### Fetching Position Data

The SDK automatically fetches position data when refreshed, but you can also access it directly:

```typescript
// Get all positions (returns after fetching if needed)
const positions = await maikerSdk.getPositions();

// Access position data
positions.forEach(position => {
  console.log(`Position ${position.pubkey.toBase58()}:`);
  console.log(`- X Amount: ${position.positionData.totalXAmount}`);
  console.log(`- Y Amount: ${position.positionData.totalYAmount}`);
});
```

#### Creating and Adding Positions

To create a new position and add liquidity:

```typescript
import { BN } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { calculateSpotDistribution } from '@meteora-ag/dlmm';

// Generate new position keypair
const newPosition = Keypair.generate();

// Get LB pair info
const lbPairAcc = await dlmm.lbPair.fetch(connection, lbPairPubkey);
const activeBin = lbPairAcc.activeId;

// Define position parameters
const lowerBinId = activeBin - 35; // Center around active bin
const upperBinId = lowerBinId + 70;

// Initialize position
const initPositionIx = maikerSdk.createInitializePositionInstruction({
  lbPair: lbPairPubkey,
  position: newPosition.publicKey,
  authority: authorityWallet.publicKey,
  lowerBinId: lowerBinId,
  width: 70,
});

// Create transaction with position initialization
const tx = new Transaction().add(initPositionIx);
tx.sign(authorityWallet, newPosition); // Position keypair must sign
await sendAndConfirmTransaction(connection, tx, [authorityWallet, newPosition]);

// Prepare liquidity distribution
const binIds = Array.from(
  { length: upperBinId - lowerBinId + 1 },
  (_, i) => lowerBinId + i
);

// Calculate distribution (spot, bid-ask, or normal distribution)
const distribution = calculateSpotDistribution(activeBin, binIds);

// Add liquidity
const totalXAmount = new BN(1000_000_000); // 1000 tokens
const totalYAmount = new BN(1000_000_000); // 1000 tokens

const { instruction: addLiquidityIx, preInstructions } = await maikerSdk.createAddLiquidityInstruction({
  authority: authorityWallet.publicKey,
  position: newPosition.publicKey,
  lbPair: lbPairPubkey,
  totalXAmount,
  totalYAmount,
  binDistribution: distribution,
  lbPairAcc
});

// Create and send transaction
const addLiquidityTx = new Transaction();
if (preInstructions.length > 0) {
  addLiquidityTx.add(...preInstructions);
}
addLiquidityTx.add(addLiquidityIx);

await sendAndConfirmTransaction(connection, addLiquidityTx, [authorityWallet]);

// Refresh SDK to get updated position data
await maikerSdk.refresh();
```

#### Removing Liquidity and Closing Positions

To remove liquidity and close a position:

```typescript
// Get position
const position = maikerSdk.strategyAcc.positions[0];

// Create claim fees instruction
const claimFeeIx = maikerSdk.createMeteoraClaimFeesInstruction({
  authority: authorityWallet.publicKey,
  lbPair: positionInfo.lbPair,
  position: position,
});

// Create remove liquidity instruction
const removeLiquidityIx = maikerSdk.createRemoveLiquidityInstruction({
  authority: authorityWallet.publicKey,
  position: position,
});

// Create close position instruction
const closePositionIx = maikerSdk.createClosePositionInstruction({
  authority: authorityWallet.publicKey,
  position: position,
});

// Combine into a single transaction
const tx = new Transaction()
  .add(claimFeeIx)
  .add(removeLiquidityIx)
  .add(closePositionIx);

await sendAndConfirmTransaction(connection, tx, [authorityWallet]);

// Refresh SDK to get updated position data
await maikerSdk.refresh();
```

### User Operations

#### Depositing

To deposit into a strategy:

```typescript
// Amount to deposit (in base units)
const depositAmount = 1000_000_000; // 1000 tokens

// Create deposit instruction
const depositIxs = await maikerSdk.createDepositInstruction({
  user: userWallet.publicKey,
  amount: depositAmount
});

// Create and send transaction
const tx = new Transaction().add(...depositIxs);
await sendAndConfirmTransaction(connection, tx, [userWallet]);

// Refresh and get updated user position
await maikerSdk.refresh();
const userPosition = await maikerSdk.getUserPosition(userWallet.publicKey);
console.log('User position after deposit:', userPosition);
```

#### Initiating Withdrawal

Withdrawals in Maiker follow a two-step process. First, initiate the withdrawal:

```typescript
// Amount of shares to withdraw
const sharesAmount = 100_000_000; // 100 shares

// Create withdrawal initiation instruction
const withdrawIx = await maikerSdk.createInitiateWithdrawalInstruction({
  user: userWallet.publicKey,
  sharesAmount: sharesAmount
});

// Create and send transaction
const tx = new Transaction().add(withdrawIx);
await sendAndConfirmTransaction(connection, tx, [userWallet]);

// Get pending withdrawal info
const pendingWithdrawals = await maikerSdk.getPendingWithdrawals();
console.log('Pending withdrawals:', pendingWithdrawals);
```

#### Processing Withdrawal

After the withdrawal time lock has passed, process the withdrawal:

```typescript
// Create process withdrawal instruction
const claimIxs = await maikerSdk.createProcessWithdrawalInstruction({
  user: userWallet.publicKey
});

// Create and send transaction
const tx = new Transaction().add(...claimIxs);
await sendAndConfirmTransaction(connection, tx, [userWallet]);

// Refresh SDK
await maikerSdk.refresh();
```

### Getting Strategy Value and Share Calculations

```typescript
// Get strategy value
const strategyValue = await maikerSdk.getStrategyValue();
console.log('Total strategy value:', strategyValue.totalValue);
console.log('Position values:', strategyValue.positionValues);

// Calculate share value
const shareValue = maikerSdk.calculateShareValue(strategyValue.totalValue);
console.log('Current share value:', shareValue);

// Calculate shares for a deposit amount
const depositAmount = 1000_000_000; // 1000 tokens
const newShares = maikerSdk.calculateSharesForDeposit(depositAmount, shareValue);
console.log('Shares for deposit:', newShares);

// Calculate withdrawal amount for shares
const sharesAmount = 100_000_000; // 100 shares
const withdrawalAmount = maikerSdk.calculateWithdrawalAmount(sharesAmount, shareValue);
console.log('Withdrawal amount for shares:', withdrawalAmount);
```

### Administrative Functions

For strategy creators and administrators:

```typescript
// Get position value instructions (required before deposits if values outdated)
const { getPositionValueIxs, preInstructions } = await maikerSdk.createPositionValueInstructions({
  user: userWallet.publicKey,
});

// Create and send transaction
const posValTx = new Transaction();
if (preInstructions.length > 0) {
  posValTx.add(...preInstructions);
}
posValTx.add(...getPositionValueIxs);
await sendAndConfirmTransaction(connection, posValTx, [adminWallet]);

// Swap tokens within the strategy
const swapIx = maikerSdk.createSwapInstruction({
  authority: adminWallet.publicKey,
  lbPair: lbPairPubkey,
  lbPairAcc,
  amountIn: new BN(100_000_000), // 100 tokens
  minAmountOut: new BN(0),
  xToY: true, // swap X for Y
  activeBin: lbPairAcc.activeId,
});

// Create and send transaction
const swapTx = new Transaction().add(swapIx);
await sendAndConfirmTransaction(connection, swapTx, [adminWallet]);
```

## Common Flows

### Strategy Creation and Setup Flow

1. **Create Strategy**
   - Use `MaikerSDK.createStrategy()` to get creation instructions
   - Send transaction to create the strategy

2. **Initialize Position**
   - Create a new position using `createInitializePositionInstruction()`
   - Sign with position keypair

3. **Add Liquidity**
   - Calculate distribution based on desired strategy
   - Use `createAddLiquidityInstruction()` to add initial liquidity

### User Deposit Flow

1. **Update Position Values** (if needed)
   - If position values are stale, call `createPositionValueInstructions()`
   - Execute transaction to update position values on-chain

2. **Deposit**
   - Use `createDepositInstruction()` to create deposit instructions
   - Execute transaction to deposit funds
   - SDK automatically handles ATAs creation if needed

### Withdrawal Flow

1. **Initiate Withdrawal**
   - Calculate shares to withdraw
   - Call `createInitiateWithdrawalInstruction()` to start withdrawal process
   - This creates a time-locked withdrawal request

2. **Process Withdrawal**
   - After time lock expires (default: 1 hour)
   - Call `createProcessWithdrawalInstruction()` to complete withdrawal
   - Execute transaction to receive tokens

### Rebalancing Flow

1. **Claim Fees**
   - Use `createMeteoraClaimFeesInstruction()` to claim accumulated fees 

2. **Remove Liquidity**
   - Use `createRemoveLiquidityInstruction()` to withdraw from position

3. **Close Position**
   - Use `createClosePositionInstruction()` to close the old position

4. **Create New Position**
   - Use `createInitializePositionInstruction()` to create new position
   - Set optimal range based on current market conditions

5. **Add Liquidity to New Position**
   - Calculate new distribution based on strategy
   - Use `createAddLiquidityInstruction()` to add liquidity to new position

## Error Handling

The SDK includes robust error handling:

```typescript
try {
  await maikerSdk.createDepositInstruction({
    user: userWallet.publicKey,
    amount: depositAmount
  });
} catch (error) {
  if (error.message.includes('stale position values')) {
    // Position values need to be updated first
    const positionValueIxs = await maikerSdk.createPositionValueInstructions({
      user: userWallet.publicKey,
    });
    // Send transaction with position value update instructions
  } else {
    console.error('Deposit error:', error);
  }
}
```

## Data Refresh Best Practices

For optimal performance and accuracy:

1. **Always refresh after state-changing operations**
   ```typescript
   await maikerSdk.refresh();
   ```

2. **Refresh before reading user positions or strategy values**
   ```typescript
   await maikerSdk.refresh();
   const userPosition = await maikerSdk.getUserPosition(userWallet.publicKey);
   ```

3. **Consider periodic refresh for long-running applications**
   ```typescript
   // Set up periodic refresh (every 60 seconds)
   setInterval(async () => {
     await maikerSdk.refresh();
     console.log('SDK data refreshed');
   }, 60 * 1000);
   ```
