import secp256k1 from 'secp256k1';

/**
 * Gets a signature of a hash signed by the specified key.
 *
 * @param {Buffer} hash - Hash to sign.
 * @param {Object} keyPair - bitcoinjs key pair.
 *
 * @returns {Buffer} A DER-encoded secp256k1 signature of the specified hash.
 */
const signHash = (hash, keyPair) => {
  const signature = secp256k1.sign(hash, keyPair.privateKey);
  const derSignature = secp256k1.signatureExport(signature.signature);

  return derSignature;
};

export default signHash;
