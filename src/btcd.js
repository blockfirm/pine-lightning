import WebSocket from 'ws';
import config from './config';

const JSON_RPC_VERSION = '1.0';
const RECONNECT_INTERVAL = 1000;
const ERROR_CODE_NORMAL_CLOSE = 1000;

export class BtcdClient {
  constructor(conf) {
    this.config = conf;
    this._connect();
  }

  _connect() {
    const { username, password, uri } = this.config;

    this._disconnect();

    this.websocket = new WebSocket(uri, {
      headers: {
        // eslint-disable-next-line prefer-template
        Authorization: 'Basic ' + new Buffer(`${username}:${password}`).toString('base64')
      }
    });

    this.callCounter = 0;
    this.callbacks = {};

    this.websocket.on('open', this._onOpen.bind(this));
    this.websocket.on('close', this._onClose.bind(this));
    this.websocket.on('error', this._onError.bind(this));
    this.websocket.on('message', this._onMessage.bind(this));
  }

  _disconnect() {
    const websocket = this.websocket;

    if (!websocket) {
      return;
    }

    websocket.removeAllListeners();
    websocket.close();

    delete this.websocket;
  }

  call(method, params) {
    const callId = this.callCounter;

    const payload = {
      jsonrpc: JSON_RPC_VERSION,
      id: callId,
      method,
      params
    };

    this.callCounter++;

    return new Promise((resolve, reject) => {
      this.callbacks[callId] = (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      };

      this.websocket.send(JSON.stringify(payload), (error) => {
        if (error) {
          reject(error);
        }
      });
    });
  }

  decodeRawTransaction(rawTransaction) {
    return this.call('decoderawtransaction', [
      rawTransaction
    ]);
  }

  getRawTransaction(txid) {
    const verbose = 1;

    const params = [
      txid,
      verbose
    ];

    return this.call('getrawtransaction', params)
      .then((transaction) => {
        /**
         * The getrawtransaction API doesn't return a time for
         * unconfirmed transactions. Ideally, it would be the time
         * at which it was received by the node. This workaound
         * sets it to the current time instead.
         */
        transaction.time = transaction.time || (new Date().getTime() / 1000);
        return transaction;
      });
  }

  _onOpen() {
    console.log('[BTCD] ✅ Connected');
  }

  _onClose(code) {
    console.error(`[BTCD] ⛔️ Disconnected (${code})`);

    if (code === ERROR_CODE_NORMAL_CLOSE) {
      return;
    }

    // Try to reconnect.
    setTimeout(() => {
      this._connect();
    }, RECONNECT_INTERVAL);
  }

  _onError(error) {
    console.error('[BTCD] 🔥 Error: ', error.message);
  }

  _onMessage(message) {
    const data = JSON.parse(message);
    const callback = this.callbacks[data.id];

    if (callback) {
      callback(data.error, data.result);
      delete this.callbacks[data.id];
    } else if (data.method === 'relevanttxaccepted') {
      this.onRelevantTxAccepted(data.params[0]);
    }
  }
}

const btcd = new BtcdClient(config.btcd);
export default btcd;
