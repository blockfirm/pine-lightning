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
    const { bin, cwd, rpcPort } = this.config;

    const args = [
      ...this.config.args,
      `--rpclisten=localhost:${rpcPort}`,
      '--nolisten',
      '--norest'
    ];

    this.process = runCmd(bin, args, cwd);
    this.process.on('close', this._onShutdown.bind(this));

    // TODO: Find a better way than using a timeout.
    return new Promise(resolve => setTimeout(resolve, 1000))
      .then(() => this.connect())
      .then(() => this.unlock());
  }

  stop() {
    console.log('[LND] Shutting down...');
    return this.lnrpc.stopDaemon({});
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
