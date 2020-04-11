import getKeyPairFromMnemonic from '../crypto/getKeyPairFromMnemonic';
import config from '../config';

const deriveNextKey = (request) => {
  console.log(`deriveNextKey(${JSON.stringify(request)})`);
  const { keyFamily, keyIndex } = request; // TODO: Only allow certain key families.

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

  console.log(`→ { keyDescriptor }\n`);
  return Promise.resolve({ keyDescriptor });
};

export default deriveNextKey;
