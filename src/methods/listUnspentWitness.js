import btcwallet from '../btcwallet';

const listUnspentWitness = ({ request }, callback) => {
  console.log(`listUnspentWitness(${request.minConfirmations}, ${request.maxConfirmations})`);
  const { minConfirmations, maxConfirmations } = request;

  btcwallet.wallet.balance({ account_number: 0, required_confirmations: minConfirmations }, (error, response) => {
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
        addressType: 0,
        value: Number(output.amount),
        confirmations: minConfirmations,
        pkScript: output.pk_script,
        outPoint: {
          hash: output.transaction_hash,
          index: output.output_index
        }
      }));
 
      callback(null, { utxos });
    });
  });
};

export default listUnspentWitness;
