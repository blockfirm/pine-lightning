import proxyquire from 'proxyquire';
import assert from 'assert';

import configMock from '../mocks/config';
import btcdMock from '../mocks/btcd';

const computeInputScript = proxyquire('../../mocks/client/methods/computeInputScript', {
  '../config': { ...configMock, '@noCallThru': true },
  '../btcd': { default: btcdMock }
}).default;

const transaction = {
  inputs: [
    {
      witness: [],
      transactionHash: Buffer.from([0,36,127,7,161,147,251,215,139,163,218,196,131,37,200,149,216,17,206,231,124,196,195,150,148,74,218,135,88,122,249,110]),
      index: 0,
      signatureScript: Buffer.from([]),
      sequence: 4294967295
    }
  ],
  outputs: [
    {
      value: '100000',
      pkScript: Buffer.from([0,32,69,51,230,188,97,162,155,87,136,7,185,11,195,131,22,57,227,101,148,29,133,251,196,33,120,163,244,19,241,158,181,68])
    },
    {
      value: '4999891213',
      pkScript: Buffer.from([0,20,31,109,227,130,130,196,203,80,1,104,17,82,63,31,46,50,91,6,24,150])
    }
  ],
  version: 1,
  lockTime: 0
};

const signDescriptor = {
  keyDescriptor: {
    keyLocator: {
      keyFamily: 0,
      index: 0
    },
    publicKey: Buffer.from([])
  },
  singleTweak: Buffer.from([]),
  doubleTweak: Buffer.from([]),
  witnessScript: Buffer.from([]),
  output: {
    value: '5000000000',
    pkScript: Buffer.from([118,169,20,94,31,249,139,234,246,1,217,115,235,149,15,118,7,38,93,58,226,47,209,136,172])
  },
  hashType: 1,
  sigHashes: {
    hashPrevOuts: Buffer.from([63,81,214,173,234,207,97,61,123,146,228,79,245,120,230,227,156,9,158,25,114,144,51,180,106,102,237,232,74,99,52,0]),
    hashSequence: Buffer.from([59,177,48,41,206,123,31,85,158,245,231,71,252,172,67,159,20,85,162,236,124,95,9,183,34,144,121,94,112,102,80,68]),
    hashOutputs: Buffer.from([59,101,38,131,65,171,244,117,11,232,29,206,60,96,182,55,79,253,43,246,56,122,114,99,245,60,251,110,21,136,75,120])
  },
  inputIndex: 0
};

describe('test/mocks/client/methods/computeInputScript.js', () => {
  describe('computeInputScript()', () => {
    it('returns an input script', () => {
      const request = {
        transaction,
        signDescriptor
      };

      const expectedSignatureScript = Buffer.from([
        71,48,68,2,32,20,126,197,250,226,236,101,166,229,188,121,244,154,167,47,155,186,217,247,134,39,176,202,189,
64,185,196,247,208,149,109,90,2,32,104,164,181,38,108,57,36,142,143,179,231,77,58,247,161,234,247,232,88,23,145,174,160,222,108,114,126,105,130,68,232,216,1,33,3,140,42,85,223,40,1,102,45,83,192,225,192,146,218,2,116,150,53,59,135,49,49,244,227,78,123,248,215,3,126,115,131
      ]);

      return computeInputScript(request).then(response => {
        assert(response.signatureScript.equals(expectedSignatureScript));
      });
    });
  });
});
