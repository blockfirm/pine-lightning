import proxyquire from 'proxyquire';
import { expect } from 'chai';
import configMock from '../mocks/config';

const deriveKey = proxyquire('../../../src/methods/deriveKey', {
  '../config': { ...configMock, '@noCallThru': true }
}).default;

describe('methods/deriveKey.js', () => {
  describe('deriveKey()', () => {
    it('returns a key descriptor', (done) => {
      const request = {
        keyLocator: {
          keyFamily: 2,
          index: 1
        }
      };

      const expectedKeyDescriptor = {
        keyLocator: {
          keyFamily: 2,
          index: 1
        },
        publicKey: Buffer.from('036a53a16cada21b197782ab528c5536c0edb450aa644d8690deb5970cd95f04ca', 'hex')
      };

      deriveKey({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        expect(response.keyDescriptor).to.deep.equal(expectedKeyDescriptor);
        done();
      });
    });
  });
});
