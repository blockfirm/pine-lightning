import grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';

import config from './config';
import methods from './methods';

const packageDefinition = protoLoader.loadSync(
  config.rpc.proto, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const Pine = protoDescriptor.Pine;

const getPineServer = () => {
  const server = new grpc.Server();
  server.addService(Pine.service, methods);
  return server;
};

const pineServer = getPineServer();

pineServer.bind(`0.0.0.0:${config.rpc.port}`, grpc.ServerCredentials.createInsecure());
pineServer.start();
