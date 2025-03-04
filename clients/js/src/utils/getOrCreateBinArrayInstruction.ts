import { BN } from "@coral-xyz/anchor";
import { deriveBinArray } from "@meteora-ag/dlmm";
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { dlmm, dlmmInstructions, dlmmProgramId } from "..";

export const getOrCreateBinArraysInstructions = async (
    connection: Connection,
    lb_pair: PublicKey,
    lowerBinArrayIndex: BN,
    upperBinArrayIndex: BN,
    funder: PublicKey
): Promise<{ instructions: TransactionInstruction[], lowerBinArray: PublicKey, upperBinArray: PublicKey }> => {
    const binArrayIndexes: BN[] = Array.from(
        { length: upperBinArrayIndex.sub(lowerBinArrayIndex).toNumber() + 1 },
        (_, index) => new BN(index + lowerBinArrayIndex.toNumber())
    ).map((idx) => new BN(idx));

    // First, derive all bin arrays
    const binArrays = binArrayIndexes.map(idx =>
        deriveBinArray(lb_pair, idx, dlmmProgramId.PROGRAM_ID)[0]
    );

    // Then, fetch all accounts in parallel
    const binArrayAccounts = await Promise.all(
        binArrays.map(async binArray => {
            try {
                return await dlmm.binArray.fetch(connection, binArray);
            } catch (e) {
                return null;
            }
        })
    );

    // Finally, create instructions for null accounts
    const instructions = binArrayIndexes.reduce((ixs, idx, i) => {
        if (binArrayAccounts[i] === null) {
            ixs.push(
                dlmmInstructions.initializeBinArray(
                    { index: idx },
                    {
                        binArray: binArrays[i],
                        funder,
                        lbPair: lb_pair,
                        systemProgram: SystemProgram.programId,
                    }
                )
            );
        }
        return ixs;
    }, [] as TransactionInstruction[]);

    return { instructions, lowerBinArray: binArrays[0], upperBinArray: binArrays[binArrays.length - 1] };
};