import { RedisClient } from './database';
import { ClientServer, NodeServer, SessionServer } from './servers';
import LndNodeManager from './lnd/LndNodeManager';
import methods from './methods';

export default class Proxy {
  constructor(config) {
    this.config = config;

    this.redis = new RedisClient(config.redis);
    this.lndNodeManager = new LndNodeManager(config.lnd, config.servers.node);
    this.sessionServer = new SessionServer(config.servers.session);
    this.clientServer = new ClientServer(config.servers.client, this.sessionServer.sessions);
    this.nodeServer = new NodeServer(config.servers.node);

    this.clientServer.on('connect', this._onClientConnect.bind(this));
    this.clientServer.on('disconnect', this._onClientDisconnect.bind(this));
    this.clientServer.on('request', this._onClientRequest.bind(this));

    this.lndNodeManager.on('ready', this._onNodeReady.bind(this));
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

    return this.lndNodeManager.stopAll().then(() => {
      this.lndNodeManager.removeAllListeners();
    });
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
    try {
      const method = methods[methodName];

      if (!method) {
        this.clientServer.sendError(pineId, callId, new Error('Invalid method'));
      }

      const lnd = this.lndNodeManager.getNodeByPineId(pineId);
      const redis = this.redis;

      method({ request, pineId, lnd, redis })
        .then(response => {
          this.clientServer.sendResponse(pineId, callId, response);
        })
        .catch(error => {
          this.clientServer.sendError(pineId, callId, error);
        })
        .catch(error => {
          console.error('[PROXY] On client request error:', error.message);
        });
    } catch (error) {
      try {
        this.clientServer.sendError(pineId, callId, error);
      } catch (sendError) {
        console.error('[PROXY] On client request error:', sendError.message);
      }
    }
  }

  _onNodeReady({ pineId }) {
    try {
      this.clientServer.sendEvent(pineId, 'ready');
    } catch (error) {
      console.error('[PROXY] On ready error:', error.message);
    }
  }

  _onNodeRequest({ pineId, methodName, request, callback }) {
    try {
      this.clientServer.sendRequest(pineId, methodName, request, callback);
    } catch (error) {
      console.error('[PROXY] Request Error:', error.message);
      callback(error);

      if (!this.clientServer.isClientConnected(pineId)) {
        this.lndNodeManager.stop(pineId);
      }
    }
  }
}
