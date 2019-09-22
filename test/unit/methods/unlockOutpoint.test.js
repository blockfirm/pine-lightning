import { expect } from 'chai';
import unlockOutpoint from '../../mocks/client/methods/unlockOutpoint';

describe('test/mocks/client/methods/unlockOutpoint.js', () => {
  describe('unlockOutpoint()', () => {
    it('returns an empty object', () => {
      const request = {
        hash: Buffer.from('3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a', 'hex'), // From the btcwallet mock.
        index: 0
      };

      const expectedResponse = {};

      return unlockOutpoint(request).then(response => {
        expect(response).to.deep.equal(expectedResponse);
      });
    });
  });
});
