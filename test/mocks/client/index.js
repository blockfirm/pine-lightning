import config from './config';
import Client from './Client';

const client = new Client(config);

client.connect().catch(error => {
  console.error('[MOCK] Unable to connect to Pine Lightning:', error.message);
});

export default client;
