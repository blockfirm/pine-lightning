import proxyquire from 'proxyquire';
import { expect } from 'chai';
import btcwalletMock from '../mocks/btcwallet';

const newAddress = proxyquire('../../../src/methods/newAddress', {
  '../btcwallet': { default: btcwalletMock }
}).default;

describe('methods/newAddress.js', () => {
  describe('newAddress()', () => {
    it('returns a new address', (done) => {
      const request = {
        type: 2, // p2sh-p2wpkh 
        change: false
      };

      const expectedResponse = {
        // From the btcwallet mock.
        address: '15KDN6U7TkGub1pYEMKewMgXGQzoQSdHyQ'
      };

      newAddress({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        expect(response).to.deep.equal(expectedResponse);
        done();
      });
    });
  });
});
