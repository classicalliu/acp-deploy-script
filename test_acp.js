const { common } = require("@ckb-lumos/common-scripts");
const { getConfig, initializeConfig } = require("@ckb-lumos/config-manager");
const { key } = require("@ckb-lumos/hd");
const {
  TransactionSkeleton,
  generateAddress,
  sealTransaction,
  parseAddress,
} = require("@ckb-lumos/helpers");
const { Indexer } = require("@ckb-lumos/indexer");
const { RPC } = require("ckb-js-toolkit");
const { List } = require("immutable");

process.env.LUMOS_CONFIG_FILE = __dirname + "/config.json";
initializeConfig();

const url = "http://localhost:8114";
const dataDir = "./indexer-data";
const indexer = new Indexer(url, dataDir);
indexer.startForever();

const rpc = new RPC(url);

// money from address
const fromAddress = "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83";
const fromPrivateKey =
  "0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3";
const blake160 = "0x36c329ed630d6ce750712a477543672adab57f4c";

function generateAcpAddress(args) {
  const template = getConfig().SCRIPTS.ANYONE_CAN_PAY;
  const script = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args,
  };

  const address = generateAddress(script, { config: getConfig() });
  return address;
}

const acpAddress = generateAcpAddress(blake160);

async function sendToAcp() {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const capacity = BigInt(1000 * 10 ** 8);
  const output = {
    cell_output: {
      lock: parseAddress(acpAddress),
      capacity: "0x" + capacity.toString(16),
    },
    data: "0x",
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(output);
  });

  txSkeleton = await common.injectCapacity(txSkeleton, [fromAddress], capacity);

  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const message = txSkeleton.get("signingEntries").get(0).message;
  const content = key.signRecoverable(message, fromPrivateKey);

  const tx = sealTransaction(txSkeleton, [content]);

  console.log("tx:", JSON.stringify(tx, null, 2));

  const txHash = await rpc.send_transaction(tx);
  console.log("txHash:", txHash);
}

async function payFromAcp() {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const capacity = BigInt(100 * 10 ** 8);

  txSkeleton = await common.transfer(
    txSkeleton,
    [acpAddress],
    fromAddress,
    capacity
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const message = txSkeleton.get("signingEntries").get(0).message;
  const content = key.signRecoverable(message, fromPrivateKey);

  const tx = sealTransaction(txSkeleton, [content]);

  console.log("tx:", JSON.stringify(tx, null, 2));

  const txHash = await rpc.send_transaction(tx);
  console.log("txHash:", txHash);
}

// sendToAcp()
// payFromAcp()
