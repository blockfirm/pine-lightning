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

export default class LndProcess extends events.EventEmitter {
  constructor(pineId, config) {
    super();

    this.pineId = pineId;
    this.config = config;
    this.state = STATE_NOT_STARTED;
    this.cwd = this._getCwd();
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
        '--norest',
        '--nobootstrap'
      ];

      this.process = runCmd(bin, args, cwd);
      this._postStart();
    });
  }

  kill() {
    if (!this.process) {
      return;
    }

    try {
      this.process.kill();
    } catch (error) {
      console.error('[LND PROCESS] Failed to stop process:', error.message);
    }
  }

  isReady() {
    return this.state === STATE_READY;
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
        this.emit('started');
      }

      if (chunk.indexOf('LightningWallet opened') > -1) {
        this.state = STATE_UNLOCKED;
        this.emit('unlocked');
      }

      if (chunk.indexOf('Updating backup file') > -1) {
        if (this.state !== STATE_READY) {
          this.state = STATE_READY;
          this.emit('ready');
        }
      }
    });

    this.process.stderr.on('data', (chunk) => {
      console.error('[LND ERROR]', chunk);

      if (this.state < STATE_STARTED) {
        this.emit('error', new Error(chunk));
      }
    });

    this.process.on('error', (error) => {
      console.error('[LND ERROR]', error.message);
      this.emit('error', error);
    });

    this.process.on('exit', this._onExit.bind(this));
  }

  _onExit(code) {
    this.process.stdout.removeAllListeners();
    this.process.stderr.removeAllListeners();
    this.process.removeAllListeners();
    this.process = null;
    this.state = STATE_NOT_STARTED;
    this.emit('exit', code);

    console.log('[LND] Node was shutdown with exit code', code);
  }
}
