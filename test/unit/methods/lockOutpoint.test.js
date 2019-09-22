import { expect } from 'chai';
import lockOutpoint from '../../mocks/client/methods/lockOutpoint';

describe('test/mocks/client/methods/lockOutpoint.js', () => {
  describe('lockOutpoint()', () => {
    it('returns an empty object', () => {
      const request = {
        hash: Buffer.from('3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a', 'hex'), // From the btcwallet mock.
        index: 0
      };

      const expectedResponse = {};

      return lockOutpoint(request).then(response => {
        expect(response).to.deep.equal(expectedResponse);
      });
    });
  });
});
