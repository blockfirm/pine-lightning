import secp256k1 from 'secp256k1';

const encodeSignature = (signature, compressed) => {
  let { recovery } = signature;

  if (compressed) {
    recovery += 4;
  }

  return Buffer.concat([
    Buffer.alloc(1, recovery + 27),
    signature.signature
  ]);
};

/**
 * Gets a signature of a hash signed by the specified key.
 *
 * @param {Buffer} hash - Hash to sign.
 * @param {Object} keyPair - bitcoinjs key pair.
 *
 * @returns {Buffer} A secp256k1 signature of the specified hash.
 */
const signHash = (hash, keyPair) => {
  const signature = secp256k1.sign(hash, keyPair.privateKey);
  return encodeSignature(signature, keyPair.compressed);
};

export default signHash;
