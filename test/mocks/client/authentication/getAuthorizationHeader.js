import { sign } from '../crypto';

/**
 * Creates an HTTP Authorization header with user credentials
 * consisting of a user ID and a signature of the request using
 * the user's mnemonic.
 *
 * @param {string} userId - User ID of the user making the request.
 * @param {string} data - The request data as it will be sent, e.g. as JSON.
 * @param {object} keyPair - A bitcoinjs key pair to sign the request with.
 *
 * @returns {string} An HTTP Authorization header with user credentials.
 */
const getAuthorizationHeader = (userId, data, keyPair) => {
  const signature = sign(data, keyPair);
  const credentials = Buffer.from(`${userId}:${signature}`).toString('base64');

  return `Basic ${credentials}`;
};

export default getAuthorizationHeader;
