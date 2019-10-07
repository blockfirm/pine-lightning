/* eslint-disable camelcase */
import config from '../config';

/**
 * Closes the user's channel to Pine's Lightning node.
 */
const closeChannel = ({ lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return lnd.lnrpc.listChannels({}).then(({ channels }) => {
    const pineChannel = channels.find(channel => {
      return channel.remote_pubkey === config.lnd.pineHub.publicKey;
    });

    if (!pineChannel) {
      return Promise.reject(new Error('No open channels found'));
    }

    const [txid, outputIndex] = pineChannel.channel_point.split(':');

    return lnd.lnrpc.closeChannel({
      channel_point: {
        funding_txid_str: txid,
        output_index: Number(outputIndex)
      }
    });
  });
};

export default closeChannel;
