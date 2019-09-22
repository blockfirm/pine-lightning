import config from './config';
import Client from './client';

const client = new Client(config.bridge);

client.connect();

export default client;
