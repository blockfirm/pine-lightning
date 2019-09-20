import { expect } from 'chai';
import unlockOutpoint from '../../../src/methods/unlockOutpoint';

describe('methods/unlockOutpoint.js', () => {
  describe('unlockOutpoint()', () => {
    it('returns an empty object', (done) => {
      const request = {
        hash: Buffer.from('3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a', 'hex'), // From the btcwallet mock.
        index: 0
      };

      const expectedResponse = {};

      unlockOutpoint({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        expect(response).to.deep.equal(expectedResponse);
        done();
      });
    });
  });
});
