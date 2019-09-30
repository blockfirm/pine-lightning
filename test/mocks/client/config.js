const config = {
  bridge: {
    uri: 'wss://localhost:1025/ws',
    certPath: '/home/timothy/pine-lightning/certs/cert.pem'
  },
  btcd: {
    uri: 'wss://localhost:18556/ws',
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

