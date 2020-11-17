const { RPC } = require("ckb-js-toolkit");
const fs = require("fs");

const url = "http://localhost:8114";
const rpc = new RPC(url);

async function main() {
  if (process.argv.length !== 3 || ![0, 1].includes(+process.argv[2])) {
    throw new Error(
      "Please provide one argument, 0 means read from `deploy_result.json` and 1 means read from `deploy_updated_result.json`"
    );
  }

  const acpOutPoint =
    +process.argv[2] === 0 ? getCreatedOutPoint() : getUpdatedOutPoint();

  const result = [
    {
      out_point: acpOutPoint,
      dep_type: "code",
    },
    {
      out_point: await getSecpDataOutPoint(),
      dep_type: "code",
    },
  ];

  console.log(result);

  fs.writeFileSync("./dep_group.json", JSON.stringify(result, null, 2));
  console.log("dep group info already wirte to `dep_group.json`");
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
