import config from './config';
import Proxy from './Proxy';

const proxy = new Proxy(config);

proxy.start();
