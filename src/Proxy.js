import { ClientServer, NodeServer } from './servers';
import LndNode from './lnd/LndNode';

export default class Proxy {
  constructor(config) {
    this.config = config;

    this.lndNode = new LndNode(config.lnd);
    this.clientServer = new ClientServer(config.servers.client);
    this.nodeServer = new NodeServer(config.servers.node);

    this.clientServer.on('connect', this._onClientConnect.bind(this));
    this.clientServer.on('disconnect', this._onClientDisconnect.bind(this));

    this.nodeServer.on('request', this._onNodeRequest.bind(this));
  }

  start() {
    this.clientServer.start();
    this.nodeServer.start();
  }

  _onClientConnect() {
    this.lndNode.start();
  }

  _onClientDisconnect() {
    this.lndNode.stop();
  }

  _onNodeRequest(methodName, request, callback) {
    try {
      this.clientServer.sendRequest(methodName, request, callback);
    } catch (error) {
      console.error('[PROXY] Error', error.message);
      callback(error);
    }
  }
}
