import { lockedOutpoints } from './lockOutpoint';

const unlockOutpoint = (request) => {
  console.log(`unlockOutpoint(${request.hash.toString('hex')}, ${request.index})`);
  const { hash, index } = request;
  const txid = hash.toString('hex');

  lockedOutpoints[txid] = lockedOutpoints[txid] || {};
  lockedOutpoints[txid][index] = false;

  console.log('→ {}\n');
  return Promise.resolve({});
};

export default unlockOutpoint;
