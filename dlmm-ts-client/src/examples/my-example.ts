import { PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { DLMM } from "../dlmm";

const RPC = "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC, "finalized");

const poolAddress = new PublicKey(
    "9DFwVTwFYYvQFmr9iSV6tQ5TW2CgXU82pgAU7B4Cd6LF"
);

const myTest = async () => {
    const dlmmPool = await DLMM.create(connection, poolAddress, {
        cluster: "mainnet-beta",
    });

    const activeBin = await dlmmPool.getActiveBin();
    console.log("🚀 ~ activeBin:", activeBin);

    const activeBinPricePerLamport = dlmmPool.fromPricePerLamport(
        Number(activeBin.price)
    );

    console.log("🚀 ~ activeBinPricePerLamport:", activeBinPricePerLamport);
};

myTest();