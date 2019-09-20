import * as bitcoin from 'bitcoinjs-lib';
import ecc from 'tiny-secp256k1';
import { getKeyPairFromMnemonic } from '../crypto';
import config from '../config';

const findKeyByPublicKey = (publicKey) => {
  for (let i = 0; i < 300; i++) {
    const keyPair = getKeyPairFromMnemonic(config.mnemonic, 0, i);
    const keyPairPublic = ecc.pointFromScalar(keyPair.privateKey, false);

    if (keyPairPublic.equals(publicKey)) {
      console.log(`signMessage: Found key at index: ${i}`);
      return keyPair;
    }
  }
};

const signMessage = ({ request }, callback) => {
  console.log(`signMessage(${request.publicKey.toString('hex')})`);

  const { publicKey, message } = request;
  const keyPair = findKeyByPublicKey(publicKey);

  if (!keyPair) {
    const error = new Error('No private key found for specified public key.');
    console.log(error.message);
    return callback(error, null);
  }

  const hash = bitcoin.crypto.hash256(message);
  const signature = keyPair.sign(hash);
  const derSignature = bitcoin.script.signature.encode(signature, 0x01);

  // Chop off the sighash flag at the end of the signature.
  const finalSignature = derSignature.slice(0, derSignature.length - 1);

  callback(null, { signature: finalSignature });
  console.log(`→ ${JSON.stringify(finalSignature)}\n`);
};

export default signMessage;
