import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { getConnection, CliCommandOptions } from '../utils';
import { MaikerSDK } from '../../clients/js/src';

interface GetPendingWithdrawalsOptions extends CliCommandOptions {
    strategy: string;
}

export function getPendingWithdrawalsForStrategy(program: Command): void {
    program
        .command('get-pending-withdrawals')
        .description('Get all pending withdrawals for a strategy')
        .requiredOption('--strategy <pubkey>', 'Strategy public key')
        .action(async (cmdOptions: GetPendingWithdrawalsOptions) => {
            try {
                console.log('Getting pending withdrawals for strategy...');

                const options = program.opts();

                // Parse options
                const connection = getConnection(options.rpc);
                const strategyPubkey = new PublicKey(cmdOptions.strategy);

                const maiker = await MaikerSDK.create(connection, strategyPubkey);

                const pendingWithdrawals = await maiker.getPendingWithdrawalsStrategy();
                console.log("Pending Withdrawals: ", pendingWithdrawals);
            } catch (error) {
                console.error('Error getting pending withdrawals:', error);
                process.exit(1);
            }
        });
}
