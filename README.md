# deplay acp script

## Usage

### Deploy

1. Put your acp binary to build dir, named `build/anyone_can_pay`

2. If dev net, put your lumos config file to `config.json`

3. Copy `infos.example.json` to `infos.json` and put your own data.

4. Run 

```bash
# devnet
yarn run dev:deploy
# testnet
yarn run aggron4:deploy
# mainnet
yarn run lina:deploy
```

5. Deploy info will write to `deploy_result.json`

such as

```json
{
  "tx_hash": "0x0ceede1975e94645b6ab0aad194421f55053d0a3fbd1b8c54085141bfe4760e7",
  "index": "0x0",
  "type_id": "0x2645ae3c60990b71f5ff79d1605c54558c0b7d630908f48d49cd8bc8a8519fd3"
}
```

### generate update tx

1. Make sure your `deploy_result.json` has `tx_hash` and `index` value for previous cell

2. Inputs for fee will pay from `infos.json` `fromPrivateKey`

3. Run 

```bash
# dev
yarn run dev:generate_update_tx
# testnet
yarn run aggron4:generate_update_tx
# mainnet
yarn run lina:generate_update_tx
```

4. Generated tx info will write to `tx.json`

5. Create `contents.json` file sush as `contents.example.json`

6. sign message with `index=0` for deployed cell, fill in `multisig` in `contents.json`

7. sign message with `index=1` if exists, is for fee (if have), and fill in `secp` in `contents.json`

### deploy updated

1. Make sure your `tx.json` and `contents.json` exits.

2. Run

```bash
# dev
yarn run dev:deploy_updated
# testnet
yarn run aggron4:deploy_updated
# mainnet
yarn run lina:deploy_updated
```
