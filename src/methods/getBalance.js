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
 * Gets the user's lightning balance.
 */
const getBalance = ({ lnd, pineId, redis }) => {
  let pending;
  let channelId;
  let capacity;
  let localBalance;
  let remoteBalance;
  let commitFee;

  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return getGatewayChannel(lnd)
    .then(gatewayChannel => {
      if (!gatewayChannel) {
        return false;
      }

      pending = false;
      channelId = longToString(gatewayChannel.chan_id);
      capacity = longToString(gatewayChannel.capacity);
      localBalance = longToString(gatewayChannel.local_balance);
      remoteBalance = longToString(gatewayChannel.remote_balance);
      commitFee = longToString(gatewayChannel.commit_fee);

      return true;
    })
    .then(hasGatewayChannel => {
      if (hasGatewayChannel) {
        return;
      }

      return getPendingGatewayChannel(lnd).then(pendingGatewayChannel => {
        if (!pendingGatewayChannel) {
          throw new Error('No open channels');
        }

        pending = true;
        channelId = -1;
        capacity = longToString(pendingGatewayChannel.channel.capacity);
        localBalance = longToString(pendingGatewayChannel.channel.local_balance);
        remoteBalance = longToString(pendingGatewayChannel.channel.remote_balance);
        commitFee = longToString(pendingGatewayChannel.commit_fee);
      });
    })
    .then(() => {
      /**
       * Cache channel balance in redis to be used by the
       * payment server for calculating inbound capacity.
       */
      return Promise.all([
        saveChannelProperty(redis, pineId, 'pending', pending),
        saveChannelProperty(redis, pineId, 'id', channelId),
        saveChannelProperty(redis, pineId, 'capacity', capacity),
        saveChannelProperty(redis, pineId, 'local-balance', localBalance),
        saveChannelProperty(redis, pineId, 'remote-balance', remoteBalance),
        saveChannelProperty(redis, pineId, 'commit-fee', commitFee)
      ]);
    })
    .then(() => ({
      // Whether the channel is pending or not.
      pending,

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
