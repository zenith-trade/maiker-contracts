#!/usr/bin/env node

import { Command } from 'commander';
import { initGlobalConfigCommand } from './commands/initGlobalConfig';
import { createStrategyCommand } from './commands/createStrategy';
import { updateGlobalConfigCommand } from './commands/updateGlobalConfig';

// Add this block right here, after imports
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit here, just log the error
});

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

// If no args provided, show help and exit cleanly
if (process.argv.length <= 2) {
    program.help();
    cleanExit(0); // This may not be reached but added for safety
}

// Parse arguments
try {
    program.parse(process.argv);

    // If execution reaches here and we've run a command, exit cleanly
    cleanExit(0);
} catch (error) {
    console.error('Error in command execution:', error);
    cleanExit(1);
}