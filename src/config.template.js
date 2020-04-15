const config = {
  servers: {
    client: {
      host: 'localhost',
      port: 8911,
      rateLimit: {
        messages: 50, // Amount of messages per interval for each connected client.
        interval: 'minute' // 'second', 'minute', 'hour', 'day', or a number of milliseconds.
      },
      maxPayload: 1000000, // 1M
      pingInterval: 30 // Ping clients every 30 seconds.
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
    gateway: {
      publicKey: '',
      host: 'localhost:10012'
    },
    idleTimeout: 5, // (minutes) Shut down node after 5 minutes of inactivity.
    killTimeout: 10, // (seconds) Force-kill node if it can't be shut down gracefully after 10 seconds.
    walletPassword: '6ae87cf6-050b-48e6-acc6-263996574e57'
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  log: {
    level: 'info', // One of 'info', 'warn', 'error'.
    dir: '/var/log/pine'
  }
};

export default config;
