import assert from 'assert';
import { spawn } from 'child_process';
import createLnrpc from 'lnrpc';

const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const runCmd = (cmd, args) => {
  const child = spawn(cmd, args);

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        return resolve();
      }

      reject();
    });
  });
};

const generateBlocks = (numberOfBlocks) => {
  const args = [
    '--simnet',
    '--rpcuser=LHb574e7pzDNhUIsTaJguQAw7iA',
    '--rpcpass=UZgaYSJwBgao2HCh+ywKNhBPOJA',
    'generate',
    numberOfBlocks
  ];

  return runCmd('btcctl', args);
};

describe('openchannel', () => {
  let lnrpc;

  before(() => {
    const macaroonPath = '/home/timothy/go/dev/alice/data/chain/bitcoin/simnet/admin.macaroon';

    return createLnrpc({ macaroonPath })
      .then(rpc => {
        lnrpc = rpc;
        return generateBlocks(10);
      })
      .then(() => wait(1000));
  });

  it('opens a channel', () => {
    const nodePubKey = '03a2e519c18af595810be478fa65ea4832ccc1e174d19386849860c5a9013e73d8';
    const amount = 20000;

    return lnrpc.openChannelSync({ node_pubkey_string: nodePubKey, local_funding_amount: amount })
      .then(() => { assert(true, 'Channel opened'); })
      .catch((error) => { assert(false, 'Could not open channel: ' + error.message); });
  });
});
