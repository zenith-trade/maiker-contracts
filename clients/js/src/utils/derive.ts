import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID as maikerProgramId } from '../generated-maiker/programId';

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

/**
 * PDA constants for seeding
 */
export const PDA_SEEDS = {
    GLOBAL_CONFIG: "global-config",
    STRATEGY_CONFIG: "strategy-config",
    USER_POSITION: "user-position",
    PENDING_WITHDRAWAL: "pending-withdrawal",
    M_TOKEN_MINT: "m-token",
    M_TOKEN_METADATA: "metadata",
};

/**
 * Derives the global config PDA
 */
export function deriveGlobalConfig(): PublicKey {
    const [globalConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(PDA_SEEDS.GLOBAL_CONFIG)],
        maikerProgramId
    );
    return globalConfig;
}

/**
 * Derives the strategy config PDA for a creator
 */
export function deriveStrategy(creator: PublicKey): PublicKey {
    const [strategy] = PublicKey.findProgramAddressSync(
        [Buffer.from(PDA_SEEDS.STRATEGY_CONFIG), creator.toBuffer()],
        maikerProgramId
    );
    return strategy;
}

/**
 * Derives a user position PDA
 */
export function deriveUserPosition(
    user: PublicKey,
    strategy: PublicKey
): PublicKey {
    const [userPosition] = PublicKey.findProgramAddressSync(
        [Buffer.from(PDA_SEEDS.USER_POSITION), user.toBuffer(), strategy.toBuffer()],
        maikerProgramId
    );
    return userPosition;
}

/**
 * Derives a pending withdrawal PDA
 */
export function derivePendingWithdrawal(
    user: PublicKey,
    strategy: PublicKey
): PublicKey {
    const [pendingWithdrawal] = PublicKey.findProgramAddressSync(
        [Buffer.from(PDA_SEEDS.PENDING_WITHDRAWAL), user.toBuffer(), strategy.toBuffer()],
        maikerProgramId
    );
    return pendingWithdrawal;
}

export function deriveMTokenMint(strategy: PublicKey): PublicKey {
    const [mTokenMint] = PublicKey.findProgramAddressSync(
        [Buffer.from(PDA_SEEDS.M_TOKEN_MINT), strategy.toBuffer()],
        maikerProgramId
    );
    return mTokenMint;
}

export function deriveMTokenMetadata(mTokenMint: PublicKey): PublicKey {
    const [mTokenMetadata] = PublicKey.findProgramAddressSync(
        [Buffer.from(PDA_SEEDS.M_TOKEN_METADATA),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
             mTokenMint.toBuffer()
            ],
        TOKEN_METADATA_PROGRAM_ID
    );
    return mTokenMetadata;
}