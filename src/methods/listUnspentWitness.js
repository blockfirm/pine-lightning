import btcwallet from '../btcwallet';
import { lockedOutpoints } from './lockOutpoint';

const ADDRESS_TYPE_UNKNOWN = 0;
const ADDRESS_TYPE_WITNESS_PUBKEY = 1; // BIP84 (p2wpkh)
const ADDRESS_TYPE_NESTED_WITNESS_PUBKEY = 2; // BIP49 (p2sh-p2wpkh)

const excludeLockedOutpoints = (utxos) => {
  return utxos.filter(utxo => {
    const txid = utxo.transactionHash.toString('hex');
    return !(lockedOutpoints[txid] && lockedOutpoints[txid][utxo.vout]);
  });
};

const listUnspentWitness = ({ request }, callback) => {
  console.log(`listUnspentWitness(${request.minConfirmations}, ${request.maxConfirmations})`);
  const { minConfirmations, maxConfirmations } = request;

  const balanceRequest = {
    account_number: 0,
    required_confirmations: minConfirmations
  };

  btcwallet.wallet.balance(balanceRequest, (error, response) => {
    if (error) {
      return callback(error);
    }

    const balance = response.total;

    btcwallet.wallet.fundTransaction({
      account: 0,
      target_amount: balance,
      required_confirmations: minConfirmations,
      include_immature_coinbases: true,
      include_change_script: false
    }, (error, response) => {
      if (error) {
        return callback(error);
      }

      const utxos = response.selected_outputs.map((output) => ({
        addressType: ADDRESS_TYPE_NESTED_WITNESS_PUBKEY,
        value: Number(output.amount),
        confirmations: minConfirmations,
        pkScript: output.pk_script,
        transactionHash: output.transaction_hash,
        vout: output.output_index
      }));

      callback(null, { utxos: excludeLockedOutpoints(utxos) });
    });
  });
};

export default listUnspentWitness;
