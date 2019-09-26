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
  constructor(config) {
    this.config = config;
  }

  spawn() {
    return getUnusedPort().then(port => {
      const node = new LndNode({
        ...this.config,
        rpcPort: port
      });

      return node.start().then(() => node);
    });
  }
}
