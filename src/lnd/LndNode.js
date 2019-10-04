import events from 'events';
import path from 'path';
import createLnrpc from 'lnrpc';
import LndProcess from './LndProcess';

const WALLET_PASSWORD = 'timothy123';
const DUMMY_SEED_MNEMONIC = 'abandon category occur glad square empower half chef door puzzle sauce begin coral text drive clarify always kid lizard piano dentist canyon practice together';

export default class LndNode extends events.EventEmitter {
  constructor(pineId, config) {
    super();
    this.config = config;
    this.process = new LndProcess(pineId, config);
  }

  start() {
    console.log('[LND] Starting node...');

    return new Promise((resolve, reject) => {
      this.process.once('started', () => {
        this._setup().catch(reject);
      });

      this.process.once('unlocked', () => {
        this.connect().catch(reject);
      });

      this.process.once('ready', () => {
        this.connectToPineHub().then(resolve).catch(reject);
      });

      this.process.once('error', reject);
      this.process.once('exit', this._onExit.bind(this));

      this.process.start().catch(reject);
    });
  }

  _setup() {
    const withoutMacaroon = true;

    return this.connect(withoutMacaroon)
      .then(() => this.unlock())
      .catch(error => {
        if (error.message.indexOf('wallet not found') > -1) {
          return this.createWallet();
        }

        throw error;
      });
  }

  stop() {
    console.log('[LND] Shutting down...');

    if (!this.process) {
      return Promise.resolve();
    }

    if (!this.lnrpc) {
      this.process.kill();
      return Promise.resolve();
    }

    return this.lnrpc.stopDaemon({}).catch(() => {
      this.process.kill();
    });
  }

  connect(withoutMacaroon) {
    const { adminMacaroon, rpcPort } = this.config;
    const cwd = this.process.cwd;
    const server = `localhost:${rpcPort}`;
    const macaroonPath = withoutMacaroon ? null : path.join(cwd, adminMacaroon);

    const options = {
      macaroonPath,
      server
    };

    return createLnrpc(options).then(lnrpc => {
      this.lnrpc = lnrpc;
    });
  }

  unlock() {
    console.log('[LND] Unlocking wallet...');

    const options = {
      // eslint-disable-next-line camelcase
      wallet_password: Buffer.from(WALLET_PASSWORD)
    };

    return this.lnrpc.unlockWallet(options);
  }

  createWallet() {
    console.log('[LND] Creating wallet...');

    const options = {
      // eslint-disable-next-line camelcase
      wallet_password: Buffer.from(WALLET_PASSWORD),
      // eslint-disable-next-line camelcase
      cipher_seed_mnemonic: DUMMY_SEED_MNEMONIC.split(' ')
    };

    return this.lnrpc.initWallet(options);
  }

  connectToPineHub() {
    const { pineHub } = this.config;
    console.log('[LND] Connecting node to peer...');

    const options = {
      addr: {
        pubkey: pineHub.publicKey,
        host: pineHub.host
      },
      perm: true
    };

    return this.lnrpc.connectPeer(options);
  }

  isReady() {
    return this.process.isReady();
  }

  _onExit() {
    this.process.removeAllListeners();
    this.process = null;
    this.emit('exit');
  }
}
