import assert from 'assert';

import proxyConfig from '../../src/config';
import Proxy from '../../src/Proxy';
import clientConfig from '../mocks/client/config';
import Client from '../mocks/client/Client';

const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

describe('open channel', () => {
  let proxy;
  let client;

  before(() => {
    // Start Pine Lightning proxy.
    proxy = new Proxy(proxyConfig);
    proxy.start();

    // Start client mock.
    client = new Client(clientConfig);
  });

  after(() => {
    return wait(1500)
      .then(() => client.disconnect())
      .then(() => wait(3000))
      .then(() => proxy.stop());
  });

  it('can open channel', () => {
    const sats = '35000';
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.connect()
      .then(() => wait(5000))
      .then(() => {
        if (errors.length) {
          return assert(false, errors[0].message);
        }

        return client.openChannel(sats).then(() => {
          assert(true);
        });
      })
      .catch(error => {
        assert(false, `Unable to open channel: ${error.message}`);
      });
  });
});
