/* eslint-disable max-lines */
import logger from './logger';
import { RedisClient } from './database';
import { ClientServer, NodeServer, SessionServer } from './servers';
import LndGateway from './lnd/LndGateway';
import LndNodeManager from './lnd/LndNodeManager';
import methods from './methods';

const getRedisKey = (pineId, key) => (
  `pine:lightning:user:${pineId}:${key}`
);

export default class Proxy {
  constructor(config) {
    this.config = config;
    this.logger = logger.child({ scope: 'Proxy' });

    this.redis = new RedisClient(config.redis);
    this.gateway = new LndGateway(config.lnd.gateway);
    this.lndNodeManager = new LndNodeManager(config.lnd, config.servers.node, this.redis);
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
        this.logger.error(`Error when spawning client node: ${error.message}`, { pineId });
        return this.clientServer.sendError(pineId, 0, error);
      })
      .catch(error => {
        this.logger.error(`Error when sending error to client: ${error.message}`, { pineId });
      });
  }

  _onClientDisconnect({ pineId }) {
    this.lndNodeManager.idle(pineId);
  }

  _onClientRequest({ pineId, methodName, request, callId }) {
    try {
      const method = methods[methodName];

      if (!method) {
        this.logger.error('Invalid client request method', { pineId });
        return this.clientServer.sendError(pineId, callId, new Error('Invalid method'));
      }

      const lnd = this.lndNodeManager.getNodeByPineId(pineId);
      const { gateway, redis } = this;

      this.logger.info(`Processing client request for method '${methodName}'...`, {
        pineId,
        methodName
      });

      method({ request, pineId, lnd, gateway, redis })
        .then(response => {
          this.clientServer.sendResponse(pineId, callId, response);
        })
        .catch(error => {
          this.logger.error(`Error when processing client request: ${error.message}`, {
            pineId,
            methodName
          });
          this.clientServer.sendError(pineId, callId, error);
        })
        .catch(error => {
          this.logger.error(`Error when sending error to client: ${error.message}`, {
            pineId,
            methodName
          });
        });
    } catch (error) {
      try {
        this.clientServer.sendError(pineId, callId, error);
      } catch (sendError) {
        this.logger.error(`Error when sending error to client: ${sendError.message}`, {
          pineId,
          methodName
        });
      }
    }
  }

  _onNodeReady({ pineId }) {
    try {
      this.clientServer.sendEvent(pineId, 'ready');
    } catch (error) {
      this.logger.error(`Error when sending 'ready' event to client: ${error.message}`, { pineId });
    }
  }

  _annotateNodeRequest(pineId, methodName, request) {
    return Promise.resolve().then(() => {
      switch (methodName) {
        case 'deriveNextKey':
          return this.redis.incr(getRedisKey(pineId, `key-family:${request.keyFamily}:key-index`))
            .then(keyIndex => {
              request.keyIndex = keyIndex;
            });

        case 'getRevocationRootKey':
          return this.redis.incr(getRedisKey(pineId, 'revocation-root-key-index'))
            .then(keyIndex => {
              request.keyIndex = keyIndex;
            });
      }
    });
  }

  _onNodeRequest({ pineId, methodName, request, callback }) {
    this.logger.info(`Processing node request for method '${methodName}'...`, {
      pineId,
      methodName
    });

    this._annotateNodeRequest(pineId, methodName, request)
      .then(() => {
        this.clientServer.sendRequest(pineId, methodName, request, callback);
      })
      .catch(error => {
        this.logger.error(`Error when processing node request: ${error.message}`, {
          pineId,
          methodName
        });

        callback(error);

        if (!this.clientServer.isClientConnected(pineId)) {
          this.lndNodeManager.stop(pineId);
        }
      });
  }
}
