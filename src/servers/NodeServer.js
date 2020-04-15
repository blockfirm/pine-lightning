import events from 'events';
import grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';
import logger from '../logger';

const getMethodsFromService = (service, handler) => {
  const methods = {};

  Object.values(service).forEach(method => {
    const name = method.originalName;

    methods[name] = function () {
      handler(name, ...arguments);
    };
  });

  return methods;
};

export default class NodeServer extends events.EventEmitter {
  constructor(config) {
    super();

    const { proto, host, port } = config;

    const packageDefinition = protoLoader.loadSync(
      proto, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      }
    );

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const { Pine } = protoDescriptor;
    const server = new grpc.Server();

    const methods = getMethodsFromService(
      Pine.service,
      this._handleCall.bind(this)
    );

    server.addService(Pine.service, methods);
    server.bind(`${host}:${port}`, grpc.ServerCredentials.createInsecure());

    this.server = server;
    this.config = config;
    this.logger = logger.child({ scope: 'NodeServer' });
  }

  start() {
    const { host, port } = this.config;
    this.server.start();
    this.logger.info(`Node server is listening at ${host}:${port}`);
  }

  stop() {
    this.server.forceShutdown();
    this.logger.info('Node server was stopped');
  }

  _handleCall(methodName, call, callback) {
    const { request } = call;
    const pineId = call.metadata.get('pine-id')[0];

    if (!pineId) {
      return callback(new Error('RPC call is missing Pine ID'));
    }

    this.emit('request', {
      pineId,
      methodName,
      request,
      callback
    });
  }
}
