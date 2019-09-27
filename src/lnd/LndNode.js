import { spawn } from 'child_process';
import createLnrpc from 'lnrpc';

const WALLET_PASSWORD = 'timothy123';

const CONNECTION_ATTEMPT_DELAY = 500; // 0.5s
const MAX_CONNECTION_ATTEMPTS = 15;

const UNLOCK_ATTEMPT_DELAY = 500; // 0.5s
const MAX_UNLOCK_ATTEMPTS = 4;

const wait = (ms) => (
  new Promise(resolve => setTimeout(resolve, ms))
);

const runCmd = (cmd, args, cwd) => {
  const child = spawn(cmd, args, { cwd });

  child.stdout.setEncoding('utf8');

  child.stdout.on('data', (chunk) => {
    console.log('[LND]', chunk);
  });

  return child;
};

export default class LndNode {
  constructor(pineId, config) {
    this.pineId = pineId;
    this.config = config;

    this.connectionAttempts = 0;
    this.unlockAttempts = 0;
  }

  start() {
    console.log('[LND] Starting node...');
    const { bin, cwd, server, rpcPort } = this.config;

    const args = [
      ...this.config.args,
      `--rpclisten=localhost:${rpcPort}`,
      `--pine.id=${this.pineId}`,
      `--pine.rpc=${server.host}:${server.port}`,
      '--nolisten',
      '--norest'
    ];

    this.process = runCmd(bin, args, cwd);
    this.process.on('close', this._onShutdown.bind(this));

    return this.connect().then(() => this.unlock());
  }

  stop() {
    console.log('[LND] Shutting down...');

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

    this.connectionAttempts++;

    return createLnrpc(options)
      .then(lnrpc => {
        this.lnrpc = lnrpc;
      })
      .catch(error => {
        if (this.connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          throw new Error(`Max connection attempts reached: ${error.message}`);
        }

        return wait(CONNECTION_ATTEMPT_DELAY).then(() => this.connect());
      });
  }

  unlock() {
    console.log('[LND] Unlocking wallet...');

    const options = {
      // eslint-disable-next-line camelcase
      wallet_password: Buffer.from(WALLET_PASSWORD)
    };

    this.unlockAttempts++;

    return this.lnrpc.unlockWallet(options).catch(error => {
      if (this.unlockAttempts >= MAX_UNLOCK_ATTEMPTS) {
        throw new Error(`Max unlock attempts reached: ${error.message}`);
      }

      return wait(UNLOCK_ATTEMPT_DELAY).then(() => this.unlock());
    });
  }

  _onShutdown(code) {
    console.log('[LND] Node was shutdown with exit code', code);
    this.process = null;
    this.lnrpc = null;
  }
}
