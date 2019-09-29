const config = {
  servers: {
    client: {
      proto: 'protos/client.proto',
      host: '0.0.0.0',
      port: 8911
    },
    node: {
      proto: 'protos/node.proto',
      host: '0.0.0.0',
      port: 8910
    }
  },
  lnd: {
    bin: '~/go/bin/lnd',
    cwdRoot: '~/.lnd',
    adminMacaroon: '~/.lnd/data/chain/bitcoin/simnet/admin.macaroon',
    args: [
      '--datadir=data',
      '--logdir=log',
      '--debuglevel=info'
    ]
  }
};

export default config;
