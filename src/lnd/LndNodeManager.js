import events from 'events';
import net from 'net';

import logger from '../logger';
import LndNode from './LndNode';

const server = net.createServer();

const getUnusedPort = () => {
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;

      server.once('close', () => resolve(port));
      server.once('error', () => reject());

      server.close();
    });
  });
};

export default class LndNodeManager extends events.EventEmitter {
  constructor(config, serverConfig, redis) {
    super();

    this.config = config;
    this.logger = logger.child({ scope: 'LndNodeManager' });
    this.serverConfig = serverConfig;
    this.redis = redis;
    this.nodes = {};
  }

  spawn(pineId) {
    if (!pineId) {
      return Promise.reject('Cannot start a node without a Pine ID');
    }

    const existingNode = this.getNodeByPineId(pineId);

    if (existingNode) {
      clearTimeout(existingNode.shutdownTimer);

      return Promise.resolve().then(() => {
        if (existingNode.isReady()) {
          this._onNodeReady(pineId);
        }
      });
    }

    return getUnusedPort()
      .then(port => {
        const node = new LndNode(pineId, {
          ...this.config,
          server: this.serverConfig,
          rpcPort: port
        });

        node.once('exit', this._onExit.bind(this, pineId));
        this.nodes[pineId] = node;

        return node.start();
      })
      .then(() => {
        return this.nodes[pineId].getInfo();
      })
      .then(({ identityPubKey }) => {
        this.redis.set(`pine:lightning:node:${identityPubKey}:pine-id`, pineId);
        this.redis.set(`pine:lightning:user:${pineId}:identity-pubkey`, identityPubKey);
      })
      .then(() => {
        this._onNodeReady(pineId);
      })
      .catch(error => {
        this.stop(pineId);
        throw new Error(`Unable to spawn LND user node: ${error.message}`);
      });
  }

  stop(pineId) {
    if (!pineId) {
      return Promise.reject('Cannot stop a user LND node without a Pine ID');
    }

    const node = this.getNodeByPineId(pineId);

    if (!node) {
      return Promise.resolve();
    }

    return node.stop();
  }

  stopAll() {
    const promises = Object.keys(this.nodes).map(pineId => this.stop(pineId));
    return Promise.all(promises);
  }

  idle(pineId) {
    const { idleTimeout } = this.config;
    const node = this.getNodeByPineId(pineId);

    this.logger.info('Idling user LND node...', { pineId });

    if (!node) {
      this.logger.warn('Unable to idle user node: No node found', { pineId });
      return;
    }

    if (!node.isSyncing() && !node.isReady()) {
      return this.stop(pineId);
    }

    node.shutdownTimer = setTimeout(() => {
      if (node.isSyncing()) {
        this.logger.info(
          'Idle timeout reached but node is syncing so reset idle process until it is finished',
          { pineId }
        );

        return this.idle(pineId);
      }

      this.logger.info('Idle timeout reached, shutting down user LND node...', { pineId });
      this.stop(pineId);
    }, idleTimeout * 60000);
  }

  getNodeByPineId(pineId) {
    return this.nodes[pineId];
  }

  _onNodeReady(pineId) {
    this.emit('ready', { pineId });
  }

  _onExit(pineId) {
    const node = this.getNodeByPineId(pineId);

    if (node) {
      node.removeAllListeners();
      clearTimeout(node.shutdownTimer);
    }

    delete this.nodes[pineId];
  }
}
