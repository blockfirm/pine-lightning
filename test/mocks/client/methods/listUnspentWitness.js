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

const listUnspentWitness = (request) => {
  console.log(`listUnspentWitness(${request.minConfirmations}, ${request.maxConfirmations})`);
  const { minConfirmations, maxConfirmations } = request;

  const balanceRequest = {
    account_number: 0,
    required_confirmations: minConfirmations
  };

  return new Promise((resolve, reject) => {
    btcwallet.wallet.balance(balanceRequest, (error, response) => {
      if (error) {
        return reject(error);
      }

      const balance = response.total;

      btcwallet.wallet.fundTransaction({
        account: 0,
        target_amount: balance,
        required_confirmations: 100, //minConfirmations,
        include_immature_coinbases: true,
        include_change_script: false
      }, (error, response) => {
        if (error) {
          return reject(error);
        }

        const utxos = response.selected_outputs
          .filter((output) => {
            /**
             * This makes sure only "fresh" outputs are used.
             * Otherwise witness outputs from funding transactions
             * might be selected and those are not supported by
             * this mock client.
             */
            return output.from_coinbase;
          })
          .map((output) => ({
            addressType: ADDRESS_TYPE_NESTED_WITNESS_PUBKEY,
            value: Number(output.amount),
            confirmations: 100,
            pkScript: output.pk_script,
            transactionHash: output.transaction_hash,
            vout: output.output_index
          }));

        const unspentWitness = { utxos: excludeLockedOutpoints(utxos) };
        console.log(`→ ${utxos.length}\n`);
        resolve(unspentWitness);
      });
    });
  });
};

export default listUnspentWitness;
