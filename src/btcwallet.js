import grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';
import config from './config';

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';

const RPC_HOST = config.btcwallet.host;
const RPC_PROTO = config.btcwallet.protoPath;

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
