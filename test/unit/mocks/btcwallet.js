const wallet = {
  balance: (_, callback) => {
    callback(null, {
      total: 50000000
    });
  },
  fundTransaction: (_, callback) => {
    callback(null, {
      selected_outputs: [
        {
          transaction_hash: Buffer.from('3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a', 'hex'),
          output_index: 0,
          amount: '25000000',
          pk_script: Buffer.from('14836dbe7f38c5ac3d49e8d790af808a4ee9edcf', 'hex')
        }
      ]
    });
  }
};

const walletLoader = {};

const btcwallet = {
  wallet,
  walletLoader
};

export default btcwallet;
