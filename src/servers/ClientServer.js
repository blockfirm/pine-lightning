import http from 'http';
import events from 'events';
import WebSocket from 'ws';
import uuidv4 from 'uuid/v4';
import deserialize from '../deserialize';

export default class ClientServer {
  constructor(config) {
    this.eventEmitter = new events.EventEmitter();
    this.clients = [];
    this.config = config;

    this.server = http.createServer();
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', this._onClientConnect.bind(this));
    this.wss.on('close', this._onClose.bind(this));
    this.wss.on('error', this._onError.bind(this));
  }

  start() {
    const { host, port } = this.config;
    this.server.listen(port, host);
    console.log(`[CLIENT] Server listening at ${host}:${port}`);
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

  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }

  _onClientConnect(ws) {
    const pineId = uuidv4();

    delete this.clients[pineId];
    this.clients[pineId] = ws;

    ws.pineId = pineId;
    ws.callCounter = ws.callCounter || 0;
    ws.callbacks = ws.callbacks || {};

    ws.on('message', this._onClientMessage.bind(this, ws));
    ws.on('close', this._onClientDisconnect.bind(this, ws));

    this.eventEmitter.emit('connect', ws);
    console.log('[CLIENT] New client connected');
  }

  _onClientDisconnect(ws) {
    delete this.clients[ws.pineId];
    this.eventEmitter.emit('disconnect', ws);
  }

  _onClose() {
    console.log('[CLIENT] Server stopped listening');
  }

  _onError(error) {
    console.error('[CLIENT] Server error:', error.message);
  }

  _onClientMessage(ws, message) {
    let deserialized;

    try {
      deserialized = deserialize(message);
    } catch (error) {
      return console.error('[CLIENT] Error when parsing message:', error.message);
    }

    const { id, response, error } = deserialized;
    const callback = ws.callbacks[id];

    if (!callback) {
      return console.error('[CLIENT] No callback found for call');
    }

    if (error) {
      callback(new Error(error));
    } else {
      callback(null, response);
    }

    delete ws.callbacks[id];
  }
}
