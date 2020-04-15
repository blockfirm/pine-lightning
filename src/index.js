import config from './config';
import Proxy from './Proxy';
import logger from './logger';

const proxy = new Proxy(config);

proxy.start();

const onExit = () => {
  logger.info('Gracefully shutting down...');

  proxy.stop()
    .then(() => {
      logger.info('Graceful shutdown completed');
      return 0;
    })
    .catch(error => {
      logger.error(`Graceful shutdown failed with error: ${error.message}`);
      return 1;
    })
    .then(code => {
      process.kill(code);
    });
};

process.stdin.resume();
process.on('SIGINT', onExit);
