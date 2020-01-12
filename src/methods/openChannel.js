/* eslint-disable camelcase */
import config from '../config';

const getGatewayChannel = (lnd) => {
  return lnd.lnrpc.listChannels({}).then(({ channels }) => {
    return channels && channels.find(channel => (
      channel.remote_pubkey === config.lnd.gateway.publicKey
    ));
  });
};

const getPendingGatewayChannel = (lnd) => {
  return lnd.lnrpc.pendingChannels({}).then(({ pending_open_channels }) => {
    if (!pending_open_channels) {
      return;
    }

    return pending_open_channels.find(pendingChannel => (
      pendingChannel.channel.remote_node_pub === config.lnd.gateway.publicKey
    ));
  });
};

/**
 * Opens a channel from the user's node to Pine's gateway node.
 */
const openChannel = ({ request, lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return getGatewayChannel(lnd)
    .then(gatewayChannel => {
      if (gatewayChannel) {
        return Promise.reject(new Error('A channel has already been opened'));
      }
    })
    .then(() => {
      return getPendingGatewayChannel(lnd).then(pendingGatewayChannel => {
        if (pendingGatewayChannel) {
          return Promise.reject(new Error('A channel is already pending'));
        }
      });
    })
    .then(() => {
      return lnd.lnrpc.openChannelSync({
        node_pubkey_string: config.lnd.gateway.publicKey,
        local_funding_amount: request.sats,
        sat_per_byte: request.satsPerByte,
        private: true
      });
    });
};

export default openChannel;
