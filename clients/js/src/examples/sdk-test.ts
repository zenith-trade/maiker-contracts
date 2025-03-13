import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { test } from 'node:test';
import assert from 'assert';
import { simulateAndGetTxWithCUs } from '../utils/buildTxAndCheckCu';
import { MaikerSDK } from '../maiker';

/**
 * This file demonstrates testing the MaikerSDK with the node:test framework
 */
test('MaikerSDK basic functionality', async () => {
  // Set up mock connection
  const connection = {
    getAccountInfo: async () => ({
      data: Buffer.from([]),
      executable: false,
      lamports: 1000000,
      owner: PublicKey.default,
      rentEpoch: 0
    }),
    getProgramAccounts: async () => ([]),
    getTokenAccountBalance: async () => ({
      value: {
        amount: '1000000',
        decimals: 6,
        uiAmount: 1
      }
    }),
    simulateTransaction: async () => ({
      value: {
        logs: [
          'Program log: Position value: 5000000'
        ]
      }
    }),
    getLatestBlockhash: async () => ({
      blockhash: 'mock-blockhash',
      lastValidBlockHeight: 1000
    })
  } as unknown as Connection;

  // Mock strategy address
  const strategyAddress = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy-config"), Keypair.generate().publicKey.toBuffer()],
    new PublicKey('27mwfhSgaW1BDyYHcnfRnthvrCUZefXnwawH2YYbx2xx')
  )[0];

  // Override fetch methods for testing
  const originalFetch = MaikerSDK.create;
  MaikerSDK.create = async () => {
    // Create a mock instance with test data
    const mockSDK = new MaikerSDK(
      connection as any,
      PublicKey.default,
      strategyAddress,
      Keypair.generate().publicKey,
      Keypair.generate().publicKey,
      Keypair.generate().publicKey,
      Keypair.generate().publicKey,
      Keypair.generate().publicKey
    ) as any;

    mockSDK.strategyData = {
      creator: Keypair.generate().publicKey,
      xMint: Keypair.generate().publicKey,
      yMint: Keypair.generate().publicKey,
      xVault: Keypair.generate().publicKey,
      yVault: Keypair.generate().publicKey,
      strategyShares: new BN(1000000),
      feeShares: new BN(0),
      positionCount: 1,
      positions: [Keypair.generate().publicKey]
    };

    mockSDK.globalConfigData = {
      admin: Keypair.generate().publicKey,
      performanceFeeBps: 2000, // 20%
      withdrawalFeeBps: 50, // 0.5%
      treasury: Keypair.generate().publicKey,
      intervalSeconds: new BN(3600) // 1 hour
    };

    mockSDK.lbPair = Keypair.generate().publicKey;

    return mockSDK;
  };

  try {
    // Initialize SDK
    const strategy = await MaikerSDK.create(connection, strategyAddress);

    // Test get strategy value
    const value = await strategy.getStrategyValue();
    assert.strictEqual(typeof value.totalValue, 'number', 'Total value should be a number');
    assert.strictEqual(value.xTokenAmount, 1000000, 'X token amount should be 1000000');
    assert.strictEqual(value.yTokenValueInX, 5000000, 'Y token value should be 5000000');

    // Test user position
    const user = Keypair.generate();
    const depositIx = await strategy.createDepositInstruction({
      user: user.publicKey,
      amount: new BN(1000000)
    });
    assert(depositIx, 'Deposit instruction should be created');

    // Test add liquidity
    const position = Keypair.generate();
    const initPositionIx = strategy.createInitializePositionInstruction({
      authority: Keypair.generate().publicKey,
      position: position.publicKey,
      lowerBinId: 5000,
      width: 70
    });
    assert(initPositionIx, 'Initialize position instruction should be created');

    console.log('SDK test passed successfully');
  } finally {
    // Restore original method
    MaikerSDK.create = originalFetch;
  }
});