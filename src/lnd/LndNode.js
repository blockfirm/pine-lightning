import { spawn } from 'child_process';
import path from 'path';
import makeDir from 'make-dir';
import createLnrpc from 'lnrpc';

const WALLET_PASSWORD = 'timothy123';
const DUMMY_SEED_MNEMONIC = 'abandon category occur glad square empower half chef door puzzle sauce begin coral text drive clarify always kid lizard piano dentist canyon practice together';

const runCmd = (cmd, args, cwd) => {
  const child = spawn(cmd, args, { cwd });

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  return child;
};

export default class LndNode {
  static STATE_NOT_STARTED = 0;
  static STATE_WAITING_FOR_PASSWORD = 1;
  static STATE_CREATING = 2;
  static STATE_UNLOCKED = 3;

  constructor(pineId, config) {
    this.pineId = pineId;
    this.config = config;
    this.state = this.STATE_NOT_STARTED;
  }

  getCwd() {
    return path.join(this.config.cwdRoot, this.pineId);
  }

  preStart() {
    return makeDir(this.getCwd());
  }

  start() {
    console.log('[LND] Starting node...');

    return this.preStart().then(() => {
      const { bin, server, rpcPort } = this.config;
      const cwd = this.getCwd();

      const args = [
        ...this.config.args,
        `--rpclisten=localhost:${rpcPort}`,
        `--pine.id=${this.pineId}`,
        `--pine.rpc=${server.host}:${server.port}`,
        '--nolisten',
        '--norest'
      ];

      this.process = runCmd(bin, args, cwd);

      return this.postStart();
    });
  }

  postStart() {
    return new Promise((resolve, reject) => {
      this.process.stdout.on('data', (chunk) => {
        console.log('[LND]', chunk);

        if (chunk.indexOf('Waiting for wallet encryption password') > -1) {
          this.state = this.STATE_WAITING_FOR_PASSWORD;
          this.connect()
            .then(() => this.unlock())
            .catch(reject);
        }

        if (chunk.indexOf('LightningWallet opened') > -1) {
          this.state = this.STATE_UNLOCKED;
          resolve();
        }
      });

      this.process.stderr.on('data', (chunk) => {
        console.error('[LND] Error Output:', chunk);

        if (this.state < this.STATE_WAITING_FOR_PASSWORD) {
          reject(new Error(chunk));
        }
      });

      this.process.on('error', (error) => {
        console.error('[LND] Process Error:', error.message);
        reject(error);
      });

      this.process.on('close', this._onShutdown.bind(this));
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

  connect() {
    const { adminMacaroon, rpcPort } = this.config;
    const server = `localhost:${rpcPort}`;

    const options = {
      macaroonPath: adminMacaroon,
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

    return this.lnrpc.unlockWallet(options).catch(error => {
      if (error.message.indexOf('wallet not found') > -1) {
        return this.createWallet();
      }
    });
  }

  createWallet() {
    console.log('[LND] Creating wallet...');

    const options = {
      // eslint-disable-next-line camelcase
      wallet_password: Buffer.from(WALLET_PASSWORD),
      cipher_seed_mnemonic: DUMMY_SEED_MNEMONIC.split(' ')
    };

    return this.lnrpc.initWallet(options);
  }

  _onShutdown(code) {
    this.process = null;
    this.lnrpc = null;
    console.log('[LND] Node was shutdown with exit code', code);
  }
}
