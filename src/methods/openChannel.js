/* eslint-disable camelcase */
import config from '../config';

/**
 * Opens a channel from the user's node to Pine's Lightning node.
 */
const openChannel = ({ request, lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return lnd.lnrpc.openChannelSync({
    node_pubkey_string: config.lnd.pineHub.publicKey,
    local_funding_amount: request.sats,
    private: true
  });
};

export default openChannel;
