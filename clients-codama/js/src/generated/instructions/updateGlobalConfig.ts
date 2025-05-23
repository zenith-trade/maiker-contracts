/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import { combineCodec, fixDecoderSize, fixEncoderSize, getBytesDecoder, getBytesEncoder, getStructDecoder, getStructEncoder, transformEncoder, type Address, type Codec, type Decoder, type Encoder, type IAccountMeta, type IAccountSignerMeta, type IInstruction, type IInstructionWithAccounts, type IInstructionWithData, type ReadonlySignerAccount, type ReadonlyUint8Array, type TransactionSigner, type WritableAccount } from '@solana/kit';
import { MAIKER_CONTRACTS_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';
import { getGlobalConfigArgsDecoder, getGlobalConfigArgsEncoder, type GlobalConfigArgs, type GlobalConfigArgsArgs } from '../types';

export const UPDATE_GLOBAL_CONFIG_DISCRIMINATOR = new Uint8Array([164, 84, 130, 189, 111, 58, 250, 200]);

export function getUpdateGlobalConfigDiscriminatorBytes() { return fixEncoderSize(getBytesEncoder(), 8).encode(UPDATE_GLOBAL_CONFIG_DISCRIMINATOR); }

export type UpdateGlobalConfigInstruction<
  TProgram extends string = typeof MAIKER_CONTRACTS_PROGRAM_ADDRESS,
      TAccountAuthority extends string | IAccountMeta<string> = string, TAccountGlobalConfig extends string | IAccountMeta<string> = string,
    TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram>
      & IInstructionWithData<Uint8Array>
        & IInstructionWithAccounts<[TAccountAuthority extends string ? ReadonlySignerAccount<TAccountAuthority> & IAccountSignerMeta<TAccountAuthority> : TAccountAuthority, TAccountGlobalConfig extends string ? WritableAccount<TAccountGlobalConfig> : TAccountGlobalConfig, ...TRemainingAccounts]>
  ;



export type UpdateGlobalConfigInstructionData = { discriminator: ReadonlyUint8Array; globalConfigArgs: GlobalConfigArgs;  };

export type UpdateGlobalConfigInstructionDataArgs = { globalConfigArgs: GlobalConfigArgsArgs;  };




export function getUpdateGlobalConfigInstructionDataEncoder(): Encoder<UpdateGlobalConfigInstructionDataArgs> {
  return transformEncoder(getStructEncoder([['discriminator', fixEncoderSize(getBytesEncoder(), 8)], ['globalConfigArgs', getGlobalConfigArgsEncoder()]]), (value) => ({ ...value, discriminator: UPDATE_GLOBAL_CONFIG_DISCRIMINATOR }));
}



export function getUpdateGlobalConfigInstructionDataDecoder(): Decoder<UpdateGlobalConfigInstructionData> {
  return getStructDecoder([['discriminator', fixDecoderSize(getBytesDecoder(), 8)], ['globalConfigArgs', getGlobalConfigArgsDecoder()]]);
}




export function getUpdateGlobalConfigInstructionDataCodec(): Codec<UpdateGlobalConfigInstructionDataArgs, UpdateGlobalConfigInstructionData> {
  return combineCodec(getUpdateGlobalConfigInstructionDataEncoder(), getUpdateGlobalConfigInstructionDataDecoder());
}




export type UpdateGlobalConfigInput<TAccountAuthority extends string = string,
  TAccountGlobalConfig extends string = string,
  >
=  {
  authority: TransactionSigner<TAccountAuthority>;
globalConfig: Address<TAccountGlobalConfig>;globalConfigArgs: UpdateGlobalConfigInstructionDataArgs["globalConfigArgs"];
}


export  function getUpdateGlobalConfigInstruction<TAccountAuthority extends string, TAccountGlobalConfig extends string, TProgramAddress extends Address = typeof MAIKER_CONTRACTS_PROGRAM_ADDRESS>(input: UpdateGlobalConfigInput<TAccountAuthority, TAccountGlobalConfig>, config?: { programAddress?: TProgramAddress } ): UpdateGlobalConfigInstruction<TProgramAddress, TAccountAuthority, TAccountGlobalConfig> {
  // Program address.
  const programAddress = config?.programAddress ?? MAIKER_CONTRACTS_PROGRAM_ADDRESS;

      // Original accounts.
    const originalAccounts = {
              authority: { value: input.authority ?? null, isWritable: false },
              globalConfig: { value: input.globalConfig ?? null, isWritable: true },
          };
    const accounts = originalAccounts as Record<keyof typeof originalAccounts, ResolvedAccount>;
  
      // Original args.
    const args = { ...input,  };
  
  
  





      const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
    const instruction = {accounts: [
                  getAccountMeta(accounts.authority),
                  getAccountMeta(accounts.globalConfig),
                      ]      ,    programAddress,
          data: getUpdateGlobalConfigInstructionDataEncoder().encode(args as UpdateGlobalConfigInstructionDataArgs),
      } as UpdateGlobalConfigInstruction<TProgramAddress, TAccountAuthority, TAccountGlobalConfig>;

      return instruction;
  }


export type ParsedUpdateGlobalConfigInstruction<
  TProgram extends string = typeof MAIKER_CONTRACTS_PROGRAM_ADDRESS,
      TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
  > = {
  programAddress: Address<TProgram>;
      accounts: {
                      authority: TAccountMetas[0],
                      globalConfig: TAccountMetas[1],
          };
        data: UpdateGlobalConfigInstructionData;
  };

export function parseUpdateGlobalConfigInstruction<
  TProgram extends string,
      TAccountMetas extends readonly IAccountMeta[],
  >(
  instruction: IInstruction<TProgram>
          & IInstructionWithAccounts<TAccountMetas>
              & IInstructionWithData<Uint8Array>
    ): ParsedUpdateGlobalConfigInstruction<TProgram , TAccountMetas> {
      if (instruction.accounts.length < 2) {
      // TODO: Coded error.
      throw new Error('Not enough accounts');
    }
    let accountIndex = 0;
    const getNextAccount = () => {
      const accountMeta = instruction.accounts![accountIndex]!;
      accountIndex += 1;
      return accountMeta;
    }
        return {
    programAddress: instruction.programAddress,
          accounts: {
                              authority: getNextAccount(),
                                        globalConfig: getNextAccount(),
                        },
              data: getUpdateGlobalConfigInstructionDataDecoder().decode(instruction.data),
      };
}

