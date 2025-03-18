#!/usr/bin/env node

import { Command } from 'commander';
import { initGlobalConfigCommand } from './commands/initGlobalConfig';
import { createStrategyCommand } from './commands/createStrategy';
import { updateGlobalConfigCommand } from './commands/updateGlobalConfig';
import { getPendingWithdrawalsForStrategy } from './commands/getPendingWithdrawalsForStrategy';

// Create a clean exit function
const cleanExit = (code = 0) => {
    setTimeout(() => process.exit(code), 100);
};

// Create the program
const program = new Command();

// Setup program metadata
program
    .name('maiker')
    .description('Maiker Protocol CLI tool')
    .version('0.1.0');

// Override help command to ensure clean exit
program.configureHelp({
    helpWidth: 80
});

program.on('--help', () => {
    cleanExit(0); // Ensure help exits cleanly
});

// Global options required for all commands
program
    .requiredOption('-r, --rpc <url>', 'RPC URL for Solana connection')
    .requiredOption('-k, --keypair <path>', 'Path to keypair file that will sign transactions');

// Register commands
initGlobalConfigCommand(program);
createStrategyCommand(program);
updateGlobalConfigCommand(program);
getPendingWithdrawalsForStrategy(program);

// If no args provided, show help and exit cleanly
if (process.argv.length <= 2) {
    program.help();
    cleanExit(0); // This may not be reached but added for safety
}

// Parse arguments
try {
    // Run the program and store the promise
    const commandPromise = program.parseAsync(process.argv);

    // Wait for commands to complete before exiting
    commandPromise.then(() => {
        cleanExit(0);
    }).catch((err) => {
        console.error('Error in command execution:', err);
        cleanExit(1);
    });
} catch (error) {
    console.error('Error in command execution:', error);
    cleanExit(1);
}