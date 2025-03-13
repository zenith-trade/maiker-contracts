import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionError,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { base64, bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { getMedianPrioritizationFeeByPercentile, PriotitizationFeeLevels } from './priorityFeeTriton';

const PLACEHOLDER_BLOCKHASH = 'Fdum64WVeej6DeL85REV9NvfSxEJNPZ74DBk7A8kTrKP';

function getVersionedTransaction(
  payerKey: PublicKey,
  ixs: Array<TransactionInstruction>,
  lookupTableAccounts: AddressLookupTableAccount[],
  recentBlockhash: string,
): VersionedTransaction {
  const message = new TransactionMessage({
    payerKey,
    recentBlockhash,
    instructions: ixs,
  }).compileToV0Message(lookupTableAccounts);

  return new VersionedTransaction(message);
}

export type SimulateAndGetTxWithCUsParams = {
  connection: Connection;
  payerPublicKey: PublicKey;
  lookupTableAccounts: AddressLookupTableAccount[];
  /// instructions to simulate and create transaction from
  ixs: Array<TransactionInstruction>;
  /// multiplier to apply to the estimated CU usage, default: 1.0
  cuLimitMultiplier?: number;
  /// minimum CU limit to use, will not use a min CU if not set
  minCuLimit?: number;
  /// set false to only create a tx without simulating for CU estimate
  doSimulation?: boolean;
  /// set true to add priority fee to the transaction
  addPriorityFee?: boolean;
  priorityFeeLevel?: 'low' | 'medium' | 'high' | 'veryHigh';
  /// recentBlockhash to use in the final tx. If undefined, PLACEHOLDER_BLOCKHASH
  /// will be used for simulation, the final tx will have an empty blockhash so
  /// attempts to sign it will throw.
  recentBlockhash?: string;
  /// set true to dump base64 transaction before and after simulating for CUs
  dumpTx?: boolean;
  removeLastIxPostSim?: boolean; // remove the last instruction post simulation (used for fillers)
};

export type SimulateAndGetTxWithCUsResponse = {
  cuEstimate: number;
  simTxLogs: Array<string> | null;
  simError: TransactionError | string | null;
  simSlot: number;
  simTxDuration: number;
  tx: VersionedTransaction;
};

export async function simulateAndGetTxWithCUs(
  params: SimulateAndGetTxWithCUsParams,
): Promise<SimulateAndGetTxWithCUsResponse> {
  if (params.ixs.length === 0) {
    throw new Error('cannot simulate empty tx');
  }

  let setCULimitIxIdx = -1;
  for (let idx = 0; idx < params.ixs.length; idx += 1) {
    const ix = params.ixs[idx];
    // Check if instruction is for ComputeBudget program
    if (ix.programId.equals(ComputeBudgetProgram.programId)) {
      // Check if data length is 9 bytes and first byte is 0x02
      // which indicates SetComputeUnitLimit instruction
      if (ix.data.length === 9 && ix.data[0] === 0x02) {
        setCULimitIxIdx = idx;
        break;
      }
    }
  }

  // if we don't have a set CU limit ix, add one to the beginning
  // otherwise the default CU limit for sim is 400k, which may be too low
  if (setCULimitIxIdx === -1) {
    params.ixs.unshift(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_400_000,
      }),
    );
    setCULimitIxIdx = 0;
  }
  let simTxDuration = 0;

  const tx = getVersionedTransaction(
    params.payerPublicKey,
    params.ixs,
    params.lookupTableAccounts,
    params.recentBlockhash ?? PLACEHOLDER_BLOCKHASH,
  );

  if (!params.doSimulation) {
    return {
      cuEstimate: -1,
      simTxLogs: null,
      simError: null,
      simSlot: -1,
      simTxDuration,
      tx,
    };
  }

  let resp;
  try {
    const start = Date.now();
    resp = await params.connection.simulateTransaction(tx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
      commitment: 'processed',
    });
    simTxDuration = Date.now() - start;
  } catch (e) {
    throw new Error(`Error simulating transaction: ${JSON.stringify(e)}`);
  }
  // console.log("simResp", resp);

  if (!resp) {
    throw new Error('Failed to simulate transaction');
  }

  if (resp.value.unitsConsumed === undefined) {
    throw new Error(`Failed to get units consumed from simulateTransaction`);
  }

  const simTxLogs = resp.value.logs;
  const cuEstimate = resp.value.unitsConsumed!;
  const cusToUse = Math.max(cuEstimate * (params.cuLimitMultiplier ?? 1.0), params.minCuLimit ?? 0);
  params.ixs[setCULimitIxIdx] = ComputeBudgetProgram.setComputeUnitLimit({
    units: cusToUse,
  });

  if (params.addPriorityFee && params.priorityFeeLevel) {
    const priorityFee = await getMedianPrioritizationFeeByPercentile(params.connection, {
      percentile: PriotitizationFeeLevels.MEDIAN,
    });
    // console.log(priorityFeeLevels, "Priority fee Levels");

    // Create priority fee instruction
    const setComputeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee,
    });

    // Add the priority fee instruction to the transaction
    params.ixs.push(setComputeUnitPriceIx);
  }

  const ixsToUse = params.removeLastIxPostSim ? params.ixs.slice(0, -1) : params.ixs;
  const txWithCUs = getVersionedTransaction(
    params.payerPublicKey,
    ixsToUse,
    params.lookupTableAccounts,
    params.recentBlockhash ?? PLACEHOLDER_BLOCKHASH,
  );

  if (params.dumpTx) {
    console.log(
      `== Simulation result, cuEstimate: ${cuEstimate}, using: ${cusToUse}, blockhash: ${params.recentBlockhash} ==`,
    );
    const serializedTx = base64.encode(Buffer.from(txWithCUs.serialize()));
    console.log(serializedTx);
    console.log(`================================================`);
  }

  // strip out the placeholder blockhash so user doesn't try to send the tx.
  // sending a tx with placeholder blockhash will cause `blockhash not found error`
  // which is suppressed if flight checks are skipped.
  if (!params.recentBlockhash) {
    txWithCUs.message.recentBlockhash = '';
  }

  return {
    cuEstimate,
    simTxLogs,
    simTxDuration,
    simError: resp.value.err,
    simSlot: resp.context.slot,
    tx: txWithCUs,
  };
}
