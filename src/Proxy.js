import { ClientServer, NodeServer } from './servers';
import LndNodeManager from './lnd/LndNodeManager';

export default class Proxy {
  constructor(config) {
    this.config = config;

    this.lndNodeManager = new LndNodeManager(config.lnd);
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

  _onClientConnect({ pineId }) {
    this.lndNodeManager.spawn(pineId);
  }

  _onClientDisconnect({ pineId }) {
    this.lndNodeManager.stop(pineId);
  }

  _onNodeRequest({ pineId, methodName, request, callback }) {
    try {
      this.clientServer.sendRequest(pineId, methodName, request, callback);
    } catch (error) {
      console.error('[PROXY] Error', error.message);
      callback(error);
    }
  }
}
