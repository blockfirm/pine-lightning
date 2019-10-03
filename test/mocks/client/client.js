import fs from 'fs';
import WebSocket from 'ws';
import axios from 'axios';

import { deserializeClientMessage } from '../../../src/serializers';
import getPineUserId from '../../../src/crypto/getPineUserId';
import { getPineKeyPairFromMnemonic } from './crypto';
import { getAuthorizationHeader } from './authentication';
import { serializeResponse } from './serializers';
import methods from './methods';

const RECONNECT_INTERVAL = 1000;
const ERROR_CODE_NORMAL_CLOSE = 1000;

export default class Client {
  constructor(config) {
    const { mnemonic } = config;

    this.config = config;
    this.keyPair = getPineKeyPairFromMnemonic(mnemonic);
    this.userId = getPineUserId(this.keyPair.publicKey);
  }

  connect() {
    const { uri, certPath } = this.config.bridge;
    const cert = fs.readFileSync(certPath);

    this.disconnect();

    return this._startSession().then(sessionId => {
      this.websocket = new WebSocket(uri, {
        headers: {
          Authorization: this._getWebSocketAuthorizationHeader(sessionId)
        },
        ca: [cert],
        cert
      });

      this.websocket.on('open', this._onOpen.bind(this));
      this.websocket.on('close', this._onClose.bind(this));
      this.websocket.on('error', this._onError.bind(this));
      this.websocket.on('message', this._onMessage.bind(this));
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
    console.error(`[MOCK] ${error.name}: ${error.message}`);
  }

  _onMessage(message) {
    let serverRequest;

    try {
      serverRequest = deserializeClientMessage(message);
    } catch (error) {
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
      this.websocket.send(serializeResponse({
        id, error: new Error('Invalid method')
      }));

      return console.error('[MOCK] Invalid method', method);
    }

    methods[method](request)
      .then(response => {
        this.websocket.send(serializeResponse({ id, response }));
      })
      .catch(error => {
        this.websocket.send(serializeResponse({ id, error }));
      });
  }
}
