const config = {
  servers: {
    client: {
      host: 'localhost',
      port: 8911,
      tls: {
        cert: 'certs/cert.pem',
        key: 'certs/key.pem'
      }
    },
    node: {
      proto: 'protos/node.proto',
      host: 'localhost',
      port: 8910
    }
  },
  lnd: {
    bin: '~/go/bin/lnd',
    cwdRoot: '~/.lnd',
    adminMacaroon: 'data/chain/bitcoin/simnet/admin.macaroon',
    args: [
      '--datadir=data',
      '--logdir=log',
      '--debuglevel=info'
    ],
    pineHub: {
      publicKey: '',
      host: 'localhost:10012'
    }
  }
};

export default config;
