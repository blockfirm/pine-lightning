/* eslint-disable camelcase */
import createLnrpc from 'lnrpc';
import logger from '../logger';

const getTxIdFromHash = (hash) => {
  return hash.toString('hex').match(/../g).reverse().join('');
};

export default class LndGateway {
  constructor(config) {
    this.config = config;
    this.logger = logger.child({ scope: 'LndGateway' });

    this._tryConnect();
  }

  _tryConnect() {
    this._connect().catch(error => {
      this.logger.error(`Unable to connect to gateway LND node: ${error.message}`);
    });
  }

  _connect() {
    const { config } = this;

    if (!config || !config.rpc || !config.rpc.host) {
      return Promise.reject(new Error('Missing configuration'));
    }

    const { host, adminMacaroon } = config.rpc;

    const options = {
      server: host,
      macaroonPath: adminMacaroon
    };

    return createLnrpc(options).then(lnrpc => {
      this.rpc = lnrpc;
      this.logger.info(`Connected to gateway LND node at ${host}`);
    });
  }

  openChannel(amountSats, pushSats, nodePubKey) {
    if (!this.rpc) {
      return Promise.reject(new Error('Not connected to gateway node'));
    }

    const options = {
      node_pubkey_string: nodePubKey,
      local_funding_amount: amountSats,
      push_sat: pushSats,
      private: true
    };

    return this.rpc.openChannelSync(options).then(channel => ({
      fundingTxid: getTxIdFromHash(channel.funding_txid_bytes)
    }));
  }
}
