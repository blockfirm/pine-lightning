/* eslint-disable camelcase, lines-around-comment */
import config from '../config';

// eslint-disable-next-line max-params
const saveChannelProperty = (redis, pineId, key, value) => {
  return redis.set(
    `pine:lightning:user:${pineId}:channel:${key}`, value
  );
};

const longToString = (long) => {
  return long ? long.toString() : '0';
};

/**
 * Gets the user's lightning balance.
 */
const getBalance = ({ lnd, pineId, redis }) => {
  let channelId;
  let capacity;
  let localBalance;
  let remoteBalance;
  let commitFee;

  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return lnd.lnrpc.listChannels({})
    .then(({ channels }) => {
      const gatewayChannel = channels && channels.find(channel => (
        channel.remote_pubkey === config.lnd.gateway.publicKey
      ));

      if (!gatewayChannel) {
        throw new Error('No open channels found');
      }

      channelId = longToString(gatewayChannel.chan_id);
      capacity = longToString(gatewayChannel.capacity);
      localBalance = longToString(gatewayChannel.local_balance);
      remoteBalance = longToString(gatewayChannel.remote_balance);
      commitFee = longToString(gatewayChannel.commit_fee);
    })
    .then(() => {
      /**
       * Cache channel balance in redis to be used by the
       * payment server for calculating inbound capacity.
       */
      return Promise.all([
        saveChannelProperty(redis, pineId, 'id', channelId),
        saveChannelProperty(redis, pineId, 'capacity', capacity),
        saveChannelProperty(redis, pineId, 'local-balance', localBalance),
        saveChannelProperty(redis, pineId, 'remote-balance', remoteBalance),
        saveChannelProperty(redis, pineId, 'commit-fee', commitFee)
      ]);
    })
    .then(() => ({
      // The total amount of funds in satoshis held in this channel.
      capacity,

      // The user's current balance in satoshis in this channel.
      local: localBalance,

      // The remote balance in satoshis in this channel.
      remote: remoteBalance,

      // The calculated fee in satoshis for the commitment transaction.
      commitFee
    }));
};

export default getBalance;
