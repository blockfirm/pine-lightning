import events from 'events';
import WebSocket from 'ws';
import axios from 'axios';

import {
  deserializeClientMessage,
  serializeResponse,
  serializeRequest
} from '../../../src/serializers';

import { getPineUserId } from '../../../src/crypto';
import { getPineKeyPairFromMnemonic } from './crypto';
import { getAuthorizationHeader } from './authentication';
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

    this.callCounter = 1;
    this.callbacks = {};
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

  sendRequest(methodName, request, callback) {
    const callId = this.callCounter++;

    const data = serializeRequest({
      id: callId,
      method: methodName,
      request
    });

    this.callbacks[callId] = callback;
    this.websocket.send(data);
  }

  sendResponse(callId, response, error) {
    this.websocket.send(serializeResponse({ id: callId, response, error }));
  }

  sendError(callId, error) {
    return this.sendResponse(callId, null, error);
  }

  openChannel(sats) {
    return new Promise((resolve, reject) => {
      this.sendRequest('openChannel', { sats }, (error, response) => {
        if (error) {
          return reject(error);
        }

        resolve(response);
      });
    });
  }

  openInboundChannel() {
    return new Promise((resolve, reject) => {
      this.sendRequest('openInboundChannel', {}, (error, response) => {
        if (error) {
          return reject(error);
        }

        resolve(response);
      });
    });
  }

  closeChannel() {
    return new Promise((resolve, reject) => {
      this.sendRequest('closeChannel', {}, (error, response) => {
        if (error) {
          return reject(error);
        }

        resolve(response);
      });
    });
  }

  getBalance() {
    return new Promise((resolve, reject) => {
      this.sendRequest('getBalance', {}, (error, response) => {
        if (error) {
          return reject(error);
        }

        resolve(response);
      });
    });
  }

  sendPayment(paymentRequest) {
    return new Promise((resolve, reject) => {
      this.sendRequest('sendPayment', { paymentRequest }, (error, response) => {
        if (error) {
          return reject(error);
        }

        resolve(response);
      });
    });
  }

  createInvoice(amount) {
    return new Promise((resolve, reject) => {
      this.sendRequest('createInvoice', { amount }, (error, response) => {
        if (error) {
          return reject(error);
        }

        resolve(response);
      });
    });
  }

  _startSession() {
    const baseUri = this.config.bridge.sessionBaseUri;
    const endpoint = '/v1/lightning/sessions';

    const headers = {
      Authorization: this._getRestAuthorizationHeader(endpoint)
    };

    return axios.post(`${baseUri}${endpoint}`, null, { headers }).then(response => {
      this.sessionId = response.data.sessionId;
      console.log('[MOCK] Started new session:', this.sessionId);
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

  _onReady() {
    console.log('[MOCK] Ready');
    this.emit('ready');
  }

  _handleEventMessage(eventMessage) {
    const { event } = eventMessage;
    const data = eventMessage.data || {};
    let error;

    switch (event) {
      case 'error':
        error = new Error(data.message);
        error.name = data.name;
        return this._onError(error);

      case 'ready':
        return this._onReady();

      default:
        console.error(`[MOCK] Unknown event '${event}'`);
    }
  }

  _handleResponseMessage(responseMessage) {
    const { id, response, error } = responseMessage;
    const callback = this.callbacks[id];

    if (!callback) {
      return console.error('[MOCK] No callback found for call');
    }

    if (error) {
      callback(new Error(error.message));
    } else {
      callback(null, response);
    }

    delete this.callbacks[id];
  }

  _handleRequestMessage(requestMessage) {
    const { id, method, request } = requestMessage;

    if (!methods[method]) {
      const error = new Error('Invalid method');
      this._onError(error);
      return this.sendError(id, error);
    }

    methods[method](request)
      .then(response => {
        this.sendResponse(id, response);
        this.emit('response', response);
      })
      .catch(error => {
        this.sendError(id, error);
        this._onError(error);
      });
  }

  _onMessage(message) {
    let deserializedMessage;

    if (message === 'ping') {
      return this._onPing();
    }

    try {
      deserializedMessage = deserializeClientMessage(message);
    } catch (error) {
      this._onError(error);
      return this.sendError(0, new Error('Malformed request'));
    }

    if (deserializedMessage.event) {
      return this._handleEventMessage(deserializedMessage);
    }

    if (deserializedMessage.response || deserializedMessage.error) {
      return this._handleResponseMessage(deserializedMessage);
    }

    return this._handleRequestMessage(deserializedMessage);
  }

  _onPing() {
    const { pingInterval } = this.config.bridge;

    // Respond with pong.
    this.websocket.send('pong');

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
