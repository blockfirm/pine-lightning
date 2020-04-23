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
 * Opens an inbound channel from Pine's gateway node
 * to the user's lnd node. The gateway node will commit
 * the funds rather than the user.
 */
const openInboundChannel = ({ lnd, gateway }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  const { fundingAmountSats, pushAmountSats } = config.lnd.gateway.channel;

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
    .then(() => lnd.lnrpc.getInfo({}))
    .then(({ identity_pubkey }) => {
      return gateway.openChannel(
        fundingAmountSats,
        pushAmountSats,
        identity_pubkey
      );
    });
};

export default openInboundChannel;
