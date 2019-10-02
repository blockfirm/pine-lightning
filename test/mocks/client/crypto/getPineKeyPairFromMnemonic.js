import * as bip32 from 'bip32';
import * as bip39 from 'bip39';

const PURPOSE_CODE_428 = 428;

/**
 * Gets a key pair from a mnemonic to be used with the Pine Payment Protocol.
 *
 * @param {string} mnemonic - A mnemonic of 12 to 24 words separated by space.
 * @param {number} accountIndex - Account index to get key pair for (defaults to 0).
 *
 * @returns {Object} A bitcoinjs key pair that is derived from the bip32 path "m/428'/{accountIndex}'".
 */
const getPineKeyPairFromMnemonic = (mnemonic, accountIndex = 0) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const masterNode = bip32.fromSeed(seed);
  const path = `m/${PURPOSE_CODE_428}'/${accountIndex}'`;
  const keyPair = masterNode.derivePath(path);

  keyPair.compressed = true;

  return keyPair;
};

export default getPineKeyPairFromMnemonic;
