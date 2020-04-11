import getKeyPairFromMnemonic from '../crypto/getKeyPairFromMnemonic';
import config from '../config';

const KEY_FAMILY_REVOCATION_ROOT = 5;

const getRevocationRootKey = ({ keyIndex }) => {
  console.log(`getRevocationRootKey(${keyIndex})`);

  const keyPair = getKeyPairFromMnemonic(
    config.mnemonic,
    KEY_FAMILY_REVOCATION_ROOT,
    keyIndex
  );

  const privateKey = keyPair.privateKey;

  console.log(`→ { privateKey: <${privateKey.length}> }\n`);
  return Promise.resolve({ privateKey });
};

export default getRevocationRootKey;
