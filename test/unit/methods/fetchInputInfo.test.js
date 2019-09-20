import proxyquire from 'proxyquire';
import { expect } from 'chai';

import configMock from '../mocks/config';
import btcwalletMock from '../mocks/btcwallet';

const fetchInputInfo = proxyquire('../../../src/methods/fetchInputInfo', {
  '../config': { ...configMock, '@noCallThru': true },
  '../btcwallet': { default: btcwalletMock }
}).default;

describe('methods/fetchInputInfo.js', () => {
  describe('fetchInputInfo()', () => {
    it('returns ', (done) => {
      const request = {
        hash: Buffer.from('3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a', 'hex'), // From the btcwallet mock.
        index: 0
      };

      const expectedInputInfo = {
        // From the btcwallet mock.
        pkScript: Buffer.from('14836dbe7f38c5ac3d49e8d790af808a4ee9edcf', 'hex'),
        value: 25000000
      };

      fetchInputInfo({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        expect(response).to.deep.equal(expectedInputInfo);
        done();
      });
    });
  });
});
