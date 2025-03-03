const path = require("path");
const fs = require("fs");
const { createFromRoot } = require('codama');
const { rootNodeFromAnchor } = require('@codama/nodes-from-anchor');
const { updateAccountsVisitor, updateInstructionsVisitor } = require('codama');
const { renderJavaScriptVisitor, renderRustVisitor } = require('@codama/renderers');

const anchorIdl = require("../target/idl/maiker_contracts.json");

// Paths.
const clientDir = path.join(__dirname, "..", "clients-codama");
const idlDir = path.join(__dirname, "..", "idls");

const codama = createFromRoot(rootNodeFromAnchor(anchorIdl));

// // Update accounts.
// codama.update(
//   new k.updateAccountsVisitor({
//     global: {
//       seeds: [k.constantPdaSeedNodeFromString("global")],
//     },
//     migrationPdaSigner: {
//       seeds: [k.constantPdaSeedNodeFromString("migration-pda-signer")],
//     },
//     bondingCurve: {
//       seeds: [
//         k.constantPdaSeedNodeFromString("bonding-curve"),
//         k.variablePdaSeedNode("mint", k.publicKeyTypeNode(), MINT_NODE_DESC),
//       ],
//     },
//     eventAuthority: {
//       seeds: [k.constantPdaSeedNodeFromString("__event_authority")],
//     },
//   }),
// );

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
const prettier = require(path.join(clientDir, "js", ".prettierrc.json"));

codama.accept(
  new renderJavaScriptVisitor(jsDir, {
    prettierOptions: prettier,
    exportAccounts: true,
  })
);

// cp idls dir in clients/js/src/idls
const idlsTargetDir = path.join(clientDir, "js", "src", "idls");
fs.cpSync(idlDir, idlsTargetDir, { recursive: true });
// cp target/types in clients/js/src/idls
fs.cpSync(path.join(__dirname, "..", "target", "types"), idlsTargetDir, {
  recursive: true,
});

// Render Rust.
const crateDir = path.join(clientDir, "rust");
const rustDir = path.join(clientDir, "rust", "src", "generated");
codama.accept(
  new renderRustVisitor(rustDir, {
    formatCode: true,
    crateFolder: crateDir,
  })
);
