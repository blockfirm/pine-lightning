import grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';

const RPC_HOST = 'localhost:18554';
const RPC_PROTO = '/home/timothy/go/src/github.com/btcsuite/btcwallet/rpc/api.proto';

const packageDefinition = protoLoader.loadSync(
  RPC_PROTO, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const walletrpc = protoDescriptor.walletrpc;
const insecureCreds = grpc.credentials.createInsecure();

const wallet = new walletrpc.WalletService(RPC_HOST, insecureCreds);
const walletLoader = new walletrpc.WalletLoaderService(RPC_HOST, insecureCreds);

export default {
  wallet,
  walletLoader
};
