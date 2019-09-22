import proxyquire from 'proxyquire';
import { expect } from 'chai';
import configMock from '../mocks/config';

const isOurAddress = proxyquire('../../mocks/client/methods/isOurAddress', {
  '../config': { ...configMock }
}).default;

describe('test/mocks/client/methods/isOurAddress.js', () => {
  describe('isOurAddress()', () => {
    it('returns true when the address belongs to the wallet', () => {
      const request = {
        address: 'mra6xTvjp16VYHg8Xa59mzo4Ri8UNcYiS1'
      };

      const expectedResponse = {
        isOurAddress: true
      };

      return isOurAddress(request).then(response => {
        expect(response).to.deep.equal(expectedResponse);
      });
    });

    it('returns false when the address does not belong to the wallet', () => {
      const request = {
        address: 'mh26xTvjp16VYHg8Xa31mzo4Di8FacYiv9'
      };

      const expectedResponse = {
        isOurAddress: false
      };

      return isOurAddress(request).then(response => {
        expect(response).to.deep.equal(expectedResponse);
      });
    });
  });
});
