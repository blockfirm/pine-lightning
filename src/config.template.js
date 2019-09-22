const config = {
  servers: {
    client: {
      proto: 'protos/client.proto',
      host: '0.0.0.0',
      port: 8911
    },
    node: {
      proto: 'protos/node.proto',
      host: '0.0.0.0',
      port: 8910
    }
  }
};

export default config;
