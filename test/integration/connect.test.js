import assert from 'assert';

import proxyConfig from '../../src/config';
import Proxy from '../../src/Proxy';
import clientConfig from '../mocks/client/config';
import Client from '../mocks/client/Client';

const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

describe('connect', () => {
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

  it('connects successfully', () => {
    const responses = [];
    const errors = [];

    client.on('response', response => responses.push(response));
    client.on('error', error => errors.push(error));

    return client.connect()
      .then(() => wait(5000))
      .then(() => {
        if (errors.length) {
          return assert(false, errors[0].message);
        }

        if (!responses.length) {
          return assert(false, 'Missing response from client');
        }

        const expectedPublicKey = '03d0555ecaa4d75daa0ad254b4093a0e32a9fed98331b37c465ef01345ff7918f6';
        const keyDescriptor = responses[0].keyDescriptor;

        assert(keyDescriptor, 'Response is missing key descriptor');
        assert(keyDescriptor.publicKey, 'Response is missing public key');

        assert(
          keyDescriptor.publicKey.equals(Buffer.from(expectedPublicKey, 'hex')),
          'Public key does not match expected public key'
        );
      })
      .catch(error => {
        assert(false, `Unable to connect to Pine Lightning: ${error.message}`);
      });
  });
});
