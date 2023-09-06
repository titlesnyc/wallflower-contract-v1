
# Background
Tutorial on how to deploy contracts using forge by foundry to Zora

## Setup
Follow [this tutorial](https://book.getfoundry.sh/getting-started/installation) to set up foundry and forge in your terminal

Depending on your wallet setup, see the `forge create` [documentation](https://book.getfoundry.sh/reference/forge/forge-create)

There are several different wallet options available, the examples below assume you are providing a private key rather than a mnemonic

## Commands

**Deploying Edition Contract**
```bash
forge create contracts/TestEditionV1.sol:TestEditionV1 \
  --chain-id 999 \
  --rpc-url https://testnet.rpc.zora.energy/ \
  --private-key <private_key> \
  --via-ir
  --verifier blockscout \ 
  --verifier-url https://testnet.explorer.zora.energy/api\?

```


**Deploying Publisher Contract**
```bash
forge create contracts/TestPublisherV1.sol:TestPublisherV1 \
  --chain-id 999 \
  --rpc-url https://testnet.rpc.zora.energy/ \
  --private-key <private_key> \
  --via-ir \
  --constructor-args <split_address> <controller_eoa> <distributor_fee> <secondary_royalty> <implementation_address>
  --verify \
  --verifier blockscout \ 
  --verifier-url https://testnet.explorer.zora.energy/api\?
```


## Verification
Looks like verification doesn't work outright because compilation of the `PublisherV1` contract is done with `--via-ir`.  Need to run verify-contract command with output-json flag to get JSON, manually edit the JSON to include `"viaIR": true` and then upload manually to blockscout.

See discussion [here](https://github.com/foundry-rs/foundry/issues/3507#issuecomment-1465382107) for more information

**Steps**
1. Deploy contract via instructions above
2. Create text file with constructor args (see example)
3. Output JSON file
4. Edit JSON file to include viaIR flag
5. Upload to blockscout manually

**Example Command**
```zsh
forge verify-contract <address> \
  contracts/TestPublisherV1.sol:TestPublisherV1 \
  --watch \
  --verifier blockscout \
  --verifier-url https://testnet.explorer.zora.energy/api\? \
  --constructor-args-path constructor_args.txt \
  --show-standard-json-input > output.json
```