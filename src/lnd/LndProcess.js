/* eslint-disable max-lines */
import { spawn } from 'child_process';
import path from 'path';
import events from 'events';
import makeDir from 'make-dir';
import logger from '../logger';

const STATE_NOT_STARTED = 0;
const STATE_STARTED = 1;
const STATE_UNLOCKED = 3;
const STATE_SYNCING = 4
const STATE_READY = 5;

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
    this.logger = logger.child({ scope: 'LndProcess' });
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
        '--nobootstrap',
        '--autopilot.maxchannels=0'
      ];

      this.logger.info(`Running ${bin} ${args.join(' ')}...`, {
        pineId: this.pineId,
        cwd
      });

      this.process = runCmd(bin, args, cwd);
      this._postStart();
    });
  }

  kill(signal = 'SIGTERM') {
    if (!this.process) {
      return this.logger.warn(`No LND process to kill (${signal})`, {
        pineId: this.pineId,
        signal
      });
    }

    try {
      this.logger.info(`Killing LND process (${signal})...`, {
        pineId: this.pineId,
        signal
      });

      return this.process.kill(signal);
    } catch (error) {
      this.logger.error(`Failed to kill (${signal}) LND process: ${error.message}`, {
        pineId: this.pineId,
        signal
      });
    }
  }

  forceKill() {
    return this.kill('SIGKILL');
  }

  isSyncing() {
    return this.state === STATE_SYNCING;
  }

  isReady() {
    return this.state === STATE_READY;
  }

  _logProcessOutput(output, isStdErr = false) {
    output.split('\n').forEach(line => {
      if (!line.trim()) {
        return;
      }

      if (isStdErr) {
        this.logger.error(line.trim(), { pineId: this.pineId });
      } else {
        this.logger.info(line.trim(), { pineId: this.pineId });
      }
    });
  }

  _getCwd() {
    return path.join(this.config.cwdRoot, this.pineId);
  }

  _preStart() {
    return makeDir(this.cwd);
  }

  _postStart() {
    // eslint-disable-next-line max-statements
    this.process.stdout.on('data', (chunk) => {
      const isError = chunk.indexOf('[ERR]') > -1;

      this._logProcessOutput(chunk, isError);

      if (chunk.indexOf('Waiting for wallet encryption password') > -1) {
        this.state = STATE_STARTED;
        this.emit('started');
      }

      if (chunk.indexOf('LightningWallet opened') > -1) {
        this.state = STATE_UNLOCKED;
        this.emit('unlocked');
      }

      if (chunk.indexOf('Syncing channel graph') > -1 || chunk.indexOf('Catching up block hashes') > -1) {
        if (this.state === STATE_UNLOCKED) {
          this.state = STATE_SYNCING;
        }
      }

      if (chunk.indexOf('Graph pruning complete') > -1 || chunk.indexOf('Done catching up block hashes') > -1) {
        if (this.state === STATE_SYNCING) {
          this.state = STATE_UNLOCKED;
        }
      }

      if (chunk.indexOf('Updating backup file') > -1) {
        if (this.state !== STATE_READY) {
          this.state = STATE_READY;

          setTimeout(() => {
            this.emit('ready');
          }, 1500);
        }
      }
    });

    this.process.stderr.on('data', (chunk) => {
      this._logProcessOutput(chunk, true);

      if (this.state < STATE_STARTED) {
        this.emit('error', new Error(chunk));
      }
    });

    this.process.on('error', (error) => {
      this.logger.error(`Error: ${error.message}`, { pineId: this.pineId });
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

    this.logger.info(`LND process exited with code ${code}`, {
      pineId: this.pineId,
      exitCode: code
    });
  }
}
