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

## managing keys with ckb-cli

To create a public key that can be used in the multi-signing phase, use the following command:

```bash
# ckb-cli account new
Your new account is locked with a password. Please give a password. Do not forget this password.
Password:
Repeat password:
address:
  mainnet: ckb1qyqd5w98547g3p7djujhqgjkw83ctmme4ntqvf4wm9
  testnet: ckt1qyqd5w98547g3p7djujhqgjkw83ctmme4ntq3vt3he
lock_arg: 0xda38a7a57c8887cd972570225671e385ef79acd6
lock_hash: 0x9e3c9e78047998fc26b3f105a6f74238dc31538f9a3cd9481c288e73226488af
```

To sign a message, use the following command:

```bash
ckb-cli util sign-message --recoverable --message 0x3e0b4968a7bd4d6676411120298990d0f625f5b97835587725237949e932a7a8 --from-account ckb1qyqd5w98547g3p7djujhqgjkw83ctmme4ntqvf4wm9
```
