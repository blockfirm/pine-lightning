/* eslint-disable camelcase */
import config from '../config';

/**
 * Opens a channel from the user's node to Pine's gateway node.
 */
const openChannel = ({ request, lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return lnd.lnrpc.listChannels({}).then(({ channels }) => {
    const gatewayChannel = channels && channels.find(channel => {
      return channel.remote_pubkey === config.lnd.gateway.publicKey;
    });

    if (gatewayChannel) {
      return Promise.reject(new Error('A channel has already been opened'));
    }

    return lnd.lnrpc.openChannelSync({
      node_pubkey_string: config.lnd.gateway.publicKey,
      local_funding_amount: request.sats,
      sat_per_byte: request.satsPerByte,
      private: true
    });
  });
};

export default openChannel;
