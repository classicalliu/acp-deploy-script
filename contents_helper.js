const { key } = require("@ckb-lumos/hd");
const { TransactionSkeleton } = require("@ckb-lumos/helpers");
const fs = require("fs");
const { List, Map } = require("immutable");

const privateKeys = [
  "0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14",
  "0x2305f8479f3935f7d7c5b048634bfbb13b3c9d96e3b9f6e911cad87b29af7421",
  "0x72c0420a2ecfbe8a00a036570c6ce774a40cb344a03ede8eccf0279868485547",
  // "0x5f4069132730d32ed5c5a42b732c5d8b12343a86540e86c86d44bea020cc0b9f",
  // "0xcf993bd81247595f11a03f3c5710255f3d62b34531946334845dfe22cb2b1cd4",
];

const secpPrivateKey =
  "0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3";

function main() {
  const txSkeleton = getTxSkeleton();
  let secpContent = "";
  const multisigContents = [];
  txSkeleton
    .get("signingEntries")
    .toJS()
    .forEach((entry) => {
      const index = entry.index;
      const message = entry.message;

      if (index === 0) {
        privateKeys.map((privateKey) => {
          const signed = key.signRecoverable(message, privateKey);
          multisigContents.push(signed);
        });
      } else {
        secpContent = key.signRecoverable(message, secpPrivateKey);
      }
    });

  const result = {
    secp: secpContent,
    multisig: multisigContents,
  };

  fs.writeFileSync("./contents.json", JSON.stringify(result, null, 2));
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
