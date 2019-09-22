import proxyquire from 'proxyquire';
import { expect } from 'chai';
import configMock from '../mocks/config';

const deriveKey = proxyquire('../../mocks/client/methods/deriveKey', {
  '../config': { ...configMock, '@noCallThru': true }
}).default;

describe('test/mocks/client/methods/deriveKey.js', () => {
  describe('deriveKey()', () => {
    it('returns a key descriptor', () => {
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

      return deriveKey(request).then(response => {
        expect(response.keyDescriptor).to.deep.equal(expectedKeyDescriptor);
      });
    });
  });
});
