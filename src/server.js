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

//methods.signMessage({ request: { publicKey: Buffer.from('043773cd2f530006e75e7faabc43ff4f9f739a045445e1fd4790b8994e2d8cdf3242d882f802dad82b6be34f2bff118b208320299e82d1f279a3fea1fe7dd6d507', 'hex') } }, () => {});

methods.listUnspentWitness({ request: { minConfirmations: 1, maxConfirmations: -1 } }, (error, response) => {
  if (error) {
    return console.error(error.message);
  }

  console.log(JSON.stringify(response.utxos[0]));
});
