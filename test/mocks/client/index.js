import config from './config';
import Client from './Client';

const client = new Client(config);

client.connect().catch(error => {
  console.error('[MOCK] Unable to connect to Pine Lightning:', error.message);
});

const onExit = () => {
  console.log('Gracefully shutting down...');
  client.disconnect();
  console.log('Graceful shutdown completed');
  process.kill(0);
};

process.stdin.resume();
process.on('SIGINT', onExit);

export default client;
