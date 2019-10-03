import http from 'http';
import events from 'events';
import WebSocket from 'ws';
import { RateLimiter } from 'limiter';

import { verifyPineSignature } from '../crypto';
import { deserializeClientMessage, serializeError } from '../serializers';
import { validateClientMessage } from '../validators';

export default class ClientServer extends events.EventEmitter {
  constructor(config, sessions) {
    super();

    this.clients = {};
    this.config = config;
    this.sessions = sessions;
    this.server = http.createServer();

    this.wss = new WebSocket.Server({
      maxPayload: config.maxPayload,
      noServer: true
    });

    this.wss.on('connection', this._onClientConnect.bind(this));
    this.wss.on('error', this._onError.bind(this));
    this.server.on('upgrade', this._onUpgrade.bind(this));
  }

  start() {
    const { host, port } = this.config;
    this.server.listen(port, host);
    console.log(`[CLIENT] Server listening at ${host}:${port}`);
  }

  stop() {
    this.server.close();
    this.server.removeAllListeners();
    this.wss.removeAllListeners();

    console.log('[CLIENT] Server was stopped');
  }

  // eslint-disable-next-line max-params
  sendRequest(pineId, methodName, request, callback) {
    const client = this.clients[pineId];

    if (!client) {
      throw Error('Client is not connected');
    }

    const callId = client.callCounter++;

    const data = JSON.stringify({
      id: callId,
      method: methodName,
      request
    });

    client.callbacks[callId] = callback;
    client.send(data);
  }

  sendError(pineId, error) {
    const client = this.clients[pineId];

    if (!client) {
      throw Error('Client is not connected');
    }

    client.send(serializeError(error));
  }

  _authenticateRequest(request) {
    const authorization = request.headers.authorization;

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
      console.error('[CLIENT] Client authentication failed:', error.message);
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

    ws.on('message', (message) => {
      limiter.removeTokens(1, (error, remainingRequests) => {
        if (error || remainingRequests < 1) {
          console.error(`[CLIENT] ${pineId} has reached its rate limit`);
        } else {
          this._onClientMessage(ws, message);
        }
      });
    });

    ws.on('close', this._onClientDisconnect.bind(this, ws));

    this.emit('connect', ws);
    console.log(`[CLIENT] ${pineId} connected`);
  }

  _onClientDisconnect(ws) {
    delete this.clients[ws.pineId];
    ws.removeAllListeners();
    this.emit('disconnect', ws);
    console.log(`[CLIENT] ${ws.pineId} disconnected`);
  }

  _onError(error) {
    console.error('[CLIENT] Server error:', error.message);
  }

  _onClientMessage(ws, message) {
    let deserialized;

    try {
      deserialized = deserializeClientMessage(message);
      deserialized = validateClientMessage(deserialized);
    } catch (error) {
      return console.error('[CLIENT] Error when parsing message:', error.message);
    }

    const { id, response, error } = deserialized;
    const callback = ws.callbacks[id];

    if (!callback) {
      return console.error('[CLIENT] No callback found for call');
    }

    if (error) {
      callback(new Error(error.message));
    } else {
      callback(null, response);
    }

    delete ws.callbacks[id];
  }
}
