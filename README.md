# deplay acp script

## Usage

1. Put your acp binary to build dir, such as `build/anyone_can_pay`

2. If dev net, put your lumos config file as `config.json`

3. Copy `infos.example.json` to `infos.json` and put your own data.

4. Run 

```bash
# mainnet
LUMOS_CONFIG_NAME=LINA node index.js

# testnet
LUMOS_CONFIG_NAME=AGGRON4 node index.js

# devnet
node index.js
```
