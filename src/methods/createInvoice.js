/* eslint-disable camelcase */

/**
 * Creates a Lightning invoice for the user's lnd node.
 *
 * NOTE: This should only be used internally when redeeming
 * payments through the gateway node.
 */
const createInvoice = ({ request, lnd }) => {
  if (!lnd) {
    return Promise.reject(new Error('Missing lnd node'));
  }

  return lnd.lnrpc.addInvoice({ value: request.amount }).then(invoice => {
    return {
      paymentRequest: invoice.payment_request
    };
  });
};

export default createInvoice;
