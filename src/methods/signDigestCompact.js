import { getKeyPairFromMnemonic, signHash } from '../crypto';
import config from '../config';

const signDigestCompact = (hash) => {
  const keyPair = getKeyPairFromMnemonic(config.mnemonic);
  const signature = signHash(hash, keyPair);

  return signature;
};

export default signDigestCompact;
