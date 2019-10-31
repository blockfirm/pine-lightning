/* eslint-disable camelcase, lines-around-comment */
import config from '../config';

// eslint-disable-next-line max-params
const saveChannelProperty = (redis, pineId, key, value) => {
  return redis.set(
    `pine:lightning:user:${pineId}:channel:${key}`, value
  );
};

/**
 * Gets the user's lightning balance.
 */
const getBalance = ({ lnd, pineId, redis }) => {
  let channelId;
  let localBalance;
  let capacity;

  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return lnd.lnrpc.listChannels({})
    .then(({ channels }) => {
      const gatewayChannel = channels && channels.find(channel => {
        return channel.remote_pubkey === config.lnd.gateway.publicKey;
      });

      if (!gatewayChannel) {
        throw new Error('No open channels found');
      }

      channelId = gatewayChannel.chan_id.toString();
      localBalance = gatewayChannel.local_balance.toString();
      capacity = gatewayChannel.capacity.toString();
    })
    .then(() => {
      /**
       * Cache channel balance in redis to be used by the
       * payment server for calculating inbound capacity.
       */
      return Promise.all([
        saveChannelProperty(redis, pineId, 'id', channelId),
        saveChannelProperty(redis, pineId, 'local-balance', localBalance),
        saveChannelProperty(redis, pineId, 'capacity', capacity)
      ]);
    })
    .then(() => ({
      // The user's current balance in satoshis in this channel.
      local: localBalance,

      // The total amount of funds in satoshis held in this channel.
      capacity
    }));
};

export default getBalance;
