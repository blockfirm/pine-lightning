import signMessage from './signMessage';
import listUnspentWitness from './listUnspentWitness';
import lockOutpoint from './lockOutpoint';
import unlockOutpoint from './unlockOutpoint';
import newAddress from './newAddress';
import isOurAddress from './isOurAddress';
import fetchInputInfo from './fetchInputInfo';
import signOutputRaw from './signOutputRaw';
import computeInputScript from './computeInputScript';
import getRevocationRootKey from './getRevocationRootKey';
import deriveNextKey from './deriveNextKey';
import deriveKey from './deriveKey';

export default {
  signMessage,
  listUnspentWitness,
  lockOutpoint,
  unlockOutpoint,
  newAddress,
  isOurAddress,
  fetchInputInfo,
  signOutputRaw,
  computeInputScript,
  getRevocationRootKey,
  deriveNextKey,
  deriveKey
};

