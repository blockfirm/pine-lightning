import { ClientServer, NodeServer, SessionServer } from './servers';
import LndNodeManager from './lnd/LndNodeManager';
import methods from './methods';

export default class Proxy {
  constructor(config) {
    this.config = config;

    this.lndNodeManager = new LndNodeManager(config.lnd, config.servers.node);
    this.sessionServer = new SessionServer(config.servers.session);
    this.clientServer = new ClientServer(config.servers.client, this.sessionServer.sessions);
    this.nodeServer = new NodeServer(config.servers.node);

    this.clientServer.on('connect', this._onClientConnect.bind(this));
    this.clientServer.on('disconnect', this._onClientDisconnect.bind(this));
    this.clientServer.on('request', this._onClientRequest.bind(this));

    this.nodeServer.on('request', this._onNodeRequest.bind(this));
  }

  start() {
    this.nodeServer.start();
    this.sessionServer.start();
    this.clientServer.start();
  }

  stop() {
    this.clientServer.stop();
    this.sessionServer.stop();
    this.nodeServer.stop();

    return this.lndNodeManager.stopAll();
  }

  _onClientConnect({ pineId }) {
    this.lndNodeManager.spawn(pineId)
      .catch(error => {
        console.error('[PROXY] Spawn Error:', error.message);
        return this.clientServer.sendError(pineId, 0, error);
      })
      .catch(error => {
        console.error('[PROXY] Send Error:', error.message);
      });
  }

  _onClientDisconnect({ pineId }) {
    this.lndNodeManager.idle(pineId);
  }

  _onClientRequest({ pineId, methodName, request, callId }) {
    const method = methods[methodName];

    if (!method) {
      this.clientServer.sendError(pineId, callId, new Error('Invalid method'));
    }

    const lnd = this.lndNodeManager.getNodeByPineId(pineId);

    method({ request, lnd })
      .then(response => {
        this.clientServer.sendResponse(pineId, callId, response);
      })
      .catch(error => {
        this.clientServer.sendError(pineId, callId, error);
      });
  }

  _onNodeRequest({ pineId, methodName, request, callback }) {
    try {
      this.clientServer.sendRequest(pineId, methodName, request, callback);
    } catch (error) {
      console.error('[PROXY] Request Error:', error.message);
      callback(error);
    }
  }
}
