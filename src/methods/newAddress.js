import btcwallet from '../btcwallet';
import bs58check from 'bs58check';

const ADDRESS_TYPE_UNKNOWN = 0;
const ADDRESS_TYPE_WITNESS_PUBKEY = 1; // BIP84 (p2wpkh)
const ADDRESS_TYPE_NESTED_WITNESS_PUBKEY = 2; // BIP49 (p2sh-p2wpkh)

const BIP0044_EXTERNAL = 0;
const BIP0044_INTERNAL = 1;

const newAddress = ({ request }, callback) => {
  console.log(`newAddress(${request.type}, ${request.change})`);
  const { type, change } = request;

  const nextAddressRequest = {
    account: 0,

    // NOTE: btcwallet only supports BIP44.
    kind: change ? BIP0044_INTERNAL : BIP0044_EXTERNAL
  };

  if (type !== ADDRESS_TYPE_WITNESS_PUBKEY && type !== ADDRESS_TYPE_NESTED_WITNESS_PUBKEY) {
    return callback(new Error('address type not supported'));
  }

  btcwallet.wallet.nextAddress(nextAddressRequest, (error, response) => {
    if (error) {
      return callback(error);
    }

    callback(null, {
      hash: bs58check.decode(response.address)
    });
  });
};

export default newAddress;
