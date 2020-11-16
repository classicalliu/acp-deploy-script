// initialize lumos config
const { init } = require("./init_config");
init();

const { key } = require("@ckb-lumos/hd");
const { TransactionSkeleton, sealTransaction } = require("@ckb-lumos/helpers");
const { Indexer } = require("@ckb-lumos/indexer");
const { RPC } = require("ckb-js-toolkit");
const { List, Map } = require("immutable");
const { serializedMultisigScript } = require("./multisig_helper");
const fs = require("fs");
const { exit } = require("process");

// indexer
const url = "http://localhost:8114";
const dataDir = "./indexer-data";
const indexer = new Indexer(url, dataDir);
indexer.startForever();

const rpc = new RPC(url);

async function main() {
  const txSkeleton = getTxSkeleton();

  const contents = getContents();

  const tx = sealTransaction(txSkeleton, contents);
  const txHash = await rpc.send_transaction(tx);
  console.log("txHash:", txHash);

  const result = JSON.stringify(
    {
      tx_hash: txHash,
      index: "0x0",
    },
    null,
    2
  );
  fs.writeFileSync("./deploy_updated_result.json", result);
  console.log("new tx_hash already write to file `deploy_updated_result.json`");

  exit(0);
}
main();

function getTxSkeleton() {
  const skeleton = require("./tx.json");
  const txSkeleton = TransactionSkeleton({
    cellProvider: skeleton.cellProvider,
    cellDeps: List(skeleton.cellDeps),
    headerDeps: List(skeleton.headerDeps),
    inputs: List(skeleton.inputs),
    outputs: List(skeleton.outputs),
    witnesses: List(skeleton.witnesses),
    fixedEntries: List(skeleton.fixedEntries),
    signingEntries: List(skeleton.signingEntries),
    inputSinces: Map(skeleton.inputSinces),
  });

  return txSkeleton;
}
// getTxSkeleton()

// test helper
function getContentsHelper() {
  const txSkeleton = getTxSkeleton();
  const contents = txSkeleton
    .get("signingEntries")
    .toJS()
    .map((entry) => {
      const index = entry.index;
      const message = entry.message;

      if (index === 0) {
        let content = serializedMultisigScript;

        privateKeys.map((privateKey) => {
          const signed = key.signRecoverable(message, privateKey);
          console.log("index = 0, signed:", signed);
          content += signed.slice(2);
        });
        return content;
      } else {
        const signed = key.signRecoverable(message, secpPrivateKey);
        console.log("index = 1", signed);
        return signed;
      }
    });

  console.log("contents:", contents);

  return contents;
}
// getContentsHelper()

function getContents() {
  const txSkeleton = getTxSkeleton();

  const c = require("./contents.json");

  const contents = txSkeleton
    .get("signingEntries")
    .toJS()
    .map((entry) => {
      const index = entry.index;

      if (index === 0) {
        let content = serializedMultisigScript;

        c.multisig.forEach((signed) => {
          content += signed.slice(2);
        });

        return content;
      } else {
        return c.secp;
      }
    });

  return contents;
}
