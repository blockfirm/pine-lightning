import { spawn } from 'child_process';
import path from 'path';
import events from 'events';
import makeDir from 'make-dir';

const STATE_NOT_STARTED = 0;
const STATE_STARTED = 1;
const STATE_UNLOCKED = 3;
const STATE_READY = 4;

const runCmd = (cmd, args, cwd) => {
  const child = spawn(cmd, args, { cwd });

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  return child;
};

export default class LndProcess {
  constructor(pineId, config) {
    this.pineId = pineId;
    this.config = config;
    this.state = STATE_NOT_STARTED;

    this.cwd = this._getCwd();
    this.eventEmitter = new events.EventEmitter();
  }

  once(event, listener) {
    this.eventEmitter.once(event, listener);
  }

  removeAllListeners() {
    this.eventEmitter.removeAllListeners();
  }

  start() {
    return this._preStart().then(() => {
      const { cwd } = this;
      const { bin, server, rpcPort } = this.config;

      const args = [
        ...this.config.args,
        `--rpclisten=localhost:${rpcPort}`,
        `--pine.id=${this.pineId}`,
        `--pine.rpc=${server.host}:${server.port}`,
        '--nolisten',
        '--norest'
      ];

      this.process = runCmd(bin, args, cwd);
      this._postStart();
    });
  }

  kill() {
    if (this.process) {
      this.process.kill();
    }
  }

  _getCwd() {
    return path.join(this.config.cwdRoot, this.pineId);
  }

  _preStart() {
    return makeDir(this.cwd);
  }

  _postStart() {
    this.process.stdout.on('data', (chunk) => {
      console.log('[LND OUTPUT]', chunk);

      if (chunk.indexOf('Waiting for wallet encryption password') > -1) {
        this.state = STATE_STARTED;
        this.eventEmitter.emit('started');
      }

      if (chunk.indexOf('LightningWallet opened') > -1) {
        this.state = STATE_UNLOCKED;
        this.eventEmitter.emit('unlocked');
      }

      if (chunk.indexOf('Updating backup file') > -1) {
        if (this.state !== STATE_READY) {
          this.state = STATE_READY;
          this.eventEmitter.emit('ready');
        }
      }
    });

    this.process.stderr.on('data', (chunk) => {
      console.error('[LND ERROR]', chunk);

      if (this.state < STATE_STARTED) {
        this.eventEmitter.emit('error', new Error(chunk));
      }
    });

    this.process.on('error', (error) => {
      console.error('[LND ERROR]', error.message);
      this.eventEmitter.emit('error', error);
    });

    this.process.on('exit', this._onExit.bind(this));
  }

  _onExit(code) {
    this.process.removeAllListeners();
    this.process = null;
    this.state = STATE_NOT_STARTED;
    this.eventEmitter.emit('exit', code);

    console.log('[LND] Node was shutdown with exit code', code);
  }
}
