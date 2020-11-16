const fs = require("fs");
const { initializeConfig } = require("@ckb-lumos/config-manager");

function init() {
  const configFilePath = __dirname + "/config.json";
  if (
    process.env.LUMOS_CONFIG_NAME !== "LINA" &&
    process.env.LUMOS_CONFIG_NAME !== "AGGRON4" &&
    fs.existsSync(configFilePath)
  ) {
    process.env.LUMOS_CONFIG_FILE = configFilePath;
  }
  initializeConfig();
}

module.exports = {
  init,
};
