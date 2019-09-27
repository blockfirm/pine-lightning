import events from 'events';
import grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';

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

export default class NodeServer {
  constructor(config) {
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

    this.eventEmitter = new events.EventEmitter();
    this.server = server;
    this.config = config;
  }

  start() {
    const { host, port } = this.config;
    this.server.start();
    console.log(`[NODE] Server listening at ${host}:${port}`);
  }

  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }

  _handleCall(methodName, call, callback) {
    const { request } = call;
    const pineId = call.metadata.get('pine-id')[0];

    if (!pineId) {
      return callback(new Error('RPC call is missing Pine ID'));
    }

    this.eventEmitter.emit('request', {
      pineId,
      methodName,
      request,
      callback
    });
  }
}
