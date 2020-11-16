// initialize lumos config
const { init } = require("./init_config");
init();

const { common } = require("@ckb-lumos/common-scripts");
const {
  TransactionSkeleton,
  minimalCellCapacity,
} = require("@ckb-lumos/helpers");
const { Indexer } = require("@ckb-lumos/indexer");
const { RPC } = require("ckb-js-toolkit");
const { fromAddress, multisigScript } = require("./multisig_helper");
const fs = require("fs");

// indexer
const url = "http://localhost:8114";
const dataDir = "./indexer-data";
const indexer = new Indexer(url, dataDir);
indexer.startForever();

const rpc = new RPC(url);

const deployResult = require("./deploy_result.json");
const inputOutPoint = {
  tx_hash: deployResult.tx_hash,
  index: deployResult.index,
};

async function getInput(outPoint) {
  const txWithStatus = await rpc.get_transaction(outPoint.tx_hash);
  const tx = txWithStatus.transaction;
  const index = +outPoint.index;
  const output = tx.outputs[index];
  const data = tx.outputs_data[index];

  const blockHash = txWithStatus.tx_status.block_hash;
  const header = await rpc.get_header(blockHash);
  const blockNumber = header.number;

  const cell = {
    cell_output: {
      capacity: output.capacity,
      lock: output.lock,
      type: output.type,
    },
    data: data,
    out_point: outPoint,
    block_hash: blockHash,
    block_number: blockNumber,
  };

  return cell;
}

// (
//   async function() {
//     console.log("getInput:", await getInput(inputOutPoint))
//   }
// )()

async function getOutput(input) {
  const data = fs.readFileSync("./build/anyone_can_pay");
  const acpData = "0x" + data.toString("hex");

  const output = {
    cell_output: {
      capacity: "0x0",
      lock: input.cell_output.lock,
      type: input.cell_output.type,
    },
    data: acpData,
  };

  const min = minimalCellCapacity(output);
  output.cell_output.capacity = "0x" + min.toString(16);

  return output;
}

async function main() {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  // set input
  const input = await getInput(inputOutPoint);
  txSkeleton = await common.setupInputCell(txSkeleton, input, multisigScript);
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.remove(0);
  });

  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "inputs",
      index: 0,
    });
  });

  const inputCapacity = BigInt(input.cell_output.capacity);

  // set output
  const output = await getOutput(input);
  const outputCapacity = BigInt(output.cell_output.capacity);
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(output);
  });
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "outputs",
      index: 0,
    });
  });

  const needCacacity = outputCapacity - inputCapacity;

  if (needCacacity !== 0n) {
    txSkeleton = await common.injectCapacity(
      txSkeleton,
      [fromAddress],
      needCapacity
    );
  }

  txSkeleton = await common.payFee(
    txSkeleton,
    [fromAddress],
    BigInt(1 * 10 ** 8)
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const txStr = JSON.stringify(txSkeleton.toJS(), null, 2);
  fs.writeFileSync("./tx.json", txStr);
  console.log("transaction already write to `tx.json`");
  process.exit(0);
}
main();
