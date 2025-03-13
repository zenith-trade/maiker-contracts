import { Command } from 'commander';
import { PublicKey, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getConnection, loadKeypairFromFile, CliCommandOptions, parseBN } from '../utils';
import { createInitializeGlobalConfigInstruction } from '../utils/maikerSdk';
import { deriveGlobalConfig, simulateAndGetTxWithCUs } from '../../clients/js/src';

interface InitGlobalConfigOptions extends CliCommandOptions {
    performanceFeeBps: string;
    withdrawalFeeBps: string;
    intervalSeconds: string;
}

export function initGlobalConfigCommand(program: Command): void {
    program
        .command('init-global-config')
        .description('Initialize the Maiker global configuration')
        .requiredOption('--performance-fee-bps <bps>', 'Performance fee in basis points (e.g., 2000 = 20%)')
        .requiredOption('--withdrawal-fee-bps <bps>', 'Withdrawal fee in basis points (e.g., 100 = 1%)')
        .requiredOption('--interval-seconds <seconds>', 'Withdrawal interval in seconds')
        .action(async (cmdOptions: InitGlobalConfigOptions) => {
            try {
                console.log('Initializing Maiker global configuration...');

                const options = program.opts();

                // Parse options
                const connection = getConnection(options.rpc);
                const admin = loadKeypairFromFile(options.keypair);
                const performanceFeeBps = parseInt(cmdOptions.performanceFeeBps);
                const withdrawalFeeBps = parseInt(cmdOptions.withdrawalFeeBps);
                const intervalSeconds = parseBN(cmdOptions.intervalSeconds);

                // Validate inputs
                if (performanceFeeBps < 0 || performanceFeeBps > 10000) {
                    throw new Error('Performance fee must be between 0 and 10000 bps (0-100%)');
                }

                if (withdrawalFeeBps < 0 || withdrawalFeeBps > 10000) {
                    throw new Error('Withdrawal fee must be between 0 and 10000 bps (0-100%)');
                }

                // Derive global config address
                const globalConfig = deriveGlobalConfig();

                console.log(`Global Config PDA: ${globalConfig.toBase58()}`);
                console.log(`Admin: ${admin.publicKey.toBase58()}`);
                console.log(`Performance Fee: ${performanceFeeBps / 100}%`);
                console.log(`Withdrawal Fee: ${withdrawalFeeBps / 100}%`);
                console.log(`Interval: ${intervalSeconds.toString()} seconds`);

                // Create the instruction
                const initializeIx = createInitializeGlobalConfigInstruction(
                    admin.publicKey,
                    admin.publicKey,
                    performanceFeeBps,
                    withdrawalFeeBps,
                    intervalSeconds
                );

                const blockhash = await connection.getLatestBlockhash();

                // Create and sign transaction
                const builtTx = await simulateAndGetTxWithCUs({
                    connection: connection,
                    payerPublicKey: admin.publicKey,
                    lookupTableAccounts: [],
                    ixs: [initializeIx],
                    recentBlockhash: blockhash.blockhash,
                });

                // Sign the transaction
                builtTx.tx.sign([admin]);
                const rawTransaction = builtTx.tx.serialize();

                // Send transaction
                const signature = await connection.sendRawTransaction(rawTransaction);

                console.log('Transaction sent. Waiting for confirmation...');
                await connection.confirmTransaction({
                    signature,
                    ...blockhash
                }, 'confirmed');

                console.log('Global config initialized successfully!');
                console.log(`Transaction signature: ${signature}`);
            } catch (error) {
                console.error('Error initializing global config:', error);
                process.exit(1);
            }
        });
} 