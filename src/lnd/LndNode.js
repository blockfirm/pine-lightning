/* eslint-disable max-lines */
import events from 'events';
import path from 'path';
import createLnrpc from 'lnrpc';

import logger from '../logger';
import LndProcess from './LndProcess';

export default class LndNode extends events.EventEmitter {
  constructor(pineId, config) {
    super();

    this.pineId = pineId;
    this.config = config;
    this.logger = logger.child({ scope: 'LndNode' });
    this.process = new LndProcess(pineId, config);
  }

  start() {
    this.logger.info(`Starting user LND node...`, {
      pineId: this.pineId
    });

    return new Promise((resolve, reject) => {
      this.process.once('started', () => {
        this._setup().catch(reject);
      });

      this.process.once('unlocked', () => {
        this.connect().catch(reject);
      });

      this.process.once('ready', () => {
        this.connectToGateway()
          .then(resolve)
          .catch(reject);
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
    const { killTimeout } = this.config;

    this.logger.info('Shutting down user LND node...', {
      pineId: this.pineId
    });

    if (!this.process) {
      return Promise.resolve();
    }

    // Force-kill node if it doesn't shut down gracefully in time.
    setTimeout(() => {
      this.process && this.process.forceKill();
    }, killTimeout * 1000);

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
    this.logger.info('Unlocking user LND wallet...', {
      pineId: this.pineId
    });

    const options = {
      // eslint-disable-next-line camelcase
      wallet_password: Buffer.from(this.config.walletPassword)
    };

    return this.lnrpc.unlockWallet(options);
  }

  createWallet() {
    this.logger.info('Creating user LND wallet...', {
      pineId: this.pineId
    });

    // eslint-disable-next-line camelcase
    return this.lnrpc.genSeed({}).then(({ cipher_seed_mnemonic }) => {
      return this.lnrpc.initWallet({
        // eslint-disable-next-line camelcase
        wallet_password: Buffer.from(this.config.walletPassword),
        // eslint-disable-next-line camelcase
        cipher_seed_mnemonic
      });
    });
  }

  connectToGateway() {
    const { gateway } = this.config;

    this.logger.info('Connecting user LND node to gateway peer...', {
      pineId: this.pineId
    });

    const options = {
      addr: {
        pubkey: gateway.publicKey,
        host: gateway.host
      },
      perm: true
    };

    return this.lnrpc.connectPeer(options).catch(error => {
      if (!error.message.includes('already connected')) {
        throw error;
      }
    });
  }

  isReady() {
    this.logger.info('User LND node is ready', {
      pineId: this.pineId
    });

    return this.process.isReady();
  }

  _onExit() {
    this.process.removeAllListeners();
    this.process = null;
    this.emit('exit');
  }
}
