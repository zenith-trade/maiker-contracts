const path = require("path");

const programBinDir = path.join(__dirname, "..", ".programsBin");

function getProgram(programBinary) {
  return path.join(programBinDir, programBinary);
}

module.exports = {
  validator: {
    killRunningValidators: true,
    commitment: "processed",
    programs: [
      {
        label: "Maiker Contracts",
        programId: "27mwfhSgaW1BDyYHcnfRnthvrCUZefXnwawH2YYbx2xx",
        deployPath: getProgram("maiker_contracts.so"),
      },
      {
        label: "Meteora DLMM",
        programId: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
        deployPath: getProgram("dlmm.so"),
      },
    ],
    accounts: [{
      label: "Meteora Preset Parameter",
      accountId: "BYQtcDyv2BoFuf5ghsYDGPA8iX5F4WquK7zCzUsDwJ63",
      cluster: 'https://api.mainnet-beta.solana.com'
      }],
    jsonRpcUrl: "localhost",
    websocketUrl: "",
    ledgerDir: "./test-ledger",
    resetLedger: true,
    verifyFees: false,
    detached: true,
  },
  relay: {
    enabled: true,
    killlRunningRelay: true,
  },
  storage: {
    enabled: true,
    storageId: "mock-storage",
    clearOnStart: true,
  },
};
