/* eslint-disable camelcase */
import * as bolt11 from 'bolt11';

/**
 * Estimates the fee for paying a lightning payment request.
 */
const estimateFee = ({ request, lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  const { paymentRequest } = request;
  const decodedPaymentRequest = bolt11.decode(paymentRequest);
  const { satoshis, millisatoshis, payeeNodeKey } = decodedPaymentRequest;

  const query = {
    pub_key: payeeNodeKey,
    amt: satoshis.toString(),
    amt_msat: millisatoshis
  };

  return lnd.lnrpc.queryRoutes(query).then(({ routes }) => {
    if (!routes || !routes.length) {
      return Promise.reject(new Error('Unable to find a payment route'));
    }

    const fees = routes.map(route => {
      return BigInt(route.total_fees);
    });

    fees.sort();

    return {
      low: fees[0].toString(),
      high: fees[fees.length - 1].toString()
    };
  });
};

export default estimateFee;
