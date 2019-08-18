import btcwallet from '../btcwallet';

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

      const utxo = response.selected_outputs.find((output) => {
        return output.transaction_hash.equals(hash) && output.output_index === index;
      });

      if (!utxo) {
        return callback(new Error('ErrNotMine'));
      }

      callback(null, { pkScript: utxo.pk_script, value: Number(utxo.amount) });
    });
  });
};

export default fetchInputInfo;
