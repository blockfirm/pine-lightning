import fs from 'fs';
import grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';

const RPC_HOST = 'localhost:18554';
const RPC_PROTO = '/home/timothy/go/src/github.com/btcsuite/btcwallet/rpc/api.proto';
const RPC_CERT = fs.readFileSync('/home/timothy/.btcwallet/rpc.cert');

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
const sslCreds = grpc.credentials.createSsl(RPC_CERT);
const insecureCreds = grpc.credentials.createInsecure();

const wallet = new walletrpc.WalletService(RPC_HOST, insecureCreds);
const walletLoader = new walletrpc.WalletLoaderService(RPC_HOST, insecureCreds);

/*wallet.nextAddress({ account: 0, kind: 0 }, (error, response) => {
  if (error) {
    return console.error(`Error when getting address: ${error.message}`);
  }

  console.log(`Address: ${response.address}`);
});*/

wallet.balance({ account_number: 0, required_confirmations: 0 }, (error, response) => {
  if (error) {
    return console.error(`Error when getting balance: ${error.message}`);
  }

  console.log(`Wallet Balance: ${response.total}`);
});

export default {
  wallet,
  walletLoader
};
