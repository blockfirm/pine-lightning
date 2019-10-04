import net from 'net';
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

export default class LndNodeManager {
  constructor(config, serverConfig) {
    this.config = config;
    this.serverConfig = serverConfig;
    this.nodes = {};
  }

  spawn(pineId) {
    if (!pineId) {
      return Promise.reject('Cannot start a node without a Pine ID');
    }

    if (this.nodes[pineId]) {
      clearTimeout(this.nodes[pineId].shutdownTimer);
      return Promise.resolve();
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
      .catch(error => {
        this.stop(pineId);
        throw new Error(`Unable to spawn lnd node: ${error.message}`);
      });
  }

  stop(pineId) {
    if (!pineId) {
      return Promise.reject('Cannot stop a node without a Pine ID');
    }

    const node = this.nodes[pineId];

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
    const node = this.nodes[pineId];

    if (!node) {
      return;
    }

    if (!node.isReady()) {
      return this.stop(pineId);
    }

    node.shutdownTimer = setTimeout(() => {
      this.stop(pineId);
    }, idleTimeout * 60000);
  }

  _onExit(pineId) {
    const node = this.nodes[pineId];

    if (node) {
      node.removeAllListeners();
      clearTimeout(node.shutdownTimer);
    }

    delete this.nodes[pineId];
  }
}
