import assert from 'assert';
import signOutputRaw from '../../src/methods/signOutputRaw';

const transaction = {
  inputs: [
    {
      witness: [],
      transactionHash: Buffer.from([147,186,79,90,25,87,42,141,176,180,196,141,92,94,214,230,149,147,169,236,215,167,100,197,204,68,135,92,184,35,64,123]),
      index: 0,
      signatureScript: Buffer.from([]),
      sequence: 2152256123
    }
  ],
  outputs: [
    {
      value: '90950',
      pkScript: Buffer.from([0,20,169,210,219,56,117,55,36,81,187,105,1,27,17,16,78,148,136,117,189,164])
    }
  ],
  version: 2,
  lockTime: 539051172
};
  
const signDescriptor = {
  keyDescriptor: {
    keyLocator: {
      keyFamily: 0,
      index: 1
    },
    publicKey: Buffer.from([4,129,84,205,229,197,35,59,5,124,28,158,195,140,150,204,40,244,155,49,207,216,14,1,58,90,253,149,135,120,79,204,222,57,72,213,86,206,85,217,242,189,49,30,209,37,140,203,250,34,7,8,32,142,255,153,241,244,66,174,48,6,167,83,248])
  },
  singleTweak: Buffer.from([]),
  doubleTweak: Buffer.from([]),
  witnessScript: Buffer.from([82,33,2,27,157,46,69,42,0,108,123,37,44,231,42,2,23,156,75,161,51,21,194,187,119,37,203,150,228,250,237,3,218,133,176,33,2,129,84,205,229,197,35,59,5,124,28,158,195,140,150,204,40,244,155,49,207,216,14,1,58,90,253,149,135,120,79,204,222,82,174]),
  output: {
    value: '100000',
    pkScript: Buffer.from([0,32,55,213,135,116,38,182,87,55,210,143,250,35,153,130,200,118,203,252,161,45,76,24,137,251,82,24,195,34,198,50,195,87])
  },
  hashType: 1,
  sigHashes: {
    hashPrevOuts: Buffer.from([211,205,83,84,118,69,122,237,205,176,128,7,167,208,148,165,127,161,133,110,235,102,78,66,214,53,59,164,12,159,158,87]),
    hashSequence: Buffer.from([140,211,96,242,10,225,96,189,87,27,105,213,67,227,98,130,241,53,8,146,32,69,206,3,151,156,139,43,231,247,113,79]),
    hashOutputs: Buffer.from([197,171,116,35,154,155,218,127,184,151,255,12,26,225,42,224,224,83,192,135,127,235,220,30,59,73,161,73,253,241,140,65])
  },
  inputIndex: 0
};

describe('methods/signOutputRaw.js', () => {
  describe('signOutputRaw()', () => {
    it('returns a signature', (done) => {
      const request = {
        transaction,
        signDescriptor
      };

      const expectedSignature = Buffer.from('3045022100db4b697ef1df74b56ef9c9d5f8265ec4cdaa4fc6472272c868528bb5059d518402205c5e87c2867be96a745995a6d9ddb719e6bb3608cab3f35770c4d369dfaa4342', 'hex');

      signOutputRaw({ request }, (error, response) => {
        if (error) {
          return done(error);
        }

        assert(response.signature.equals(expectedSignature));
        done();
      });
    });
  });
});
