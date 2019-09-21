import proxyquire from 'proxyquire';
import { expect } from 'chai';
import configMock from '../mocks/config';

const isOurAddress = proxyquire('../../../src/methods/isOurAddress', {
  '../config': { ...configMock }
}).default;

describe('methods/isOurAddress.js', () => {
  describe('isOurAddress()', () => {
    it('returns true when the address belongs to the wallet', (done) => {
      const request = {
        address: 'mra6xTvjp16VYHg8Xa59mzo4Ri8UNcYiS1'
      };

      const expectedResponse = {
        isOurAddress: true
      };

      isOurAddress({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        expect(response).to.deep.equal(expectedResponse);
        done();
      });
    });

    it('returns false when the address does not belong to the wallet', (done) => {
      const request = {
        address: 'mh26xTvjp16VYHg8Xa31mzo4Di8FacYiv9'
      };

      const expectedResponse = {
        isOurAddress: false
      };

      isOurAddress({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        expect(response).to.deep.equal(expectedResponse);
        done();
      });
    });
  });
});
