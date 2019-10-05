/* eslint-disable camelcase */
const openChannel = ({ request, lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return lnd.lnrpc.openChannelSync({
    node_pubkey_string: request.pubkey,
    local_funding_amount: 20000,
    private: true
  });
};

export default openChannel;
