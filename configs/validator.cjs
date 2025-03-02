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
        label: "Dynamic Amm",
        programId: "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB",
        deployPath: getProgram("dynamic_amm.so"),
      },
      {
        label: "Vault",
        programId: "24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi",
        deployPath: getProgram("vault.so"),
      },
    ],
    accounts: [{
      label: "Meteora Config",
      accountId: "Cqq1zjgSj78BZv5e3HGYkspnVuFgCzuuykckonmT3wmp",
      cluster: 'https://api.mainnet-beta.solana.com'
    }, {
      label: "Native Mint",
      accountId: "So11111111111111111111111111111111111111112",
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
