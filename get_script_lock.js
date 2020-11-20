// initialize lumos config
const { init } = require("./init_config");
init();

const { multisigLockScript } = require("./multisig_helper");

function main() {
  console.log("--- lock script ---");
  console.log(multisigLockScript);
}
main();
