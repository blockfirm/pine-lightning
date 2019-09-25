import { spawn } from 'child_process';
import createLnrpc from 'lnrpc';

const WALLET_PASSWORD = 'timothy123';

const runCmd = (cmd, args, cwd) => {
  const child = spawn(cmd, args, { cwd });

  child.stdout.setEncoding('utf8');

  child.stdout.on('data', (chunk) => {
    console.log('[LND]', chunk);
  });

  return child;
};

export default class LndNode {
  constructor(config) {
    this.config = config;
  }

  start() {
    console.log('[LND] Starting node...');
    const { bin, cwd } = this.config;

    const args = [
      '--rpclisten=localhost:10001',
      '--listen=localhost:10011',
      '--restlisten=localhost:8001',
      ...this.config.args
    ];

    this.process = runCmd(bin, args, cwd);
    this.process.on('close', this._onShutdown.bind(this));

    // TODO: Find a better way than using a timeout.
    setTimeout(() => {
      this.connect().then(() => this.unlock());
    }, 1000);
  }

  stop() {
    console.log('[LND] Shutting down...');
    return this.lnrpc.stopDaemon({});
  }

  connect() {
    const macaroonPath = this.config.adminMacaroon;

    return createLnrpc({ macaroonPath }).then(lnrpc => {
      this.lnrpc = lnrpc;
    });
  }

  unlock() {
    console.log('[LND] Unlocking wallet...');

    return this.lnrpc.unlockWallet({
      wallet_password: Buffer.from(WALLET_PASSWORD)
    });
  }

  _onShutdown(code) {
    console.log('[LND] Node was shutdown with exit code', code);
    this.process = null;
    this.lnrpc = null;
  }
}
