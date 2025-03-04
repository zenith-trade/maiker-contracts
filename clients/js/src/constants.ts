import { PublicKey } from "@solana/web3.js";
import { dlmmProgramId } from ".";

export const SHARE_PRECISION = 1_000_000;

export const DLMM_EVENT_AUTHORITY_PDA = PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    dlmmProgramId.PROGRAM_ID
)[0];