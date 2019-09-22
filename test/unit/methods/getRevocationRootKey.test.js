import proxyquire from 'proxyquire';
import assert from 'assert';
import configMock from '../mocks/config';

const getRevocationRootKey = proxyquire('../../mocks/client/methods/getRevocationRootKey', {
  '../config': { ...configMock, '@noCallThru': true }
}).default;

describe('test/mocks/client/methods/getRevocationRootKey.js', () => {
  describe('getRevocationRootKey()', () => {
    it('returns a private key', () => {
      const request = {};
      const expectedPrivateKey = Buffer.from('bfd64a37bf9aa89b3437880d0af6197fc79a4bde64c9a6458ccaae9d02dd61cb', 'hex');

      return getRevocationRootKey(request).then(response => {
        assert(response.privateKey.equals(expectedPrivateKey));
      });
    });
  });
});
