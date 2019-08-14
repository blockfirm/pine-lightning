import ecc from 'tiny-secp256k1';
import { getKeyPairFromMnemonic, signHash, hash256 } from '../crypto';
import config from '../config';

const findKeyByPublicKey = (publicKey) => {
  for (let i = 0; i < 100; i++) {
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

  const hash = hash256(message);
  const signature = signHash(hash, keyPair);

  callback(null, { signature });
};

export default signMessage;
