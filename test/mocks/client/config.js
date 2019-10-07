const config = {
  bridge: {
    uri: 'ws://localhost:1025/ws',
    sessionBaseUri: 'http://localhost:1026',
    pingInterval: 30 // Expect a ping from server every 30 seconds.
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
  lndGateway: {
    rpcHost: 'localhost:10002',
    adminMacaroon: '/home/timothy/go/dev/jabberwock/data/chain/bitcoin/simnet/admin.macaroon'
  },
  mnemonic: 'abandon category occur glad square empower half chef door puzzle sauce begin coral text drive clarify always kid lizard piano dentist canyon practice together'
};

export default config;

