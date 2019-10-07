import assert from 'assert';
import { spawn } from 'child_process';

import proxyConfig from '../../src/config';
import Proxy from '../../src/Proxy';
import clientConfig from '../mocks/client/config';
import Client from '../mocks/client/Client';

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

describe('integration between Pine lnd and client', () => {
  let proxy;
  let client;

  before(() => {
    return generateBlocks(10).then(() => {
      // Start Pine Lightning proxy.
      proxy = new Proxy(proxyConfig);
      proxy.start();

      // Start client mock.
      client = new Client(clientConfig);
    });
  });

  after(() => {
    return wait(1500)
      .then(() => client.disconnect())
      .then(() => wait(3000))
      .then(() => proxy.stop());
  });

  afterEach(() => {
    client.removeAllListeners();
    return generateBlocks(10).then(() => wait(1500));
  });

  it('can connect successfully', () => {
    const responses = [];
    const errors = [];

    client.on('response', response => responses.push(response));
    client.on('error', error => errors.push(error));

    return client.connect()
      .then(() => wait(5000))
      .then(() => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(true);
        }
      })
      .catch(error => {
        assert(false, `Unable to connect to Pine Lightning: ${error.message}`);
      });
  });

  it('can open channel', () => {
    const sats = '35000';
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.openChannel(sats)
      .then(() => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(true);
        }
      })
      .catch(error => {
        assert(false, `Unable to open channel: ${error.message}`);
      });
  });

  it('cannot open another channel', () => {
    const sats = '45000';
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.openChannel(sats)
      .then(() => {
        assert(false, 'Client managed to open two channels');
      })
      .catch(error => {
        if (!error.message.includes('channel has already been opened')) {
          assert(false, `Error when opening second channel: ${error.message}`);
        }
      });
  });

  it('can get channel balance', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.getBalance()
      .then(balance => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(balance.capacity === '35000', 'Returned capacity is incorrect');
          assert(balance.local === '25950', 'Returned local balance is incorrect');
        }
      })
      .catch(error => {
        assert(false, `Unable to get channel balance: ${error.message}`);
      });
  });

  it('can close channel', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.closeChannel()
      .then(() => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(true);
        }
      })
      .catch(error => {
        assert(false, `Unable to close channel: ${error.message}`);
      });
  });
});
