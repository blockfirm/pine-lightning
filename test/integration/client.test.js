import assert from 'assert';
import { spawn } from 'child_process';
import createLnrpc from 'lnrpc';

import proxyConfig from '../../src/config';
import Proxy from '../../src/Proxy';
import clientConfig from '../mocks/client/config';
import Client from '../mocks/client/Client';

const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const runCmd = (cmd, args) => {
  const child = spawn(cmd, args);

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        return resolve();
      }

      reject();
    });
  });
};

const generateBlocks = (numberOfBlocks) => {
  const args = [
    '--simnet',
    '--rpcuser=LHb574e7pzDNhUIsTaJguQAw7iA',
    '--rpcpass=UZgaYSJwBgao2HCh+ywKNhBPOJA',
    'generate',
    numberOfBlocks
  ];

  return runCmd('btcctl', args);
};

const getLndGatewayRpcClient = () => {
  const { adminMacaroon, rpcHost } = clientConfig.lndGateway;

  return createLnrpc({
    macaroonPath: adminMacaroon,
    server: rpcHost
  });
};

describe('integration between Pine lnd and client', () => {
  let proxy;
  let client;

  before(() => {
    return generateBlocks(10).then(() => {
      // Start Pine Lightning proxy.
      proxy = new Proxy(proxyConfig);
      proxy.start();

      // Start client mock.
      client = new Client(clientConfig);
    });
  });

  after(() => {
    return wait(1500)
      .then(() => client.disconnect())
      .then(() => wait(3000))
      .then(() => proxy.stop());
  });

  afterEach(() => {
    client.removeAllListeners();
  });

  it('can connect successfully', () => {
    const errors = [];
    let isReady = false;

    client.on('error', error => errors.push(error));

    client.on('ready', () => {
      isReady = true;
    });

    return client.connect()
      .then(() => wait(5000))
      .then(() => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(isReady, 'Ready event was never received');
        }
      })
      .catch(error => {
        assert(false, `Unable to connect to Pine Lightning: ${error.message}`);
      });
  });

  it('can disconnect and reconnect successfully', () => {
    const errors = [];
    let isReady = false;

    client.on('error', error => errors.push(error));

    client.on('ready', () => {
      isReady = true;
    });

    client.disconnect();

    return wait(3000)
      .then(() => client.connect())
      .then(() => wait(5000))
      .then(() => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(isReady, 'Ready event was never received');
        }
      })
      .catch(error => {
        assert(false, `Unable to reconnect to Pine Lightning: ${error.message}`);
      });
  });

  it('can open channel', () => {
    const sats = '35000';
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.openChannel(sats)
      .then(() => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(true);
        }
      })
      .catch(error => {
        assert(false, `Unable to open channel: ${error.message}`);
      });
  });

  it('can get pending channel balance', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.getBalance()
      .then(balance => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(balance.pending, 'Returned balance is not pending');
          assert(balance.capacity === '35000', 'Returned incorrect capacity');
          assert(balance.local === '25950', 'Returned incorrect local balance');
          assert(balance.remote === '0', 'Returned incorrect remote balance');
          assert(balance.commitFee === '9050', 'Returned incorrect commit fee');
        }
      })
      .catch(error => {
        assert(false, `Unable to get pending channel balance: ${error.message}`);
      });
  });

  it('cannot open another pending channel', () => {
    const sats = '45000';
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.openChannel(sats)
      .then(() => {
        assert(false, 'Client managed to open two pending channels');
      })
      .catch(error => {
        if (!error.message.includes('channel is already pending')) {
          assert(false, `Error when opening second pending channel: ${error.message}`);
        }
      });
  });

  it('cannot open another channel', () => {
    const sats = '45000';
    const errors = [];

    client.on('error', error => errors.push(error));

    return generateBlocks(10).then(() => wait(1500))
      .then(() => {
        return client.openChannel(sats);
      })
      .then(() => {
        assert(false, 'Client managed to open two channels');
      })
      .catch(error => {
        if (!error.message.includes('channel has already been opened')) {
          assert(false, `Error when opening second channel: ${error.message}`);
        }
      });
  });

  it('can get channel balance', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return generateBlocks(10).then(() => wait(1500))
      .then(() => {
        return client.getBalance();
      })
      .then(balance => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(!balance.pending, 'Returned balance is pending');
          assert(balance.capacity === '35000', 'Returned incorrect capacity');
          assert(balance.local === '25950', 'Returned incorrect local balance');
          assert(balance.remote === '0', 'Returned incorrect remote balance');
          assert(balance.commitFee === '9050', 'Returned incorrect commit fee');
        }
      })
      .catch(error => {
        assert(false, `Unable to get channel balance: ${error.message}`);
      });
  });

  it('can send a payment', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return getLndGatewayRpcClient()
      .then(lnrpc => {
        return lnrpc.addInvoice({ value: 200 });
      })
      .then(invoice => {
        return client.sendPayment(invoice.payment_request);
      })
      .then(paymentResult => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(paymentResult.paymentHash, 'Missing payment hash');
        }
      })
      .catch(error => {
        assert(false, `Unable to send payment: ${error.message}`);
      });
  });

  it('can create a new invoice', () => {
    const amount = 300;
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.createInvoice(amount)
      .then(invoice => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(invoice, 'No invoice returned');
          assert(invoice.paymentRequest, 'Invoice is missing payment request');
        }
      })
      .catch(error => {
        assert(false, `Unable to get channel balance: ${error.message}`);
      });
  });

  it('can close channel', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.closeChannel()
      .then(() => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(true);
        }
      })
      .catch(error => {
        assert(false, `Unable to close channel: ${error.message}`);
      })
      .then(() => {
        return generateBlocks(10).then(() => wait(1500));
      });
  });

  it('can open an inbound channel', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.openInboundChannel()
      .then(channel => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(channel.fundingTxid, 'Funding txid is missing from response');
        }
      })
      .catch(error => {
        assert(false, `Unable to open inbound channel: ${error.message}`);
      });
  });

  it('can get pending inbound channel balance', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return client.getBalance()
      .then(balance => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(balance.pending, 'Returned balance is not pending');
          assert(balance.capacity === '40000', 'Returned incorrect capacity');
          assert(balance.local === '1000', 'Returned incorrect local balance');
          assert(balance.remote === '29950', 'Returned incorrect remote balance');
          assert(balance.commitFee === '9050', 'Returned incorrect commit fee');
        }
      })
      .catch(error => {
        assert(false, `Unable to get pending inbound channel balance: ${error.message}`);
      });
  });

  it('can close inbound channel', () => {
    const errors = [];

    client.on('error', error => errors.push(error));

    return generateBlocks(10).then(() => wait(1500))
      .then(() => {
        return client.closeChannel();
      })
      .then(() => {
        if (errors.length) {
          assert(false, errors[0].message);
        } else {
          assert(true);
        }
      })
      .catch(error => {
        assert(false, `Unable to close inbound channel: ${error.message}`);
      })
      .then(() => {
        return generateBlocks(10).then(() => wait(1500));
      });
  });
});
