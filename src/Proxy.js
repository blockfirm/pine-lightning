import { ClientServer, NodeServer, SessionServer } from './servers';
import LndNodeManager from './lnd/LndNodeManager';

export default class Proxy {
  constructor(config) {
    this.config = config;

    this.lndNodeManager = new LndNodeManager(config.lnd, config.servers.node);
    this.sessionServer = new SessionServer(config.servers.session);
    this.clientServer = new ClientServer(config.servers.client, this.sessionServer.sessions);
    this.nodeServer = new NodeServer(config.servers.node);

    this.clientServer.on('connect', this._onClientConnect.bind(this));
    this.clientServer.on('disconnect', this._onClientDisconnect.bind(this));

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
        this.clientServer.sendError(pineId, error);
      })
      .catch(error => {
        console.error('[PROXY] Send Error:', error.message);
      });
  }

  _onClientDisconnect({ pineId }) {
    this.lndNodeManager.stop(pineId).catch(error => {
      console.error('[PROXY] Failed to stop lnd node:', error.message);
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
