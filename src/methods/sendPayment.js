/* eslint-disable camelcase, lines-around-comment */

/**
 * Pay a Lightning network invoice using user's lnd node.
 */
const sendPayment = ({ request, lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  const payment = {
    payment_request: request.paymentRequest
  };

  return lnd.lnrpc.sendPaymentSync(payment).then(response => {
    if (response.payment_error) {
      throw new Error(`Payment error: ${response.payment_error}`);
    }

    return {
      paymentHash: response.payment_hash.toString('hex')
    };
  });
};

export default sendPayment;
