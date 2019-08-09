import { getKeyPairFromMnemonic, signHash } from '../crypto';
import config from '../config';

const signDigestCompact = ({ request }, callback) => {
  const keyPair = getKeyPairFromMnemonic(config.mnemonic);
  const signature = signHash(request.hash, keyPair);

  callback(null, { signature });
};

export default signDigestCompact;
