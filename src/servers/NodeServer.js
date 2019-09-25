import grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';

const getMethodsFromService = (service, handler) => {
  const methods = {};

  Object.values(service).forEach(method => {
    const name = method.originalName;
    methods[name] = () => handler(name, ...arguments);
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

    this.server = server;
    this.config = config;
  }

  start() {
    const { host, port } = this.config;
    this.server.start();
    console.log(`[NODE] Server listening at ${host}:${port}`);
  }

  onRequest(callback) {
    this._onRequest = callback;
  }

  _handleCall(methodName, call, callback) {
    const { request } = call;

    if (this._onRequest) {
      this._onRequest(methodName, request, callback);
    }
  }
}
