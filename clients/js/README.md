# Maiker JavaScript SDK

This SDK provides a convenient interface for interacting with Maiker strategies on Solana. It wraps the core Maiker program functionality in an easy-to-use class-based API.

## Overview

The SDK is built around the `MaikerSDK` class which represents a single strategy. The class provides methods for:

- Creating new strategies
- Depositing funds
- Initiating withdrawals 
- Processing withdrawals
- Fetching strategy and user position data
- Managing liquidity positions

Most of the underlying functionality leverages the DLMM SDK directly to avoid code duplication, particularly for:

- Position management
- Liquidity calculations
- Price calculations
- Common utilities

## Custom Implementations

While we aim to reuse DLMM SDK code where possible, there are two key functions that needed custom implementation to support testing with Bankrun:

1. `getOrCreateATAInstruction` - Custom implementation to properly handle token account creation errors in Bankrun environment

2. `chunkedGetMultipleAccountInfos` - Custom implementation to fetch multiple accounts in chunks that works with Bankrun's connection proxy

These implementations maintain the same interface as their DLMM counterparts but handle Bankrun-specific error cases.

## Usage
TODO
