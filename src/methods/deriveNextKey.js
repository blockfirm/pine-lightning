import getKeyPairFromMnemonic from '../crypto/getKeyPairFromMnemonic';
import config from '../config';

const deriveNextKey = ({ request }, callback) => {
  console.log(`deriveNextKey(${request.keyFamily})`);
  const { keyFamily } = request; // TODO: Only allow certain key families.
  const keyIndex = 0; // TODO: Should increment so that a new key is always returned.

  const keyPair = getKeyPairFromMnemonic(
    config.mnemonic,
    keyFamily,
    keyIndex
  );

  const keyDescriptor = {
    publicKey: keyPair.publicKey,
    keyLocator: {
      keyFamily,
      index: keyIndex
    }
  };

  callback(null, { keyDescriptor });
  console.log(`→ { keyDescriptor }\n`);
};

export default deriveNextKey;
