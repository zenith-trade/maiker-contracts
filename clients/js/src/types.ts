import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { BinAndAmount, PositionData, TokenReserve } from '@meteora-ag/dlmm';
import * as dlmm from './generated-dlmm/accounts';

/**
 * Strategy context containing key addresses and data
 */
export interface StrategyContext {
  strategy: PublicKey;
  creator: PublicKey;
  xMint: PublicKey;
  yMint: PublicKey;
  xVault: PublicKey;
  yVault: PublicKey;
}

/**
 * Parameters for setting up a new strategy
 */
export interface StrategySetupParams {
  creator: PublicKey;
  xMint: PublicKey;
  yMint: PublicKey;
}

/**
 * Parameters for depositing into a strategy
 */
export interface DepositParams {
  user: PublicKey;
  amount: number | string | BN;
}

/**
 * Parameters for withdrawing from a strategy
 */
export interface WithdrawParams {
  user: PublicKey;
  sharesAmount: number | string | BN;
}

/**
 * Parameters for adding liquidity to a position
 */
export interface PositionLiquidityParams {
  authority: PublicKey;
  position: PublicKey;
  totalXAmount: BN;
  totalYAmount: BN;
  binDistribution: BinAndAmount[];
  lbPair: PublicKey;
  lbPairAcc?: dlmm.lbPair;
}

/**
 * Value of a strategy position
 */
export interface StrategyValue {
  xTokenAmount: number;
  yTokenAmount: number;
  yTokenValueInX: number;
  totalValue: number;
  positionValues: {
    pubkey: string;
    xAmount: number;
    yAmount: number;
    yValueInX: number;
    totalValue: number;
  }[];
}

/**
 * Information about a user's position in a strategy
 */
export interface UserPositionInfo {
  address: PublicKey;
  strategyShare: number;
  shareValue: number;
  lastShareValue: number;
  lastUpdateSlot: number;
  valueInToken: number;
}

/**
 * Information about a pending withdrawal
 */
export interface PendingWithdrawalInfo {
  address: PublicKey;
  owner: PublicKey;
  strategy: PublicKey;
  sharesAmount: number;
  tokenAmount: number;
  initiationTimestamp: number;
  availableTimestamp: number;
  isReady: boolean;
}

/**
 * Grouped pending withdrawals by withdrawal window
 */
export interface WithdrawalWindow {
  timestamp: number;
  withdrawals: PendingWithdrawalInfo[];
  totalShares: number;
  totalTokens: number;
  isReady: boolean;
}

/**
 * Result of a transaction
 */
export interface TransactionResult {
  success: boolean;
  error?: Error;
  txSignature?: string;
  blockhash?: string;
}

/**
 * Information about a position - Slightly adjusted from the original type
 */
export interface PositionInfo {
  pubkey: PublicKey;
  lbPair: PublicKey;
  tokenX: TokenReserve;
  tokenY: TokenReserve;
  positionData: PositionData | null;
}