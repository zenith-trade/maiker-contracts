import { Connection, PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { deriveGlobalConfig, deriveStrategy, maikerInstructions, MaikerSDK } from '../../clients/js/src';

/**
 * Create initialize global config instruction
 */
export function createInitializeGlobalConfigInstruction(
    admin: PublicKey,
    treasury: PublicKey,
    performanceFeeBps: number,
    withdrawalFeeBps: number,
    intervalSeconds: BN
): TransactionInstruction {
    const globalConfig = deriveGlobalConfig();

    return maikerInstructions.initialize(
        {
            globalConfigArgs: {
                performanceFeeBps,
                withdrawalFeeBps,
                intervalSeconds,
                treasury,
                newAdmin: null,
            },
        },
        {
            admin,
            globalConfig,
            systemProgram: SystemProgram.programId,
        }
    );
}

/**
 * Create update global config instruction
 */
export function createUpdateGlobalConfigInstruction(
    authority: PublicKey,
    treasury: PublicKey,
    performanceFeeBps: number,
    withdrawalFeeBps: number,
    intervalSeconds: BN,
    newAdmin?: PublicKey
): TransactionInstruction {
    const globalConfig = deriveGlobalConfig();

    return maikerInstructions.updateGlobalConfig(
        {
            globalConfigArgs: {
                performanceFeeBps,
                withdrawalFeeBps,
                intervalSeconds,
                treasury,
                newAdmin: newAdmin || null,
            },
        },
        {
            authority,
            globalConfig,
        }
    );
}