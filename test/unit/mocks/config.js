const config = {
  rpc: {
    proto: 'rpc.proto',
    port: 8910
  },
  btcd: {
    uri: 'wss://127.0.0.1:18334/ws',
    username: '',
    password: '',
    certPath: '~/.btcd/rpc.cert'
  },
  btcwallet: {
    host: '127.0.0.1:18554',
    protoPath: '~/go/src/github.com/btcsuite/btcwallet/rpc/api.proto'
  },
  mnemonic: 'abandon category occur glad square empower half chef door puzzle sauce begin coral text drive clarify always kid lizard piano dentist canyon practice together'

};

export default config;
