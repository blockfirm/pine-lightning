import proxyquire from 'proxyquire';
import { expect } from 'chai';
import configMock from '../mocks/config';

const deriveNextKey = proxyquire('../../mocks/client/methods/deriveNextKey', {
  '../config': { ...configMock, '@noCallThru': true }
}).default;

describe('test/mocks/client/methods/deriveNextKey.js', () => {
  describe('deriveNextKey()', () => {
    it('returns a key descriptor', () => {
      const request = {
        keyFamily: 2,
        keyIndex: 1
      };

      const expectedKeyDescriptor = {
        keyLocator: {
          index: 1,
          keyFamily: 2
        },
        publicKey: Buffer.from('036a53a16cada21b197782ab528c5536c0edb450aa644d8690deb5970cd95f04ca', 'hex')
      };

      return deriveNextKey(request).then(response => {
        expect(response.keyDescriptor).to.deep.equal(expectedKeyDescriptor);
      });
    });
  });
});
