import { GetOrCreateATAResponse } from "@meteora-ag/dlmm";
import { createAssociatedTokenAccountIdempotentInstruction, getAccount, getAssociatedTokenAddressSync, TokenAccountNotFoundError, TokenInvalidAccountOwnerError } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export function chunks<T>(array: T[], size: number): T[][] {
    return Array.apply(0, new Array(Math.ceil(array.length / size))).map(
        (_, index) => array.slice(index * size, (index + 1) * size)
    );
}

// This helper is only not used from DLMM sdk directly because we need to check for the Could not find error separately when bankrun is used
export async function chunkedGetMultipleAccountInfos(
    connection: Connection,
    pks: PublicKey[],
    chunkSize: number = 100
) {
    const accountInfos = (
        await Promise.all(
            chunks(pks, chunkSize).map((chunk) =>
                Promise.all(chunk.map(async (pk) => {
                    try {
                        return await connection.getAccountInfo(pk);
                    } catch (e) {
                        return null;
                    }
                }))
            )
        )
    ).flat().filter(acc => acc !== null); // Extra filtering

    return accountInfos;
}

// This helper is only not used from DLMM sdk directly because we need to check for the Could not find error separately when bankrun is used
export const getOrCreateATAInstruction = async (
    connection: Connection,
    tokenMint: PublicKey,
    owner: PublicKey,
    payer: PublicKey = owner,
    allowOwnerOffCurve = true
): Promise<GetOrCreateATAResponse> => {
    const toAccount = getAssociatedTokenAddressSync(
        tokenMint,
        owner,
        allowOwnerOffCurve
    );

    try {
        await getAccount(connection, toAccount);

        return { ataPubKey: toAccount, ix: undefined };
    } catch (e) {
        if (
            e instanceof TokenAccountNotFoundError ||
            e instanceof TokenInvalidAccountOwnerError ||
            e.message.includes("Could not find") // Bankrun connection proxy error
        ) {
            const ix = createAssociatedTokenAccountIdempotentInstruction(
                payer,
                toAccount,
                owner,
                tokenMint
            );

            return { ataPubKey: toAccount, ix };
        }

        throw e;
    }
};