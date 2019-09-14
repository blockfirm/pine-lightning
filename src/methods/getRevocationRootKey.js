import getKeyPairFromMnemonic from '../crypto/getKeyPairFromMnemonic';
import config from '../config';

const KEY_FAMILY_REVOCATION_ROOT = 5;

const getRevocationRootKey = ({ request }, callback) => {
  console.log(`getRevocationRootKey()`);
  const keyIndex = 0; // TODO: Should increment so that a new key is always returned.

  const keyPair = getKeyPairFromMnemonic(
    config.mnemonic,
    KEY_FAMILY_REVOCATION_ROOT,
    keyIndex
  );

  const { privateKey } = keyPair.privateKey;

  callback(null, { privateKey });
  console.log(`→ { privateKey: <${privateKey.length}> }\n`);
};

export default getRevocationRootKey;
