const config = {
  bridge: {
    uri: 'ws://127.0.0.1:1025/ws'
  },
  btcd: {
    uri: 'wss://127.0.0.1:18556/ws',
    username: 'LHb574e7pzDNhUIsTaJguQAw7iA',
    password: 'UZgaYSJwBgao2HCh+ywKNhBPOJA',
    certPath: '/home/timothy/.btcd/rpc.cert'
  },
  btcwallet: {
    host: 'localhost:18554',
    protoPath: '/home/timothy/go/src/github.com/btcsuite/btcwallet/rpc/api.proto'
  },
  mnemonic: 'abandon category occur glad square empower half chef door puzzle sauce begin coral text drive clarify always kid lizard piano dentist canyon practice together'
};

export default config;

