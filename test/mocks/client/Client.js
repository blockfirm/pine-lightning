import events from 'events';
import WebSocket from 'ws';
import axios from 'axios';

import { deserializeClientMessage } from '../../../src/serializers';
import { getPineUserId } from '../../../src/crypto';
import { getPineKeyPairFromMnemonic } from './crypto';
import { getAuthorizationHeader } from './authentication';
import { serializeResponse } from './serializers';
import methods from './methods';

const RECONNECT_INTERVAL = 1000;
const ERROR_CODE_NORMAL_CLOSE = 1000;

export default class Client extends events.EventEmitter {
  constructor(config) {
    const { mnemonic } = config;

    super();

    this.config = config;
    this.keyPair = getPineKeyPairFromMnemonic(mnemonic);
    this.userId = getPineUserId(this.keyPair.publicKey);
  }

  connect() {
    const { uri } = this.config.bridge;

    this.disconnect();

    return this._startSession().then(sessionId => {
      this.websocket = new WebSocket(uri, {
        headers: {
          Authorization: this._getWebSocketAuthorizationHeader(sessionId)
        }
      });

      this.websocket.on('open', this._onOpen.bind(this));
      this.websocket.on('close', this._onClose.bind(this));
      this.websocket.on('error', this._onError.bind(this));
      this.websocket.on('message', this._onMessage.bind(this));
      this.websocket.on('ping', this._onPing.bind(this));
    });
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

  _startSession() {
    const baseUri = this.config.bridge.sessionBaseUri;
    const endpoint = '/v1/lightning/sessions';

    const headers = {
      Authorization: this._getRestAuthorizationHeader(endpoint)
    };

    return axios.post(`${baseUri}${endpoint}`, null, { headers }).then(response => {
      this.sessionId = response.data.sessionId;
      console.log('[MOCK] Started new session: ', this.sessionId);
      return this.sessionId;
    });
  }

  _getRestAuthorizationHeader(endpoint) {
    const { userId, keyPair } = this;
    return getAuthorizationHeader(userId, endpoint, keyPair);
  }

  _getWebSocketAuthorizationHeader(sessionId) {
    const { keyPair } = this;
    return getAuthorizationHeader(sessionId, sessionId, keyPair);
  }

  _onOpen() {
    console.log('[MOCK] Connected');
    this._onPing();
  }

  _onClose(code) {
    clearTimeout(this._pingTimeout);

    if (code === ERROR_CODE_NORMAL_CLOSE) {
      return console.log('[MOCK] Disconnected');
    }

    // Try to reconnect.
    console.log('[MOCK] Reconnecting...');
    setTimeout(this.connect.bind(this), RECONNECT_INTERVAL);
  }

  _onError(error) {
    console.error(`[MOCK] ${error.name}: ${error.message}`);
    this.emit('error', error);
  }

  _onMessage(message) {
    let serverRequest;

    try {
      serverRequest = deserializeClientMessage(message);
    } catch (error) {
      this._onError(error);

      return this.websocket.send(
        serializeResponse({ id: 0, error: new Error('Malformed request') })
      );
    }

    if (serverRequest.error) {
      const error = new Error(serverRequest.error.message);
      error.name = serverRequest.error.name;
      return this._onError(error);
    }

    const { id, method, request } = serverRequest;

    if (!methods[method]) {
      const error = new Error('Invalid method');
      this.websocket.send(serializeResponse({ id, error }));
      return this._onError(error);
    }

    methods[method](request)
      .then(response => {
        this.websocket.send(serializeResponse({ id, response }));
        this.emit('response', response);
      })
      .catch(error => {
        this.websocket.send(serializeResponse({ id, error }));
        this._onError(error);
      });
  }

  _onPing() {
    const { pingInterval } = this.config.bridge;
    clearTimeout(this._pingTimeout);

    /**
     * Assume the connection is dead if no ping
     * has been received within the ping inter-
     * val + some assumption of latency.
     */
    this._pingTimeout = setTimeout(() => {
      this.websocket.terminate();
    }, pingInterval * 1000 + 2000);
  }
}
