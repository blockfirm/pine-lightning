import http from 'http';
import WebSocket from 'ws';

export default class ClientServer {
  constructor(config) {
    this.config = config;
    this.server = http.createServer();

    this.wss = new WebSocket.Server({
      server: this.server,
      clientTracking: true
    });

    this.wss.on('connection', this._onConnection.bind(this));
    this.wss.on('close', this._onClose.bind(this));
    this.wss.on('error', this._onError.bind(this));
    this.wss.on('listen', this._onListen.bind(this));
  }

  start() {
    const { host, port } = this.config;
    this.server.listen(port, host);
  }

  sendRequest(methodName, request, callback) {
    const { clients } = this.wss;

    if (!clients || !clients.size) {
      throw Error('Client is not connected');
    }

    const client = clients.values().next().value;
    const callId = client.callCounter++;

    const data = JSON.stringify({
      id: callId,
      method: methodName,
      request
    });

    client.callbacks[callId] = callback;
    client.send(data);
  }

  _onConnection(ws) {
    console.log('[CLIENT] New client connected');

    ws.callCounter = ws.callCounter || 0;
    ws.callbacks = ws.callbacks || {};

    ws.on('message', this._onClientMessage.bind(this, ws));
  }

  _onClose() {
    console.log('[CLIENT] Server stopped listening');
  }

  _onError(error) {
    console.error('[CLIENT] Server error:', error.message);
  }

  _onListen() {
    const { host, port } = this.config;
    console.log(`[CLIENT] Server listening at ${host}:${port}`);
  }

  _onClientMessage(ws, message) {
    const { id, response, error } = JSON.parse(message);
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
