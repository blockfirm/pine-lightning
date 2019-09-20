import proxyquire from 'proxyquire';
import assert from 'assert';
import configMock from '../mocks/config';

const getRevocationRootKey = proxyquire('../../../src/methods/getRevocationRootKey', {
  '../config': { ...configMock, '@noCallThru': true }
}).default;

describe('methods/getRevocationRootKey.js', () => {
  describe('getRevocationRootKey()', () => {
    it('returns a private key', (done) => {
      const request = {};

      const expectedPrivateKey = Buffer.from('bfd64a37bf9aa89b3437880d0af6197fc79a4bde64c9a6458ccaae9d02dd61cb', 'hex');

      getRevocationRootKey({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        assert(response.privateKey.equals(expectedPrivateKey));
        done();
      });
    });
  });
});
