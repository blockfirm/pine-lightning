import redis from 'redis';
import logger from '../logger';

const RECONNECT_DELAY = 2000;

export default class RedisClient {
  constructor(config) {
    this.config = config;
    this.logger = logger.child({ scope: 'RedisClient' });

    this._connect();
  }

  _connect() {
    const config = this.config;

    if (!config || !config.host) {
      return this.logger.error('Cannot connect to redis, missing configuration');
    }

    this.client = redis.createClient(
      config.port,
      config.host,
      {
        // eslint-disable-next-line camelcase
        retry_strategy: () => RECONNECT_DELAY // Try to reconnect after 2 seconds.
      }
    );

    this.client.on('connect', () => {
      this.logger.info(`Connected to redis at ${config.host}:${config.port}`);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn(`Reconnecting to redis...`);
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      });
    });
  }

  set(key, value) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      });
    });
  }

  del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      });
    });
  }

  incr(key) {
    return new Promise((resolve, reject) => {
      this.client.incr(key, (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      });
    });
  }
}
