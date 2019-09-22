export const lockedOutpoints = {};

const lockOutpoint = (request) => {
  console.log(`lockOutpoint(${request.hash.toString('hex')}, ${request.index})`);
  const { hash, index } = request;
  const txid = hash.toString('hex');

  lockedOutpoints[txid] = lockedOutpoints[txid] || {};
  lockedOutpoints[txid][index] = true;

  console.log('→ {}\n');
  return Promise.resolve({});
};

export default lockOutpoint;
