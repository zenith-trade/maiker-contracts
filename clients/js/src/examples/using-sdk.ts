import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { MaikerSDK } from '../maiker';
import { simulateAndGetTxWithCUs } from '../utils/buildTxAndCheckCu';

async function main() {
  // Set up connection
  const connection = new Connection('https://api.mainnet-beta.solana.com');

  // Example keypairs (in practice, these would come from a wallet)
  const user = Keypair.generate();
  const admin = Keypair.generate();

  // Strategy address (replace with actual address)
  const strategyAddress = new PublicKey('27mwfhSgaW1BDyYHcnfRnthvrCUZefXnwawH2YYbx2xx');

  // Initialize SDK
  console.log('Initializing SDK...');
  const strategy = await MaikerSDK.create(connection, strategyAddress);

  // Example: Get strategy value
  console.log('Getting strategy value...');
  const value = await strategy.getStrategyValue();
  console.log('Strategy value:', value);

  // Example: Get user position
  console.log('Getting user position...');
  const userPosition = await strategy.getUserPosition(user.publicKey);
  console.log('User position:', userPosition);

  // Example: Get pending withdrawals
  console.log('Getting pending withdrawals...');
  const pendingWithdrawals = await strategy.getPendingWithdrawals();
  console.log('Pending withdrawals:', pendingWithdrawals);

  // Example: Get pending withdrawals by window
  console.log('Getting pending withdrawals by window...');
  const withdrawalWindows = await strategy.getPendingWithdrawalsByWindow();
  console.log('Withdrawal windows:', withdrawalWindows);

  // Example: Create deposit instruction
  console.log('Creating deposit instruction...');
  const depositAmount = new BN(1000000); // 1 token with 6 decimals
  const depositIx = await strategy.createDepositInstruction({
    user: user.publicKey,
    amount: depositAmount
  });

  // Example: Create initialize position instruction
  console.log('Creating initialize position instruction...');
  const position = Keypair.generate();
  const initPositionIx = strategy.createInitializePositionInstruction({
    authority: admin.publicKey,
    position: position.publicKey,
    lowerBinId: 5000,
    width: 70
  });

  // Example: Create add liquidity instruction
  console.log('Creating add liquidity instruction...');
  try {
    const { instruction, preInstructions } = await strategy.createAddLiquidityInstruction({
      authority: admin.publicKey,
      position: position.publicKey,
      totalXAmount: new BN(1000000),
      totalYAmount: new BN(1000000),
      distributionType: 'spot'
    });

    // Combine instructions and build transaction
    const blockhash = await connection.getLatestBlockhash();
    const tx = await simulateAndGetTxWithCUs({
      connection,
      payerPublicKey: admin.publicKey,
      lookupTableAccounts: [],
      ixs: [...preInstructions, instruction],
      recentBlockhash: blockhash.blockhash
    });

    console.log('Transaction built successfully');
  } catch (e) {
    console.error('Failed to create add liquidity instruction:', e);
  }

  // Example: Create initiate withdrawal instruction
  console.log('Creating initiate withdrawal instruction...');
  const withdrawIx = await strategy.createInitiateWithdrawalInstruction({
    user: user.publicKey,
    sharesAmount: new BN(500000) // 50% of deposit
  });

  // Example: Create process withdrawal instruction
  console.log('Creating process withdrawal instruction...');
  const processWithdrawIx = await strategy.createProcessWithdrawalInstruction({
    user: user.publicKey
  });

  console.log('SDK examples complete');
}

// Run the example
main().catch(error => {
  console.error('Error in example:', error);
});