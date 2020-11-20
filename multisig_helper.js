const {
  serializeMultisigScript,
  multisigArgs,
} = require("@ckb-lumos/common-scripts/lib/from_info");
const { getConfig, initializeConfig } = require("@ckb-lumos/config-manager");
const { key } = require("@ckb-lumos/hd");
const { generateAddress } = require("@ckb-lumos/helpers");
const fs = require("fs");

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

// console.loga("multisigScript:", multisigScript)

const serializedMultisigScript = serializeMultisigScript(multisigScript);
const args = multisigArgs(serializedMultisigScript);

const multisigLockScript = {
  code_hash: multisigTemplate.CODE_HASH,
  hash_type: multisigTemplate.HASH_TYPE,
  args,
};

const multisigAddress = generateAddress(multisigLockScript);

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

module.exports = {
  multisigScript,
  serializedMultisigScript,
  multisigLockScript,
  multisigAddress,
  fromAddress,
  fromPrivateKey,
};
