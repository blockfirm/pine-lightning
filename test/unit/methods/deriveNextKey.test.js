import proxyquire from 'proxyquire';
import { expect } from 'chai';
import configMock from '../mocks/config';

const deriveNextKey = proxyquire('../../../src/methods/deriveNextKey', {
  '../config': { ...configMock, '@noCallThru': true }
}).default;

describe('methods/deriveNextKey.js', () => {
  describe('deriveNextKey()', () => {
    it('returns a key descriptor', (done) => {
      const request = {
        keyFamily: 2
      };

      const expectedKeyDescriptor = {
        keyLocator: {
          index: 1,
          keyFamily: 2
        },
        publicKey: Buffer.from('036a53a16cada21b197782ab528c5536c0edb450aa644d8690deb5970cd95f04ca', 'hex')
      };

      deriveNextKey({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        expect(response.keyDescriptor).to.deep.equal(expectedKeyDescriptor);
        done();
      });
    });
  });
});
