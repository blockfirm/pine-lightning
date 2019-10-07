/* eslint-disable camelcase, lines-around-comment */
import config from '../config';

/**
 * Gets the user's lightning channel balance.
 */
const getBalance = ({ lnd }) => {
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

    return {
      // The user's current balance in satoshis in this channel.
      local: pineChannel.local_balance.toString(),

      // The total amount of funds in satoshis held in this channel.
      capacity: pineChannel.capacity.toString()
    };
  });
};

export default getBalance;
