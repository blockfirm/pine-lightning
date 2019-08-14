const { spawn } = require('child_process');
const chokidar = require('chokidar');
const debounce = require('debounce');
const createLnrpc = require('lnrpc');

const LND_DIR = '/home/timothy/go/src/github.com/lightningnetwork/lnd';
const MACAROON_PATH = '/home/timothy/go/dev/alice/data/chain/bitcoin/simnet/admin.macaroon';

const BELL = '\x07';

const watchOptions = {
  ignoreInitial: true
};

let lndProcess = null;

const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const onError = (error) => {
  console.error(`${BELL}[lnd watcher] Error: ${error}`);
};

// eslint-disable-next-line max-params
const run = (cmd, args, cwd, setChild) => {
  const child = spawn(cmd, args, { cwd });

  child.stdout.setEncoding('utf8');

  child.stdout.on('data', (chunk) => {
    console.log(chunk);
  });

  if (setChild) {
    setChild(child);
  }

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        return resolve();
      }

      reject();
    });
  });
};

const make = () => {
  return run('make', [], LND_DIR);
};

const makeInstall = () => {
  return run('make', ['install'], LND_DIR);
};

const startLnd = () => {
  console.log('Starting LND...');

  const args = [
    '--rpclisten=localhost:10001',
    '--listen=localhost:10011',
    '--restlisten=localhost:8001',
    '--datadir=data',
    '--logdir=log',
    '--debuglevel=info'
  ];

  const cwd = '/home/timothy/go/dev/alice';

  return run('lnd', args, cwd, (child) => {
    lndProcess = child;
  });
};

const stopLnd = () => {
  if (lndProcess) {
    lndProcess.kill();
    lndProcess = null;
  }
};

const unlock = async () => {
  console.log('Unlocking wallet...');
  const lnrpc = await createLnrpc({ macaroonPath: MACAROON_PATH });
  return lnrpc.unlockWallet({ wallet_password: Buffer.from('timothy123') });
};

const connect = async () => {
  console.log('Connecting to jabberwork...');
  const lnrpc = await createLnrpc({ macaroonPath: MACAROON_PATH });

  return lnrpc.connectPeer({
    addr: {
      pubkey: '03a2e519c18af595810be478fa65ea4832ccc1e174d19386849860c5a9013e73d8',
      host: 'localhost:10012'
    }
  });
};

const start = () => {
  startLnd().catch(onError);

  return wait(2000)
    .then(unlock)
    .then(connect);
};

const onFileChanged = () => {
  if (lndProcess) {
    lndProcess.kill();
    lndProcess = null;
  }

  make()
    .then(makeInstall)
    .then(start)
    .catch((error) => {
      stopLnd();
      onError(error);
    });
};

const eventHandler = debounce(onFileChanged, 1000);

chokidar.watch(`${LND_DIR}/**/*.go`, watchOptions)
  .on('add', eventHandler)
  .on('change', eventHandler)
  .on('unlink', eventHandler);

start();
