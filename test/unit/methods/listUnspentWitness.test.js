import proxyquire from 'proxyquire';
import { expect } from 'chai';

import configMock from '../mocks/config';
import btcwalletMock from '../mocks/btcwallet';

const listUnspentWitness = proxyquire('../../mocks/client/methods/listUnspentWitness', {
  '../config': { ...configMock, '@noCallThru': true },
  '../btcwallet': { default: btcwalletMock }
}).default;

describe('test/mocks/client/methods/listUnspentWitness.js', () => {
  describe('listUnspentWitness()', () => {
    it('returns utxos', () => {
      const request = {
        minConfirmations: 3,
        maxConfirmations: null
      };

      const expectedResponse = {
        utxos: [{
          addressType: 2,
          confirmations: 100,

          // From the btcwallet mock.
          transactionHash: Buffer.from('3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a', 'hex'),
          pkScript: Buffer.from('14836dbe7f38c5ac3d49e8d790af808a4ee9edcf', 'hex'),
          value: 25000000,
          vout: 0
        }]
      };

      return listUnspentWitness(request).then(response => {
        expect(response).to.deep.equal(expectedResponse);
      });
    });
  });
});
