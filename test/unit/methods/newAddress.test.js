import proxyquire from 'proxyquire';
import { expect } from 'chai';
import btcwalletMock from '../mocks/btcwallet';

const newAddress = proxyquire('../../mocks/client/methods/newAddress', {
  '../btcwallet': { default: btcwalletMock }
}).default;

describe('test/mocks/client/methods/newAddress.js', () => {
  describe('newAddress()', () => {
    it('returns a new address', () => {
      const request = {
        type: 2, // p2sh-p2wpkh
        change: false
      };

      const expectedResponse = {
        // From the btcwallet mock.
        address: '15KDN6U7TkGub1pYEMKewMgXGQzoQSdHyQ'
      };

      return newAddress(request).then(response => {
        expect(response).to.deep.equal(expectedResponse);
      });
    });
  });
});
