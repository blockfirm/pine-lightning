import getKeyPairFromMnemonic from '../crypto/getKeyPairFromMnemonic';
import config from '../config';

const deriveKey = (request) => {
  console.log(`deriveKey(${JSON.stringify(request.keyLocator)})`);
  const { keyLocator } = request;
  const { keyFamily } = keyLocator;
  const keyIndex = keyLocator.index;

  const keyPair = getKeyPairFromMnemonic(
    config.mnemonic,
    keyFamily,
    keyIndex
  );

  const keyDescriptor = {
    publicKey: keyPair.publicKey,
    keyLocator
  };

  console.log(`→ { ${JSON.stringify(keyDescriptor)} }\n`);
  return Promise.resolve({ keyDescriptor });
};

export default deriveKey;
