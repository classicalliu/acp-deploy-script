// initialize lumos config
const { init } = require("./init_config");
init();

const { common } = require("@ckb-lumos/common-scripts");
const {
  TransactionSkeleton,
  parseAddress,
  minimalCellCapacity,
  sealTransaction,
} = require("@ckb-lumos/helpers");
const { RPC } = require("ckb-js-toolkit");
const fs = require("fs");
const { serializeDepGroupData } = require("./dep_group");
const {
  fromAddress,
  multisigAddress,
  fromPrivateKey,
} = require("./multisig_helper");
const { Indexer } = require("@ckb-lumos/indexer");
const { key } = require("@ckb-lumos/hd");

// indexer
const url = "http://localhost:8114";
const dataDir = "./indexer-data";
const indexer = new Indexer(url, dataDir);
indexer.startForever();

const rpc = new RPC(url);

async function main() {
  if (process.argv.length !== 3 || ![0, 1].includes(+process.argv[2])) {
    throw new Error(
      "Please provide one argument, 0 means read from `deploy_result.json` and 1 means read from `deploy_updated_result.json`"
    );
  }

  const acpOutPoint =
    +process.argv[2] === 0 ? getCreatedOutPoint() : getUpdatedOutPoint();

  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const capacity = getDepGroupOutputCapacity();

  txSkeleton = await common.transfer(
    txSkeleton,
    [fromAddress],
    multisigAddress,
    capacity
  );

  const outPoints = [acpOutPoint, await getSecpDataOutPoint()];
  const outputData = serializeDepGroupData(outPoints);

  const firstOutput = txSkeleton.get("outputs").get(0);
  firstOutput.data = outputData;
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.set(0, firstOutput);
  });

  const feeRate = BigInt(1000);
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, [fromAddress], feeRate);

  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const message = txSkeleton.get("signingEntries").get(0).message;
  const content = key.signRecoverable(message, fromPrivateKey);

  const tx = sealTransaction(txSkeleton, [content]);

  // console.log("tx:", JSON.stringify(tx, null, 2))

  const txHash = await rpc.send_transaction(tx);

  console.log("-".repeat(10) + "dep group info" + "-".repeat(10));
  console.log("txHash:", txHash);
  console.log("index:", "0x0");

  const result = {
    tx_hash: txHash,
    index: "0x0",
  };
  fs.writeFileSync("./dep_group.json", JSON.stringify(result, null, 2));
  console.log("Deploy info already write to `dep_group.json`");
  process.exit(0);
}
main();

async function getSecpDataOutPoint() {
  const genesisBlock = await rpc.get_block_by_number("0x0");
  const transaction = genesisBlock.transactions[0];
  return {
    tx_hash: transaction.hash,
    index: "0x3",
  };
}

// read from deploy result
function getCreatedOutPoint() {
  const info = require("./deploy_result.json");
  return {
    tx_hash: info.tx_hash,
    index: info.index,
  };
}

function getUpdatedOutPoint() {
  const info = require("./deploy_updated_result.json");
  return {
    tx_hash: info.tx_hash,
    index: info.index,
  };
}

function getDepGroupOutputCapacity() {
  const outPoints = [
    {
      tx_hash: "0x" + "0".repeat(64),
      index: "0x0",
    },
    {
      tx_hash: "0x" + "0".repeat(64),
      index: "0x0",
    },
  ];

  const output = {
    cell_output: {
      lock: parseAddress(multisigAddress),
      type: undefined,
      capacity: "0x0",
    },
    data: serializeDepGroupData(outPoints),
  };

  const min = minimalCellCapacity(output);
  return min;
}
