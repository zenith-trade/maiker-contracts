import { BN } from "@coral-xyz/anchor";
import { BinAndAmount, binIdToBinArrayIndex, deriveBinArray, deriveBinArrayBitmapExtension, getOrCreateATAInstruction, isOverflowDefaultBinArrayBitmap, MAX_ACTIVE_BIN_SLIPPAGE, MAX_BIN_PER_POSITION, toWeightDistribution, wrapSOLInstruction, unwrapSOLInstruction, LiquidityParameterByWeight, LiquidityOneSideParameter, MAX_BIN_LENGTH_ALLOWED_IN_ONE_TX, getEstimatedComputeUnitIxWithBuffer } from "@meteora-ag/dlmm";
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import { dlmm, DLMM_EVENT_AUTHORITY_PDA, dlmmInstructions, dlmmProgramId } from "..";

export const DEFAULT_ADD_LIQUIDITY_CU = 800_000;

interface InitializePositionAndAddLiquidityParams {
    connection: Connection;
    lbPairPubkey: PublicKey;
    lbPair: dlmm.lbPair;
    positionPubKey: PublicKey;
    totalXAmount: BN;
    totalYAmount: BN;
    lowerBinId: number;
    upperBinId: number;
    xYAmountDistribution: BinAndAmount[];
    user: PublicKey;
    slippage?: number;
}

/**
   * The function `initializePositionAndAddLiquidityByWeight` function is used to initializes a position and adds liquidity
   * @param {InitializePositionAndAddLiquidityParams}
   *    - `connection`: The connection object.
   *    - `lbPairPubkey`: The public key of the liquidity book pair account.
   *    - `lbPair`: The liquidity book pair account.
   *    - `positionPubKey`: The public key of the position account. (usually use `new Keypair()`)
   *    - `totalXAmount`: The total amount of token X to be added to the liquidity pool.
   *    - `totalYAmount`: The total amount of token Y to be added to the liquidity pool.
   *    - `lowerBinId`: The lower bin id of the liquidity pool.
   *    - `upperBinId`: The upper bin id of the liquidity pool.
   *    - `xYAmountDistribution`: An array of objects of type `XYAmountDistribution` that represents (can use `calculateSpotDistribution`, `calculateBidAskDistribution` & `calculateNormalDistribution`)
   *    - `user`: The public key of the user account.
   *    - `slippage`: The slippage percentage to be used for the liquidity pool.
   * @returns {Promise<Transaction|Transaction[]>} The function `initializePositionAndAddLiquidityByWeight` returns a `Promise` that
   * resolves to either a single `Transaction` object (if less than 26bin involved) or an array of `Transaction` objects.
   */
export const initializePositionAndAddLiquidityByWeight = async ({
    connection,
    lbPairPubkey,
    lbPair,
    positionPubKey,
    totalXAmount,
    totalYAmount,
    lowerBinId,
    upperBinId,
    xYAmountDistribution,
    user,
    slippage,
}: InitializePositionAndAddLiquidityParams): Promise<
    { mainInstructions: TransactionInstruction[], preInstructions: TransactionInstruction[] | null, postInstructions: TransactionInstruction[] | null }
> => {
    const maxActiveBinSlippage = slippage
        ? Math.ceil(slippage / (lbPair.binStep / 100))
        : MAX_ACTIVE_BIN_SLIPPAGE;

    if (upperBinId >= lowerBinId + MAX_BIN_PER_POSITION.toNumber()) {
        throw new Error(
            `Position must be within a range of 1 to ${MAX_BIN_PER_POSITION.toNumber()} bins.`
        );
    }

    const preInstructions: Array<TransactionInstruction> = [];

    const initializePositionIx = dlmmInstructions.initializePosition(
        {
            lowerBinId,
            width: upperBinId - lowerBinId + 1,
        },
        {
            payer: user,
            position: positionPubKey,
            lbPair: lbPairPubkey,
            owner: user,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
            program: dlmmProgramId.PROGRAM_ID,
        }
    )

    preInstructions.push(initializePositionIx);

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const upperBinArrayIndex = BN.max(
        lowerBinArrayIndex.add(new BN(1)),
        binIdToBinArrayIndex(new BN(upperBinId))
    );

    const { instructions: binArrayInstructions, lowerBinArray, upperBinArray } = await getOrCreateBinArraysInstructions(
        connection,
        lbPairPubkey,
        lowerBinArrayIndex,
        upperBinArrayIndex,
        user
    );
    preInstructions.push(...binArrayInstructions);

    const [
        { ataPubKey: userTokenX, ix: createPayerTokenXIx },
        { ataPubKey: userTokenY, ix: createPayerTokenYIx },
    ] = await Promise.all([
        getOrCreateATAInstruction(
            connection,
            lbPair.tokenXMint,
            user
        ),
        getOrCreateATAInstruction(
            connection,
            lbPair.tokenYMint,
            user
        ),
    ]);
    if (createPayerTokenXIx) preInstructions.push(createPayerTokenXIx);
    if (createPayerTokenYIx) preInstructions.push(createPayerTokenYIx);

    if (lbPair.tokenXMint.equals(NATIVE_MINT) && !totalXAmount.isZero()) {
        const wrapSOLIx = wrapSOLInstruction(
            user,
            userTokenX,
            BigInt(totalXAmount.toString())
        );

        preInstructions.push(...wrapSOLIx);
    }

    if (lbPair.tokenYMint.equals(NATIVE_MINT) && !totalYAmount.isZero()) {
        const wrapSOLIx = wrapSOLInstruction(
            user,
            userTokenY,
            BigInt(totalYAmount.toString())
        );

        preInstructions.push(...wrapSOLIx);
    }

    const postInstructions: Array<TransactionInstruction> = [];
    if (
        [
            lbPair.tokenXMint.toBase58(),
            lbPair.tokenYMint.toBase58(),
        ].includes(NATIVE_MINT.toBase58())
    ) {
        const closeWrappedSOLIx = await unwrapSOLInstruction(user);
        if (closeWrappedSOLIx) postInstructions.push(closeWrappedSOLIx);
    }

    const minBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const maxBinArrayIndex = binIdToBinArrayIndex(new BN(upperBinId));

    const useExtension =
        isOverflowDefaultBinArrayBitmap(minBinArrayIndex) ||
        isOverflowDefaultBinArrayBitmap(maxBinArrayIndex);

    const binArrayBitmapExtension = useExtension
        ? deriveBinArrayBitmapExtension(lbPairPubkey, dlmmProgramId.PROGRAM_ID)[0]
        : null;

    const { activeId } = lbPair;

    const binLiquidityDist: LiquidityParameterByWeight["binLiquidityDist"] =
        toWeightDistribution(
            totalXAmount,
            totalYAmount,
            xYAmountDistribution.map((item) => ({
                binId: item.binId,
                xAmountBpsOfTotal: item.xAmountBpsOfTotal,
                yAmountBpsOfTotal: item.yAmountBpsOfTotal,
            })),
            lbPair.binStep
        );

    if (binLiquidityDist.length === 0) {
        throw new Error("No liquidity to add");
    }

    const liquidityParams: LiquidityParameterByWeight = {
        amountX: totalXAmount,
        amountY: totalYAmount,
        binLiquidityDist,
        activeId,
        maxActiveBinSlippage,
    };

    const addLiquidityAccounts = {
        position: positionPubKey,
        lbPair: lbPairPubkey,
        userTokenX,
        userTokenY,
        reserveX: lbPair.reserveX,
        reserveY: lbPair.reserveY,
        tokenXMint: lbPair.tokenXMint,
        tokenYMint: lbPair.tokenYMint,
        binArrayLower: lowerBinArray,
        binArrayUpper: upperBinArray,
        binArrayBitmapExtension: binArrayBitmapExtension || dlmmProgramId.PROGRAM_ID,
        sender: user,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID,
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        program: dlmmProgramId.PROGRAM_ID,
    };

    const oneSideLiquidityParams: LiquidityOneSideParameter = {
        amount: totalXAmount.isZero() ? totalYAmount : totalXAmount,
        activeId,
        maxActiveBinSlippage,
        binLiquidityDist,
    };

    const oneSideAddLiquidityAccounts = {
        binArrayLower: lowerBinArray,
        binArrayUpper: upperBinArray,
        lbPair: lbPairPubkey,
        binArrayBitmapExtension: binArrayBitmapExtension || dlmmProgramId.PROGRAM_ID,
        sender: user,
        position: positionPubKey,
        reserve: totalXAmount.isZero()
            ? lbPair.reserveY
            : lbPair.reserveX,
        tokenMint: totalXAmount.isZero()
            ? lbPair.tokenYMint
            : lbPair.tokenXMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        userToken: totalXAmount.isZero() ? userTokenY : userTokenX,
        eventAuthority: DLMM_EVENT_AUTHORITY_PDA,
        program: dlmmProgramId.PROGRAM_ID,
    };

    const isOneSideDeposit = totalXAmount.isZero() || totalYAmount.isZero();
    const addLiqIx = isOneSideDeposit
        ? dlmmInstructions.addLiquidityOneSide({ liquidityParameter: oneSideLiquidityParams }, oneSideAddLiquidityAccounts) // this.program.methods.addLiquidityOneSide(oneSideLiquidityParams)
        : dlmmInstructions.addLiquidityByWeight({ liquidityParameter: liquidityParams }, addLiquidityAccounts); // this.program.methods.addLiquidityByWeight(liquidityParams);

    if (xYAmountDistribution.length < MAX_BIN_LENGTH_ALLOWED_IN_ONE_TX) {
        console.log("Less than 26 bins filled");

        const instructions = [...preInstructions, addLiqIx, ...postInstructions];

        // const setCUIx = await getEstimatedComputeUnitIxWithBuffer(
        //     connection,
        //     instructions,
        //     user
        // );

        // instructions.unshift(setCUIx);

        return { mainInstructions: instructions, preInstructions: null, postInstructions: null };

        // const { blockhash, lastValidBlockHeight } =
        //     await connection.getLatestBlockhash("confirmed");
        // return new Transaction({
        //     blockhash,
        //     lastValidBlockHeight,
        //     feePayer: user,
        // }).add(...instructions);
    }

    // const setCUIx = await getEstimatedComputeUnitIxWithBuffer(
    //     connection,
    //     [addLiqIx],
    //     user,
    //     DEFAULT_ADD_LIQUIDITY_CU // The function return multiple transactions that dependent on each other, simulation will fail
    // );

    const mainInstructions = [addLiqIx];

    const returnValue = {
        mainInstructions,
        preInstructions,
        postInstructions,
    }

    return returnValue;

    // const transactions: Transaction[] = [];
    // const { blockhash, lastValidBlockHeight } =
    //     await connection.getLatestBlockhash("confirmed");

    // if (preInstructions.length) {
    //     const preInstructionsTx = new Transaction({
    //         blockhash,
    //         lastValidBlockHeight,
    //         feePayer: user,
    //     }).add(...preInstructions);
    //     transactions.push(preInstructionsTx);
    // }

    // const mainTx = new Transaction({
    //     blockhash,
    //     lastValidBlockHeight,
    //     feePayer: user,
    // }).add(...mainInstructions);
    // transactions.push(mainTx);

    // if (postInstructions.length) {
    //     const postInstructionsTx = new Transaction({
    //         blockhash,
    //         lastValidBlockHeight,
    //         feePayer: user,
    //     }).add(...postInstructions);
    //     transactions.push(postInstructionsTx);
    // }

    // return transactions;
}

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