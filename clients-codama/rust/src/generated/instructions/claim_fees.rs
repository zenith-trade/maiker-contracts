//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;

/// Accounts.
#[derive(Debug)]
pub struct ClaimFees {
    pub authority: solana_program::pubkey::Pubkey,

    pub global_config: solana_program::pubkey::Pubkey,

    pub strategy: solana_program::pubkey::Pubkey,

    pub strategy_vault_x: solana_program::pubkey::Pubkey,

    pub treasury_x: solana_program::pubkey::Pubkey,

    pub token_program: solana_program::pubkey::Pubkey,
}

impl ClaimFees {
    pub fn instruction(
        &self,
        args: ClaimFeesInstructionArgs,
    ) -> solana_program::instruction::Instruction {
        self.instruction_with_remaining_accounts(args, &[])
    }
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction_with_remaining_accounts(
        &self,
        args: ClaimFeesInstructionArgs,
        remaining_accounts: &[solana_program::instruction::AccountMeta],
    ) -> solana_program::instruction::Instruction {
        let mut accounts = Vec::with_capacity(6 + remaining_accounts.len());
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.authority,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.global_config,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.strategy,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.strategy_vault_x,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.treasury_x,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.token_program,
            false,
        ));
        accounts.extend_from_slice(remaining_accounts);
        let mut data = borsh::to_vec(&ClaimFeesInstructionData::new()).unwrap();
        let mut args = borsh::to_vec(&args).unwrap();
        data.append(&mut args);

        solana_program::instruction::Instruction {
            program_id: crate::MAIKER_CONTRACTS_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct ClaimFeesInstructionData {
    discriminator: [u8; 8],
}

impl ClaimFeesInstructionData {
    pub fn new() -> Self {
        Self {
            discriminator: [82, 251, 233, 156, 12, 52, 184, 202],
        }
    }
}

impl Default for ClaimFeesInstructionData {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct ClaimFeesInstructionArgs {
    pub shares_to_claim: Option<u64>,
}

/// Instruction builder for `ClaimFees`.
///
/// ### Accounts:
///
///   0. `[signer]` authority
///   1. `[]` global_config
///   2. `[writable]` strategy
///   3. `[writable]` strategy_vault_x
///   4. `[writable]` treasury_x
///   5. `[optional]` token_program (default to `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`)
#[derive(Clone, Debug, Default)]
pub struct ClaimFeesBuilder {
    authority: Option<solana_program::pubkey::Pubkey>,
    global_config: Option<solana_program::pubkey::Pubkey>,
    strategy: Option<solana_program::pubkey::Pubkey>,
    strategy_vault_x: Option<solana_program::pubkey::Pubkey>,
    treasury_x: Option<solana_program::pubkey::Pubkey>,
    token_program: Option<solana_program::pubkey::Pubkey>,
    shares_to_claim: Option<u64>,
    __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl ClaimFeesBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    #[inline(always)]
    pub fn authority(&mut self, authority: solana_program::pubkey::Pubkey) -> &mut Self {
        self.authority = Some(authority);
        self
    }
    #[inline(always)]
    pub fn global_config(&mut self, global_config: solana_program::pubkey::Pubkey) -> &mut Self {
        self.global_config = Some(global_config);
        self
    }
    #[inline(always)]
    pub fn strategy(&mut self, strategy: solana_program::pubkey::Pubkey) -> &mut Self {
        self.strategy = Some(strategy);
        self
    }
    #[inline(always)]
    pub fn strategy_vault_x(
        &mut self,
        strategy_vault_x: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.strategy_vault_x = Some(strategy_vault_x);
        self
    }
    #[inline(always)]
    pub fn treasury_x(&mut self, treasury_x: solana_program::pubkey::Pubkey) -> &mut Self {
        self.treasury_x = Some(treasury_x);
        self
    }
    /// `[optional account, default to 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']`
    #[inline(always)]
    pub fn token_program(&mut self, token_program: solana_program::pubkey::Pubkey) -> &mut Self {
        self.token_program = Some(token_program);
        self
    }
    /// `[optional argument]`
    #[inline(always)]
    pub fn shares_to_claim(&mut self, shares_to_claim: u64) -> &mut Self {
        self.shares_to_claim = Some(shares_to_claim);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: solana_program::instruction::AccountMeta,
    ) -> &mut Self {
        self.__remaining_accounts.push(account);
        self
    }
    /// Add additional accounts to the instruction.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[solana_program::instruction::AccountMeta],
    ) -> &mut Self {
        self.__remaining_accounts.extend_from_slice(accounts);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        let accounts = ClaimFees {
            authority: self.authority.expect("authority is not set"),
            global_config: self.global_config.expect("global_config is not set"),
            strategy: self.strategy.expect("strategy is not set"),
            strategy_vault_x: self.strategy_vault_x.expect("strategy_vault_x is not set"),
            treasury_x: self.treasury_x.expect("treasury_x is not set"),
            token_program: self.token_program.unwrap_or(solana_program::pubkey!(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            )),
        };
        let args = ClaimFeesInstructionArgs {
            shares_to_claim: self.shares_to_claim.clone(),
        };

        accounts.instruction_with_remaining_accounts(args, &self.__remaining_accounts)
    }
}

/// `claim_fees` CPI accounts.
pub struct ClaimFeesCpiAccounts<'a, 'b> {
    pub authority: &'b solana_program::account_info::AccountInfo<'a>,

    pub global_config: &'b solana_program::account_info::AccountInfo<'a>,

    pub strategy: &'b solana_program::account_info::AccountInfo<'a>,

    pub strategy_vault_x: &'b solana_program::account_info::AccountInfo<'a>,

    pub treasury_x: &'b solana_program::account_info::AccountInfo<'a>,

    pub token_program: &'b solana_program::account_info::AccountInfo<'a>,
}

/// `claim_fees` CPI instruction.
pub struct ClaimFeesCpi<'a, 'b> {
    /// The program to invoke.
    pub __program: &'b solana_program::account_info::AccountInfo<'a>,

    pub authority: &'b solana_program::account_info::AccountInfo<'a>,

    pub global_config: &'b solana_program::account_info::AccountInfo<'a>,

    pub strategy: &'b solana_program::account_info::AccountInfo<'a>,

    pub strategy_vault_x: &'b solana_program::account_info::AccountInfo<'a>,

    pub treasury_x: &'b solana_program::account_info::AccountInfo<'a>,

    pub token_program: &'b solana_program::account_info::AccountInfo<'a>,
    /// The arguments for the instruction.
    pub __args: ClaimFeesInstructionArgs,
}

impl<'a, 'b> ClaimFeesCpi<'a, 'b> {
    pub fn new(
        program: &'b solana_program::account_info::AccountInfo<'a>,
        accounts: ClaimFeesCpiAccounts<'a, 'b>,
        args: ClaimFeesInstructionArgs,
    ) -> Self {
        Self {
            __program: program,
            authority: accounts.authority,
            global_config: accounts.global_config,
            strategy: accounts.strategy,
            strategy_vault_x: accounts.strategy_vault_x,
            treasury_x: accounts.treasury_x,
            token_program: accounts.token_program,
            __args: args,
        }
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], &[])
    }
    #[inline(always)]
    pub fn invoke_with_remaining_accounts(
        &self,
        remaining_accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
    }
    #[inline(always)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed_with_remaining_accounts(
        &self,
        signers_seeds: &[&[&[u8]]],
        remaining_accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> solana_program::entrypoint::ProgramResult {
        let mut accounts = Vec::with_capacity(6 + remaining_accounts.len());
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.authority.key,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.global_config.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.strategy.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.strategy_vault_x.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.treasury_x.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.token_program.key,
            false,
        ));
        remaining_accounts.iter().for_each(|remaining_account| {
            accounts.push(solana_program::instruction::AccountMeta {
                pubkey: *remaining_account.0.key,
                is_signer: remaining_account.1,
                is_writable: remaining_account.2,
            })
        });
        let mut data = borsh::to_vec(&ClaimFeesInstructionData::new()).unwrap();
        let mut args = borsh::to_vec(&self.__args).unwrap();
        data.append(&mut args);

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::MAIKER_CONTRACTS_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(7 + remaining_accounts.len());
        account_infos.push(self.__program.clone());
        account_infos.push(self.authority.clone());
        account_infos.push(self.global_config.clone());
        account_infos.push(self.strategy.clone());
        account_infos.push(self.strategy_vault_x.clone());
        account_infos.push(self.treasury_x.clone());
        account_infos.push(self.token_program.clone());
        remaining_accounts
            .iter()
            .for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// Instruction builder for `ClaimFees` via CPI.
///
/// ### Accounts:
///
///   0. `[signer]` authority
///   1. `[]` global_config
///   2. `[writable]` strategy
///   3. `[writable]` strategy_vault_x
///   4. `[writable]` treasury_x
///   5. `[]` token_program
#[derive(Clone, Debug)]
pub struct ClaimFeesCpiBuilder<'a, 'b> {
    instruction: Box<ClaimFeesCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> ClaimFeesCpiBuilder<'a, 'b> {
    pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(ClaimFeesCpiBuilderInstruction {
            __program: program,
            authority: None,
            global_config: None,
            strategy: None,
            strategy_vault_x: None,
            treasury_x: None,
            token_program: None,
            shares_to_claim: None,
            __remaining_accounts: Vec::new(),
        });
        Self { instruction }
    }
    #[inline(always)]
    pub fn authority(
        &mut self,
        authority: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.authority = Some(authority);
        self
    }
    #[inline(always)]
    pub fn global_config(
        &mut self,
        global_config: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.global_config = Some(global_config);
        self
    }
    #[inline(always)]
    pub fn strategy(
        &mut self,
        strategy: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.strategy = Some(strategy);
        self
    }
    #[inline(always)]
    pub fn strategy_vault_x(
        &mut self,
        strategy_vault_x: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.strategy_vault_x = Some(strategy_vault_x);
        self
    }
    #[inline(always)]
    pub fn treasury_x(
        &mut self,
        treasury_x: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.treasury_x = Some(treasury_x);
        self
    }
    #[inline(always)]
    pub fn token_program(
        &mut self,
        token_program: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.token_program = Some(token_program);
        self
    }
    /// `[optional argument]`
    #[inline(always)]
    pub fn shares_to_claim(&mut self, shares_to_claim: u64) -> &mut Self {
        self.instruction.shares_to_claim = Some(shares_to_claim);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: &'b solana_program::account_info::AccountInfo<'a>,
        is_writable: bool,
        is_signer: bool,
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .push((account, is_writable, is_signer));
        self
    }
    /// Add additional accounts to the instruction.
    ///
    /// Each account is represented by a tuple of the `AccountInfo`, a `bool` indicating whether the account is writable or not,
    /// and a `bool` indicating whether the account is a signer or not.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .extend_from_slice(accounts);
        self
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let args = ClaimFeesInstructionArgs {
            shares_to_claim: self.instruction.shares_to_claim.clone(),
        };
        let instruction = ClaimFeesCpi {
            __program: self.instruction.__program,

            authority: self.instruction.authority.expect("authority is not set"),

            global_config: self
                .instruction
                .global_config
                .expect("global_config is not set"),

            strategy: self.instruction.strategy.expect("strategy is not set"),

            strategy_vault_x: self
                .instruction
                .strategy_vault_x
                .expect("strategy_vault_x is not set"),

            treasury_x: self.instruction.treasury_x.expect("treasury_x is not set"),

            token_program: self
                .instruction
                .token_program
                .expect("token_program is not set"),
            __args: args,
        };
        instruction.invoke_signed_with_remaining_accounts(
            signers_seeds,
            &self.instruction.__remaining_accounts,
        )
    }
}

#[derive(Clone, Debug)]
struct ClaimFeesCpiBuilderInstruction<'a, 'b> {
    __program: &'b solana_program::account_info::AccountInfo<'a>,
    authority: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    global_config: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    strategy: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    strategy_vault_x: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    treasury_x: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    token_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    shares_to_claim: Option<u64>,
    /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
    __remaining_accounts: Vec<(
        &'b solana_program::account_info::AccountInfo<'a>,
        bool,
        bool,
    )>,
}
