const {
  serializeMultisigScript,
  multisigArgs,
} = require("@ckb-lumos/common-scripts/lib/from_info");
const { getConfig, initializeConfig } = require("@ckb-lumos/config-manager");
const {
  generateAddress,
  TransactionSkeleton,
  sealTransaction,
  parseAddress,
  minimalCellCapacity,
} = require("@ckb-lumos/helpers");
const { Indexer } = require("@ckb-lumos/indexer");
const { common } = require("@ckb-lumos/common-scripts");
const { key } = require("@ckb-lumos/hd");
const fs = require("fs");
const { RPC } = require("ckb-js-toolkit");
const { generateTypeIDScript } = require("./typeid");
const { serializeDepGroupData } = require("./dep_group");
const TransactionManager = require("@ckb-lumos/transaction-manager");
const { utils } = require("@ckb-lumos/base");

const data = fs.readFileSync("./build/anyone_can_pay");
const acpData = "0x" + data.toString("hex");

const configFilePath = __dirname + "/config.json";
if (
  process.env.LUMOS_CONFIG_NAME !== "LINA" &&
  process.env.LUMOS_CONFIG_NAME !== "AGGRON4" &&
  fs.existsSync(configFilePath)
) {
  process.env.LUMOS_CONFIG_FILE = configFilePath;
}
initializeConfig();

const config = getConfig();
const multisigTemplate = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
if (!multisigTemplate) {
  throw new Error("Multisig script template missing!");
}

const infos = require("./infos.json");
const multisigScript = infos.multisigScript;

// console.log("multisigScript:", multisigScript)

const serializedMultisigScript = serializeMultisigScript(multisigScript);

const args = multisigArgs(serializedMultisigScript);

const multisigAddress = generateAddress({
  code_hash: multisigTemplate.CODE_HASH,
  hash_type: multisigTemplate.HASH_TYPE,
  args,
});

// money from address
const fromPrivateKey = infos.fromPrivateKey;
const fromBlake160 = key.publicKeyToBlake160(
  key.privateToPublic(fromPrivateKey)
);

const secpTemplate = getConfig().SCRIPTS.SECP256K1_BLAKE160;
const fromAddress = generateAddress({
  code_hash: secpTemplate.CODE_HASH,
  hash_type: secpTemplate.HASH_TYPE,
  args: fromBlake160,
});
console.log("Capacity fromAddress:", fromAddress);

// indexer
const url = "http://localhost:8114";
const dataDir = "./indexer-data";
const indexer = new Indexer(url, dataDir);
indexer.startForever();

const transactionManager = new TransactionManager(indexer);
const rpc = new RPC(url);

function getDataOutputCapacity() {
  const output = {
    cell_output: {
      lock: parseAddress(multisigAddress),
      type: {
        code_hash: "0x" + "0".repeat(64),
        hash_type: "type",
        args: "0x" + "0".repeat(64),
      },
      capacity: "0x0",
    },
    data: acpData,
  };

  const min = minimalCellCapacity(output);
  return min;
}

// console.log("data capacity:", getDataOutputCapacity())

async function main() {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const capacity = getDataOutputCapacity();

  txSkeleton = await common.transfer(
    txSkeleton,
    [fromAddress],
    multisigAddress,
    capacity
  );

  const firstOutput = txSkeleton.get("outputs").get(0);
  firstOutput.data = acpData;
  const firstInput = {
    previous_output: txSkeleton.get("inputs").get(0).out_point,
    since: "0x0",
  };
  const typeIDScript = generateTypeIDScript(firstInput, "0x0");
  const typeScriptHash = utils.computeScriptHash(typeIDScript);
  firstOutput.cell_output.type = typeIDScript;
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.set(0, firstOutput);
  });

  txSkeleton = await common.payFee(
    txSkeleton,
    [fromAddress],
    BigInt(1 * 10 ** 8)
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const message = txSkeleton.get("signingEntries").get(0).message;
  const content = key.signRecoverable(message, fromPrivateKey);

  const tx = sealTransaction(txSkeleton, [content]);

  // console.log("tx:", JSON.stringify(tx, null, 2))

  const txHash = await transactionManager.send_transaction(tx);

  console.log("-".repeat(10) + "acp cell info" + "-".repeat(10));
  console.log("txHash:", txHash);
  console.log("index:", "0x0");
  console.log("type id:", typeScriptHash);

  // dep group
  await generateDepGroupTx({
    tx_hash: txHash,
    index: "0x0",
  });
}
main();

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
// console.log("dep group min capacity:", getDepGroupOutputCapacity())

async function generateDepGroupTx(outPoint) {
  let txSkeleton = TransactionSkeleton({ cellProvider: transactionManager });

  const capacity = getDepGroupOutputCapacity();

  txSkeleton = await common.transfer(
    txSkeleton,
    [fromAddress],
    multisigAddress,
    capacity
  );

  const outPoints = [outPoint, await getSecpDataOutPoint()];
  const outputData = serializeDepGroupData(outPoints);

  const firstOutput = txSkeleton.get("outputs").get(0);
  firstOutput.data = outputData;
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.set(0, firstOutput);
  });

  txSkeleton = await common.payFee(
    txSkeleton,
    [fromAddress],
    BigInt(1 * 10 ** 8)
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const message = txSkeleton.get("signingEntries").get(0).message;
  const content = key.signRecoverable(message, fromPrivateKey);

  const tx = sealTransaction(txSkeleton, [content]);

  // console.log("tx:", JSON.stringify(tx, null, 2))

  const txHash = await transactionManager.send_transaction(tx);

  console.log("-".repeat(10) + "dep group info" + "-".repeat(10));
  console.log("txHash:", txHash);
  console.log("index:", "0x0");
}

// generateDepGroupTx({
//   tx_hash: "0x" + "0".repeat(64),
//   index: "0x0"
// })

async function getSecpDataOutPoint() {
  const genesisBlock = await rpc.get_block_by_number("0x0");
  const transaction = genesisBlock.transactions[0];
  return {
    tx_hash: transaction.hash,
    index: "0x3",
  };
}

// (
//   async function() {
//     console.log("secp data:", await getSecpDataOutPoint())
//   }
// )()
