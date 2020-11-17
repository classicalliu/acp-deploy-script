const { utils } = require("@ckb-lumos/base");
const { common } = require("@ckb-lumos/common-scripts");
const { TransactionSkeleton } = require("@ckb-lumos/helpers");
const { List, Map } = require("immutable");
const fs = require("fs");

function main() {
  let txSkeleton = getTxSkeleton();
  const input = txSkeleton.get("inputs").get(0);
  const output = txSkeleton.get("outputs").get(0);
  const outputData = output.data;
  const ckbHasher = new utils.CKBHasher();
  ckbHasher.update(outputData);
  const outputDataHash = ckbHasher.digestHex();

  const previousMultisigMessage = txSkeleton
    .get("signingEntries")
    .find((e) => e.index === 0).message;
  const previousSecpMessage =
    txSkeleton.get("signingEntries").size > 1 &&
    txSkeleton.get("signingEntries").find((e) => e.index === 1).message;

  txSkeleton = txSkeleton.update("signingEntries", (_signingEntries) => {
    return List();
  });
  txSkeleton = common.prepareSigningEntries(txSkeleton);
  const newMultisigMessage = txSkeleton
    .get("signingEntries")
    .find((e) => e.index === 0).message;
  const newSecpMessage =
    txSkeleton.get("signingEntries").size > 1 &&
    txSkeleton.get("signingEntries").find((e) => e.index === 1).message;

  const result = {
    destroy_cell_out_point: input.out_point,
    new_cell_data_hash: outputDataHash,
    multisig_message: newMultisigMessage,
    multisig_message_match: newMultisigMessage === previousMultisigMessage,
    secp_message: newSecpMessage,
    secp_message_match: newSecpMessage === previousSecpMessage,
  };
  console.log(result);

  fs.writeFileSync("./check_tx_result.json", JSON.stringify(result, null, 2));
  console.log("Result already write to `check_tx_result.json`");
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
