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

    return getUnusedPort().then(port => {
      const node = new LndNode(pineId, {
        ...this.config,
        server: this.serverConfig,
        rpcPort: port
      });

      this.nodes[pineId] = node;
      return node.start();
    });
  }

  stop(pineId) {
    if (!pineId) {
      return Promise.reject('Cannot stop a node without a Pine ID');
    }

    const node = this.nodes[pineId];

    if (!node) {
      return Promise.reject('No node was found with that Pine ID');
    }

    return node.stop();
  }
}
