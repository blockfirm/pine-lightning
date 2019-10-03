import config from './config';
import Proxy from './Proxy';

const proxy = new Proxy(config);

proxy.start();

const onExit = () => {
  console.log('Gracefully shutting down...');

  proxy.stop()
    .then(() => {
      console.log('Graceful shutdown completed');
      return 0;
    })
    .catch(error => {
      console.log('Graceful shutdown failed with error:', error.message);
      return 1;
    })
    .then(code => {
      process.kill(code);
    });
};

process.stdin.resume();
process.on('SIGINT', onExit);
