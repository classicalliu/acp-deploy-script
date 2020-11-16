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
} = require("@ckb-lumos/helpers");
const { Indexer } = require("@ckb-lumos/indexer");
const { common } = require("@ckb-lumos/common-scripts");
const { key } = require("@ckb-lumos/hd");
const { RPC } = require("ckb-js-toolkit");

process.env.LUMOS_CONFIG_FILE = __dirname + "/config.json";
initializeConfig();

const config = getConfig();
const multisigTemplate = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
if (!multisigTemplate) {
  throw new Error("Multisig script template missing!");
}

const multisigScript = {
  R: 0,
  M: 3,
  publicKeyHashes: [
    "0x89cba48c68b3978f185df19f31634bb870e94639",
    "0x0ce445e32d7f91c9392485ddb9bc6885ce46ad64",
    "0xc337da539e4d0b89daad1370b945f7210fad4c43",
    "0xd9a188cc1985a7d4a31f141f4ebb61f241aec182",
    "0xebf9befcd8396e88cab8fcb920ab149231658f4b",
  ],
};

const privateKeys = [
  "0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14",
  "0x2305f8479f3935f7d7c5b048634bfbb13b3c9d96e3b9f6e911cad87b29af7421",
  "0x72c0420a2ecfbe8a00a036570c6ce774a40cb344a03ede8eccf0279868485547",
  "0x5f4069132730d32ed5c5a42b732c5d8b12343a86540e86c86d44bea020cc0b9f",
  "0xcf993bd81247595f11a03f3c5710255f3d62b34531946334845dfe22cb2b1cd4",
];

const serializedMultisigScript = serializeMultisigScript(multisigScript);

const args = multisigArgs(serializedMultisigScript);

const multisigAddress = generateAddress(
  {
    code_hash: multisigTemplate.CODE_HASH,
    hash_type: multisigTemplate.HASH_TYPE,
    args,
  },
  { config }
);

// money from address
const fromAddress = "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83";
const fromPrivateKey =
  "0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3";

// indexer
const url = "http://localhost:8114";
const dataDir = "./indexer-data";
const indexer = new Indexer(url, dataDir);
indexer.startForever();

const rpc = new RPC(url);

async function testLiveCell() {
  const collector = indexer.collector({
    lock: parseAddress(multisigAddress),
  });

  let count = 0;
  for await (const cell of collector.collect()) {
    console.log("cell:", cell);
    count += 1;
  }

  console.log("count:", count);
}
// testLiveCell()

async function destroy() {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  txSkeleton = await common.transfer(
    txSkeleton,
    [multisigScript],
    fromAddress,
    BigInt(61 * 10 ** 8)
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const message = txSkeleton.get("signingEntries").get(0).message;

  let content = serializedMultisigScript;
  for (i = 0; i < 3; i++) {
    content += key.signRecoverable(message, privateKeys[i]).slice(2);
  }

  console.log("content:", content);

  const tx = sealTransaction(txSkeleton, [content]);

  console.log("tx:", JSON.stringify(tx, null, 2));

  const txHash = await rpc.send_transaction(tx);
  console.log("txHash:", txHash);
}

// destroy();
