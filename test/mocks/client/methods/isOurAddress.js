import * as bitcoin from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import config from '../config';

const getKeyPairByIndex = (addressIndex) => {
  const seed = bip39.mnemonicToSeedSync(config.mnemonic);
  const masterNode = bip32.fromSeed(seed, bitcoin.networks.testnet);

  const purpose = 44;
  const coinType = 0; // Mainnet
  const accountIndex = 0;
  const change = 0; // External
  const path = `m/${purpose}'/${coinType}'/${accountIndex}'/${change}/${addressIndex}`;
  const node = masterNode.derivePath(path);

  return node;
};

const getAddressForPublicKey = (publicKey) => {
  const p2pkh = bitcoin.payments.p2pkh({
    pubkey: publicKey,
    network: bitcoin.networks.regtest
  });

  return p2pkh.address;
};

const findKeyByAddress = (address) => {
  for (let index = 0; index < 300; index++) {
    const keyPair = getKeyPairByIndex(index);
    const pubKeyAddress = getAddressForPublicKey(keyPair.publicKey);

    if (pubKeyAddress === address) {
      return keyPair;
    }
  }
};

const isOurAddress = (request) => {
  console.log(`isOurAddress(${request.address})`);
  const { address } = request;
  const keyPair = findKeyByAddress(address);
  const result = Boolean(keyPair);

  console.log(`→ ${result}\n`);
  return Promise.resolve({ isOurAddress: result });
};

export default isOurAddress;
