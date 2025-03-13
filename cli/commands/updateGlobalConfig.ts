import { Command } from 'commander';
import { PublicKey, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getConnection, loadKeypairFromFile, CliCommandOptions, parseBN } from '../utils';
import { createUpdateGlobalConfigInstruction } from '../utils/maikerSdk';
import { deriveGlobalConfig, simulateAndGetTxWithCUs } from '../../clients/js/src';

interface UpdateGlobalConfigOptions extends CliCommandOptions {
    performanceFeeBps: string;
    withdrawalFeeBps: string;
    intervalSeconds: string;
    treasury: string;
    newAdmin?: string;
}

export function updateGlobalConfigCommand(program: Command): void {
    program
        .command('update-global-config')
        .description('Update the Maiker global configuration')
        .requiredOption('--performance-fee-bps <bps>', 'Performance fee in basis points (e.g., 2000 = 20%)')
        .requiredOption('--withdrawal-fee-bps <bps>', 'Withdrawal fee in basis points (e.g., 100 = 1%)')
        .requiredOption('--interval-seconds <seconds>', 'Withdrawal interval in seconds')
        .requiredOption('--treasury <pubkey>', 'Treasury public key where fees will be sent')
        .option('--new-admin <pubkey>', 'New admin public key (optional)')
        .action(async (cmdOptions: UpdateGlobalConfigOptions) => {
            try {
                console.log('Updating Maiker global configuration...');

                const options = program.opts();

                // Parse options
                const connection = getConnection(options.rpc);
                const authority = loadKeypairFromFile(options.keypair);
                const treasury = new PublicKey(cmdOptions.treasury);
                const performanceFeeBps = parseInt(cmdOptions.performanceFeeBps);
                const withdrawalFeeBps = parseInt(cmdOptions.withdrawalFeeBps);
                const intervalSeconds = parseBN(cmdOptions.intervalSeconds);
                const newAdmin = cmdOptions.newAdmin ? new PublicKey(cmdOptions.newAdmin) : undefined;

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
                console.log(`Authority: ${authority.publicKey.toBase58()}`);
                console.log(`Treasury: ${treasury.toBase58()}`);
                console.log(`Performance Fee: ${performanceFeeBps / 100}%`);
                console.log(`Withdrawal Fee: ${withdrawalFeeBps / 100}%`);
                console.log(`Interval: ${intervalSeconds.toString()} seconds`);
                if (newAdmin) {
                    console.log(`New Admin: ${newAdmin.toBase58()}`);
                }

                // Create the instruction
                const updateGlobalConfigIx = createUpdateGlobalConfigInstruction(
                    authority.publicKey,
                    treasury,
                    performanceFeeBps,
                    withdrawalFeeBps,
                    intervalSeconds,
                    newAdmin
                );

                const blockhash = await connection.getLatestBlockhash();

                // Create and sign transaction
                const builtTx = await simulateAndGetTxWithCUs({
                    connection: connection,
                    payerPublicKey: authority.publicKey,
                    lookupTableAccounts: [],
                    ixs: [updateGlobalConfigIx],
                    recentBlockhash: blockhash.blockhash,
                });

                // Sign the transaction
                builtTx.tx.sign([authority]);
                const rawTransaction = builtTx.tx.serialize();

                // Send transaction
                const signature = await connection.sendRawTransaction(rawTransaction);

                console.log('Transaction sent. Waiting for confirmation...');
                await connection.confirmTransaction({
                    signature,
                    ...blockhash
                }, 'confirmed');

                console.log('Global config updated successfully!');
                console.log(`Transaction signature: ${signature}`);
            } catch (error) {
                console.error('Error updating global config:', error);
                process.exit(1);
            }
        });
} 