const { Indexer } = require("@ckb-lumos/indexer");
const { RPC } = require("ckb-js-toolkit");

const url = "http://localhost:8114";
const dataDir = "./indexer-data";
const indexer = new Indexer(url, dataDir);
indexer.startForever();

const rpc = new RPC(url);

setInterval(async () => {
  const tip = await indexer.tip();
  const nodeTip = await rpc.get_tip_block_number();

  console.log("---------------------------------------");
  console.log("node tip:\t", BigInt(nodeTip));
  console.log("indexer tip:\t", BigInt(tip.block_number));
  console.log("\n");
}, 1000);
