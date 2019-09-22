import btcwallet from '../btcwallet';

const ADDRESS_TYPE_UNKNOWN = 0;
const ADDRESS_TYPE_WITNESS_PUBKEY = 1; // BIP84 (p2wpkh)
const ADDRESS_TYPE_NESTED_WITNESS_PUBKEY = 2; // BIP49 (p2sh-p2wpkh)

const BIP0044_EXTERNAL = 0;
const BIP0044_INTERNAL = 1;

const newAddress = (request) => {
  console.log(`newAddress(${request.type}, ${request.change})`);
  const { type, change } = request;

  const nextAddressRequest = {
    account: 0,

    // NOTE: btcwallet only supports BIP44.
    kind: change ? BIP0044_INTERNAL : BIP0044_EXTERNAL
  };

  if (type !== ADDRESS_TYPE_WITNESS_PUBKEY && type !== ADDRESS_TYPE_NESTED_WITNESS_PUBKEY) {
    console.log('→ ErrAddressNotSupported\n');
    return Promise.reject(new Error('address type not supported'));
  }

  return new Promise((resolve, reject) => {
    btcwallet.wallet.nextAddress(nextAddressRequest, (error, response) => {
      if (error) {
        return reject(error);
      }

      console.log(`→ ${response.address}\n`);
      resolve({ address: response.address });
    });
  });
};

export default newAddress;
