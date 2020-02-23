/* eslint-disable camelcase */
import config from '../config';

/**
 * Closes the user's gateway channel.
 */
const closeChannel = ({ lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return lnd.lnrpc.listChannels({})
    .then(({ channels }) => {
      const gatewayChannel = channels && channels.find(channel => {
        return channel.remote_pubkey === config.lnd.gateway.publicKey;
      });

      if (!gatewayChannel) {
        return Promise.reject(new Error('No open channels found'));
      }

      const [txid, outputIndex] = gatewayChannel.channel_point.split(':');

      return lnd.lnrpc.closeChannel({
        channel_point: {
          funding_txid_str: txid,
          output_index: Number(outputIndex)
        }
      });
    })
    .then(() => {
      return {};
    });
};

export default closeChannel;
