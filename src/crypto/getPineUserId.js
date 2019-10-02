import * as bitcoin from 'bitcoinjs-lib';
import bs58check from 'bs58check';

/**
 * Gets a Pine User ID from a public key.
 *
 * @param {Buffer} publicKey - A compressed public key derived from the user's private key.
 *
 * @returns {string} A Hash 160 hash of the user's public key that can be used to verify signatures.
 */
const getPineUserId = (publicKey) => {
  const hash = bitcoin.crypto.hash160(publicKey);
  const userId = bs58check.encode(hash);

  return userId;
};

export default getPineUserId;
