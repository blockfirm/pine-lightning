import proxyquire from 'proxyquire';
import assert from 'assert';
import configMock from '../mocks/config';

const signMessage = proxyquire('../../../src/methods/signMessage', {
  '../config': { ...configMock, '@noCallThru': true }
}).default;

describe('methods/signMessage.js', () => {
  describe('signMessage()', () => {
    it('returns a signature', (done) => {
      const request = {
        publicKey: Buffer.from([4,129,84,205,229,197,35,59,5,124,28,158,195,140,150,204,40,244,155,49,207,216,14,1,58,90,253,149,135,120,79,204,222,57,72,213,86,206,85,217,242,189,49,30,209,37,140,203,250,34,7,8,32,142,255,153,241,244,66,174,48,6,167,83,248]),
        message: Buffer.from('5081c4d5-b842-4b43-961f-6434f7927e0b')
      };

      const expectedSignature = Buffer.from('3045022100e547160f7ccefd8c8a361ca18c93036480ecddf925250e73f4584d568d17a5220220140865fd2054dbfc25d820712f68ec9c134aec6a507b5f2b2ab5139b186de53a', 'hex');

      signMessage({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        assert(response.signature.equals(expectedSignature));
        done();
      });
    });
  });
});
