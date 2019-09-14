export const lockedOutpoints = {};

const lockOutpoint = ({ request }, callback) => {
  console.log(`lockOutpoint(${request.hash.toString('hex')}, ${request.index})`);
  const { hash, index } = request;
  const txid = hash.toString('hex');

  lockedOutpoints[txid] = lockedOutpoints[txid] || {};
  lockedOutpoints[txid][index] = true;

  callback(null, {});
  console.log('→ {}\n');
};

export default lockOutpoint;
