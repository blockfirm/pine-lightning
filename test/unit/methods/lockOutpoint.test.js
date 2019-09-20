import { expect } from 'chai';
import lockOutpoint from '../../../src/methods/lockOutpoint';

describe('methods/lockOutpoint.js', () => {
  describe('lockOutpoint()', () => {
    it('returns an empty object', (done) => {
      const request = {
        hash: Buffer.from('3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a', 'hex'), // From the btcwallet mock.
        index: 0
      };

      const expectedResponse = {};

      lockOutpoint({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        expect(response).to.deep.equal(expectedResponse);
        done();
      });
    });
  });
});
