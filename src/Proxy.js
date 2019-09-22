import { ClientServer, NodeServer } from './servers';

export default class Proxy {
  constructor(config) {
    this.config = config;

    this.clientServer = new ClientServer(config.servers.client);
    this.nodeServer = new NodeServer(config.servers.node);

    this.nodeServer.onRequest(this._proxyRequest.bind(this));
  }

  start() {
    this.clientServer.start();
    this.nodeServer.start();

    // DEBUG 1
    setTimeout(() => {
      this._proxyRequest('deriveKey', {
        keyLocator: {
          keyFamily: 5,
          index: 0
        }
      }, (error, response) => {
        console.log('[PROXY] deriveKey', error, response);
      });
    }, 10000);

    // DEBUG 2
    setTimeout(() => {
      this._proxyRequest('newAddress', {
        type: 2,
        change: 0
      }, (error, response) => {
        console.log('[PROXY] newAddress', error, response);
      });
    }, 10000);
  }

  _proxyRequest(methodName, request, callback) {
    try {
      this.clientServer.sendRequest(methodName, request, callback);
    } catch (error) {
      console.error('[PROXY] Error', error.message);
      callback(error);
    }
  }
}
