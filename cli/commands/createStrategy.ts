import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { getConnection, loadKeypairFromFile, CliCommandOptions } from '../utils';
import { deriveStrategy, MaikerSDK, simulateAndGetTxWithCUs } from '../../clients/js/src';

interface CreateStrategyOptions extends CliCommandOptions {
    xMint: string;
    yMint: string;
}

export function createStrategyCommand(program: Command): void {
    program
        .command('create-strategy')
        .description('Create a new Maiker strategy')
        .requiredOption('--x-mint <pubkey>', 'Public key of the X token mint')
        .requiredOption('--y-mint <pubkey>', 'Public key of the Y token mint')
        .action(async (cmdOptions: CreateStrategyOptions) => {
            try {
                console.log('Creating new Maiker strategy...');

                const options = program.opts();

                // Parse options
                const connection = getConnection(options.rpc);
                const creator = loadKeypairFromFile(options.keypair);
                const xMint = new PublicKey(cmdOptions.xMint);
                const yMint = new PublicKey(cmdOptions.yMint);

                // Derive strategy address
                const strategy = deriveStrategy(creator.publicKey);
                console.log(`Strategy PDA: ${strategy.toBase58()}`);

                // Create vault addresses
                const xVault = await getAssociatedTokenAddress(
                    xMint,
                    strategy,
                    true, // allowOwnerOffCurve
                );

                const yVault = await getAssociatedTokenAddress(
                    yMint,
                    strategy,
                    true, // allowOwnerOffCurve
                );

                console.log(`X Token Mint: ${xMint.toBase58()}`);
                console.log(`Y Token Mint: ${yMint.toBase58()}`);
                console.log(`X Vault: ${xVault.toBase58()}`);
                console.log(`Y Vault: ${yVault.toBase58()}`);

                const createStrategyIxs = await MaikerSDK.createStrategy(
                    connection,
                    {
                        creator: creator.publicKey,
                        xMint: xMint,
                        yMint: yMint
                    }
                );

                const blockhash = await connection.getLatestBlockhash();

                // Create and sign transaction
                const builtTx = await simulateAndGetTxWithCUs({
                    connection: connection,
                    payerPublicKey: creator.publicKey,
                    lookupTableAccounts: [],
                    ixs: [...createStrategyIxs],
                    recentBlockhash: blockhash.blockhash,
                });

                // Sign the transaction
                builtTx.tx.sign([creator]);
                const rawTransaction = builtTx.tx.serialize();

                // Send transaction
                const signature = await connection.sendRawTransaction(rawTransaction);

                console.log('Transaction sent. Waiting for confirmation...');
                await connection.confirmTransaction({
                    signature,
                    ...blockhash
                }, 'confirmed');

                console.log('Strategy created successfully!');
                console.log(`Transaction signature: ${signature}`);
            } catch (error) {
                console.error('Error creating strategy:', error);
                process.exit(1);
            }
        });
} 