const chokidar = require('chokidar');
const debounce = require('debounce');
const { spawn } = require('child_process');

const BELL = '\x07';
const PINE_DIR = '/home/timothy/pine-lightning';

const watchOptions = {
  ignoreInitial: true
};

let process = null;

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

const start = () => {
  console.log('Starting Pine Lightning...');

  const args = ['run', 'dev'];

  return run('npm', args, PINE_DIR, (child) => {
    process = child;
  }).catch(onError);
};

const onFileChanged = () => {
  if (process) {
    process.kill();
    process = null;
  }

  setTimeout(start, 1000);
};

const eventHandler = debounce(onFileChanged, 1000);

chokidar.watch(`${PINE_DIR}/src/**/*.js`, watchOptions)
  .on('add', eventHandler)
  .on('change', eventHandler)
  .on('unlink', eventHandler);

start();
