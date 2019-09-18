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
  mnemonic: 'test test test test test test test test test test test test'
};

export default config;
