/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import { combineCodec, getAddressDecoder, getAddressEncoder, getOptionDecoder, getOptionEncoder, getStructDecoder, getStructEncoder, getU16Decoder, getU16Encoder, getU64Decoder, getU64Encoder, type Address, type Codec, type Decoder, type Encoder, type Option, type OptionOrNullable } from '@solana/kit';



export type GlobalConfigArgs = { admin: Address; performanceFeeBps: number; withdrawalFeeBps: number; treasury: Address; intervalSeconds: bigint; newAdmin: Option<Address>;  };

export type GlobalConfigArgsArgs = { admin: Address; performanceFeeBps: number; withdrawalFeeBps: number; treasury: Address; intervalSeconds: number | bigint; newAdmin: OptionOrNullable<Address>;  };




export function getGlobalConfigArgsEncoder(): Encoder<GlobalConfigArgsArgs> {
  return getStructEncoder([['admin', getAddressEncoder()], ['performanceFeeBps', getU16Encoder()], ['withdrawalFeeBps', getU16Encoder()], ['treasury', getAddressEncoder()], ['intervalSeconds', getU64Encoder()], ['newAdmin', getOptionEncoder(getAddressEncoder())]]);
}



export function getGlobalConfigArgsDecoder(): Decoder<GlobalConfigArgs> {
  return getStructDecoder([['admin', getAddressDecoder()], ['performanceFeeBps', getU16Decoder()], ['withdrawalFeeBps', getU16Decoder()], ['treasury', getAddressDecoder()], ['intervalSeconds', getU64Decoder()], ['newAdmin', getOptionDecoder(getAddressDecoder())]]);
}




export function getGlobalConfigArgsCodec(): Codec<GlobalConfigArgsArgs, GlobalConfigArgs> {
  return combineCodec(getGlobalConfigArgsEncoder(), getGlobalConfigArgsDecoder());
}


