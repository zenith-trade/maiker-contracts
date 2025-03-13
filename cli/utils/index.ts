import { Connection, Keypair } from '@solana/web3.js';
import fs from 'fs';
import { BN } from '@coral-xyz/anchor';

/**
 * Load a keypair from file
 */
export function loadKeypairFromFile(path: string): Keypair {
    const fileContent = fs.readFileSync(path, 'utf-8');

    // Handle JSON format
    try {
        const secretKey = Uint8Array.from(JSON.parse(fileContent));
        return Keypair.fromSecretKey(secretKey);
    } catch (e) {
        // If JSON parsing fails, try array format
        try {
            const secretKey = Uint8Array.from(
                fileContent
                    .replace(/[\[\]\s]/g, '')
                    .split(',')
                    .map(number => parseInt(number))
            );
            return Keypair.fromSecretKey(secretKey);
        } catch (e) {
            throw new Error(`Failed to parse keypair from ${path}: ${e}`);
        }
    }
}

/**
 * Create a connection from RPC url
 */
export function getConnection(url: string): Connection {
    return new Connection(url, 'confirmed');
}

/**
 * Format a BN as a human-readable string with a given decimal precision
 */
export function formatBN(value: BN | number, decimals = 0): string {
    if (typeof value === 'number') {
        value = new BN(value);
    }

    const divisor = new BN(10).pow(new BN(decimals));
    const integerPart = value.div(divisor).toString();

    if (decimals === 0) {
        return integerPart;
    }

    const fractionalPart = value.mod(divisor).toString().padStart(decimals, '0');
    return `${integerPart}.${fractionalPart}`;
}

/**
 * Standard options for commands
 */
export interface CliCommandOptions {
    rpc: string;
    keypair: string;
}

/**
 * Convert a string value to BN with optional validation
 */
export function parseBN(value: string, min?: BN, max?: BN): BN {
    const num = new BN(value);

    if (min && num.lt(min)) {
        throw new Error(`Value must be at least ${min.toString()}`);
    }

    if (max && num.gt(max)) {
        throw new Error(`Value must be at most ${max.toString()}`);
    }

    return num;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
} 