import btcwallet from '../btcwallet';

const ADDRESS_TYPE_UNKNOWN = 0;
const ADDRESS_TYPE_WITNESS_PUBKEY = 1; // BIP84 (p2wpkh)
const ADDRESS_TYPE_NESTED_WITNESS_PUBKEY = 2; // BIP49 (p2sh-p2wpkh)

const fetchInputInfo = ({ request }, callback) => {
  const { hash, index } = request;
  console.log(`fetchInputInfo(${hash.toString('hex')}, ${index})`);

  const balanceRequest = {
    account_number: 0,
    required_confirmations: 1
  };

  btcwallet.wallet.balance(balanceRequest, (error, response) => {
    if (error) {
      return callback(error);
    }

    const balance = response.total;

    btcwallet.wallet.fundTransaction({
      account: 0,
      target_amount: balance,
      required_confirmations: 1,
      include_immature_coinbases: true,
      include_change_script: false
    }, (error, response) => {
      if (error) {
        return callback(error);
      }

      const output = response.selected_outputs.find(selectedOutput => (
        selectedOutput.transaction_hash.equals(hash) && selectedOutput.output_index === index
      ));

      if (!output) {
        // TODO: Handle this error correctly in the client.
        console.log('→ ErrNotMine}');
        return callback(new Error('ErrNotMine'));
      }

      const utxo = {
        addressType: ADDRESS_TYPE_NESTED_WITNESS_PUBKEY,
        value: Number(output.amount),
        confirmations: 100,
        pkScript: output.pk_script,
        transactionHash: output.transaction_hash,
        vout: output.output_index
      };

      callback(null, { utxo });
      console.log(`→ ${JSON.stringify(utxo)}\n`);
    });
  });
};

export default fetchInputInfo;
