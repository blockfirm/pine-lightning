import * as bip32 from 'bip32';
import * as bip39 from 'bip39';

const PURPOSE_CODE_1017 = 1017;
const COIN_TYPE_TESTNET = 1;

/**
 * Gets a key pair from a mnemonic, account index, and address index.
 *
 * @param {string} mnemonic - A mnemonic of 24 words separated by space.
 * @param {number} accountIndex - Account index to get key pair for (defaults to 0).
 * @param {number} addressIndex - Address index to get key pair for (defaults to 0).
 *
 * @returns {Object} A bitcoinjs key pair that is derived from the bip44 path "m/1017'/1'/${accountIndex}/0/{accountIndex}'".
 */
const getKeyPairFromMnemonic = (mnemonic, accountIndex = 0, addressIndex = 0) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const masterNode = bip32.fromSeed(seed);
  const path = `m/${PURPOSE_CODE_1017}'/${COIN_TYPE_TESTNET}'/${accountIndex}/0/${addressIndex}`;
  const keyPair = masterNode.derivePath(path);

  return keyPair;
};

export default getKeyPairFromMnemonic;
