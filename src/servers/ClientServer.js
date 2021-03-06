/* eslint-disable max-lines */
import http from 'http';
import events from 'events';
import WebSocket from 'ws';
import { RateLimiter } from 'limiter';

import logger from '../logger';
import { verifyPineSignature } from '../crypto';
import { validateClientMessage } from '../validators';

import {
  deserializeClientMessage,
  serializeRequest,
  serializeResponse,
  serializeEvent
} from '../serializers';

const getAuthorizationFromHeaders = (headers) => {
  const { authorization } = headers;
  const secWebsocketProtocol = headers['sec-websocket-protocol'];

  return authorization || secWebsocketProtocol;
};

export default class ClientServer extends events.EventEmitter {
  constructor(config, sessions) {
    super();

    this.clients = {};
    this.config = config;
    this.sessions = sessions;
    this.server = http.createServer();
    this.logger = logger.child({ scope: 'ClientServer' });

    this.wss = new WebSocket.Server({
      maxPayload: config.maxPayload,
      noServer: true
    });

    this.wss.on('connection', this._onClientConnect.bind(this));
    this.wss.on('error', this._onError.bind(this));
    this.server.on('upgrade', this._onUpgrade.bind(this));
  }

  start() {
    const { host, port, pingInterval } = this.config;

    this._pingInterval = setInterval(
      this._ping.bind(this),
      pingInterval * 1000
    );

    this.server.listen(port, host);
    this.logger.info(`Client server is listening at ${host}:${port}`);
  }

  stop() {
    clearInterval(this._pingInterval);

    this.server.close();
    this.server.removeAllListeners();
    this.wss.removeAllListeners();

    this.logger.info('Client server was stopped');
  }

  // eslint-disable-next-line max-params
  sendRequest(pineId, methodName, request, callback) {
    const client = this.clients[pineId];

    if (!client) {
      throw new Error('Client is not connected');
    }

    const callId = client.callCounter++;

    const data = serializeRequest({
      id: callId,
      method: methodName,
      request
    });

    client.callbacks[callId] = callback;
    client.send(data);
  }

  // eslint-disable-next-line max-params
  sendResponse(pineId, callId, response, error) {
    const client = this.clients[pineId];

    if (!client) {
      throw new Error('Client is not connected');
    }

    client.send(serializeResponse({ id: callId, response, error }));
  }

  sendEvent(pineId, eventName, data) {
    const client = this.clients[pineId];

    if (!client) {
      throw new Error('Client is not connected');
    }

    client.send(serializeEvent({ event: eventName, data }));
  }

  sendError(pineId, callId, error) {
    if (callId) {
      return this.sendResponse(pineId, callId, null, error);
    }

    return this.sendEvent(pineId, 'error', {
      name: error.name,
      message: error.message
    });
  }

  isClientConnected(pineId) {
    const client = this.clients[pineId];
    return client && client.isAlive;
  }

  _ping() {
    const { clients } = this;

    Object.values(clients).forEach(ws => {
      if (ws.isAlive === false) {
        this.logger.warn('Client ping failed, terminating websocket...', {
          pineId: ws.pineId
        });

        return ws.terminate();
      }

      ws.isAlive = false;
      ws.send('ping');
    });
  }

  _authenticateRequest(request) {
    const authorization = getAuthorizationFromHeaders(request.headers);

    if (!authorization) {
      throw new Error('Authorization header is missing');
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Basic' || !token) {
      throw new Error('Invalid authorization type');
    }

    const credentials = Buffer.from(token, 'base64').toString();
    const [sessionId, signature] = credentials.split(':');

    if (!sessionId || !signature) {
      throw new Error('Missing basic authorization credentials');
    }

    const pineId = this.sessions[sessionId];
    const isVerified = pineId && verifyPineSignature(sessionId, signature, pineId);

    if (!isVerified) {
      throw new Error('Invalid session ID or signature');
    }

    return pineId;
  }

  _onUpgrade(request, socket, head) {
    let pineId;

    try {
      pineId = this._authenticateRequest(request);
    } catch (error) {
      this.logger.error(`Client authentication failed: ${error.message}`);
      return socket.destroy();
    }

    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request, pineId);
    });
  }

  _onClientConnect(ws, request, pineId) {
    const { rateLimit } = this.config;

    const limiter = new RateLimiter(
      rateLimit.messages, rateLimit.interval, true
    );

    this.clients[pineId] = ws;

    ws.pineId = pineId;
    ws.callCounter = ws.callCounter || 1;
    ws.callbacks = ws.callbacks || {};
    ws.isAlive = true;

    ws.on('message', (message) => {
      limiter.removeTokens(1, (error, remainingRequests) => {
        if (error) {
          this.logger.error(`Client rate limiting failed with error: ${error.message}`, { pineId });
        } else if (remainingRequests < 1) {
          this.logger.error(`Client has reached its rate limit`, { pineId });
        } else {
          this._onClientMessage(ws, message);
        }
      });
    });

    ws.on('close', this._onClientDisconnect.bind(this, ws));

    this.emit('connect', ws);
    this.logger.info('New client connected', { pineId });
  }

  _onClientDisconnect(ws) {
    delete this.clients[ws.pineId];
    ws.removeAllListeners();
    this.emit('disconnect', ws);
    this.logger.info('Client disconnected', { pineId: ws.pineId });
  }

  _onError(error) {
    this.logger.error(`Client server error: ${error.message}`);
  }

  // eslint-disable-next-line max-statements
  _onClientMessage(ws, message) {
    let deserialized;

    if (message === 'pong') {
      ws.isAlive = true;
      return;
    }

    try {
      deserialized = deserializeClientMessage(message);
      deserialized = validateClientMessage(deserialized);
    } catch (error) {
      return this.logger.error(`Error when parsing client message: ${error.message}`, {
        pineId: ws.pineId
      });
    }

    const { id, response, request, method, error } = deserialized;
    const callback = ws.callbacks[id];

    if (request) {
      return this.emit('request', {
        callId: id,
        pineId: ws.pineId,
        methodName: method,
        request
      });
    }

    if (!callback) {
      return this.logger.error(`No callback found for call #${id}}`, { pineId: ws.pineId });
    }

    if (error) {
      callback(new Error(error.message));
    } else {
      callback(null, response);
    }

    delete ws.callbacks[id];
  }
}
