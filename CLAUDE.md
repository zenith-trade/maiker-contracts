# Maiker Contracts Development Guide

## Context
- You find all documentation in /docs folder

## Build & Test Commands
- Build program: `yarn programs:build`
- Test all: `yarn programs:test`
- Test single test: `RUST_LOG=error ./configs/program/test.sh maiker-contracts -- <test_name>`
- Lint: `yarn lint`
- Fix linting: `yarn lint:fix`
- Run validator: `yarn validator`
- Generate clients: `yarn generate:clients:codama`

## Code Style Guidelines
- **Rust**:
  - Use #[account] and #[derive(InitSpace)] attributes
  - Include bump: u8 field in accounts
  - Use SEED_PREFIX constant for PDA derivation
  - Place account constraints in instruction files
  - Use checked arithmetic (never direct operators)
  - Create specific error variants with descriptive messages
  - Put events in src/events.rs

- **TypeScript**:
  - Use node:test and node:console for testing
  - Prefer `test` over `it` in test files
  - Use full variables names (no abbreviations)
  - Handle errors with `catch (thrownObject)` pattern

Remember this is Solana, not Ethereum. Don't reference smart contracts or other Ethereum concepts.