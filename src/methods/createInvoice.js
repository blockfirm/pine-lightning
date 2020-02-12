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

  const invoiceOptions = {
    value: request.amount,
    private: true // Include routing hints for private channels.
  };

  return lnd.lnrpc.addInvoice(invoiceOptions).then(invoice => ({
    paymentRequest: invoice.payment_request
  }));
};

export default createInvoice;
