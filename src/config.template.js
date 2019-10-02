const config = {
  servers: {
    client: {
      host: 'localhost',
      port: 8911,
      tls: {
        cert: 'certs/cert.pem',
        key: 'certs/key.pem'
      },
      maxPayload: 100000 // 100k
    },
    session: {
      host: 'localhost',
      port: 1026,
      rateLimit: {
        burst: 2,
        rate: 1,
        ip: true, // Set to true if directly exposed to the internet.
        xff: false, // Set to true if behind a reverse proxy or similar.
        maxKeys: 100000
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
