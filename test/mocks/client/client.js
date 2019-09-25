import WebSocket from 'ws';
import deserialize from '../../../src/deserialize';
import methods from './methods';

const RECONNECT_INTERVAL = 1000;
const ERROR_CODE_NORMAL_CLOSE = 1000;

export default class Client {
  constructor(config) {
    this.config = config;
  }

  connect() {
    this.disconnect();

    this.websocket = new WebSocket(this.config.uri);

    this.websocket.on('open', this._onOpen.bind(this));
    this.websocket.on('close', this._onClose.bind(this));
    this.websocket.on('error', this._onError.bind(this));
    this.websocket.on('message', this._onMessage.bind(this));
  }

  disconnect() {
    const { websocket } = this;

    if (!websocket) {
      return;
    }

    websocket.removeAllListeners();
    websocket.close();

    delete this.websocket;
  }

  _onOpen() {
    console.log('[MOCK] Connected');
  }

  _onClose(code) {
    if (code === ERROR_CODE_NORMAL_CLOSE) {
      return console.log('[MOCK] Disconnected');
    }

    // Try to reconnect.
    console.log('[MOCK] Reconnecting...');
    setTimeout(this.connect.bind(this), RECONNECT_INTERVAL);
  }

  _onError(error) {
    console.error('[MOCK] Error:', error.message);
  }

  _onMessage(message) {
    let serverRequest;

    try {
      serverRequest = deserialize(message);
    } catch (error) {
      return this.websocket.send(JSON.stringify({ error: 'Malformed request' }));
    }

    const { id, method, request } = serverRequest;

    if (!methods[method]) {
      this.websocket.send(JSON.stringify({ id, error: 'Invalid method' }));
      return console.error('[MOCK] Invalid method', method);
    }

    methods[method](request)
      .then(response => {
        this.websocket.send(JSON.stringify({ id, response }));
      })
      .catch(error => {
        this.websocket.send(JSON.stringify({ id, error: error.message }));
      });
  }
}
