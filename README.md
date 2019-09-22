Pine Lightning
==============

A bridge between a [customized version of lnd](https://github.com/timothyej/lnd) and the [Pine](https://pine.pm) app for signing transactions using keys owned by the user residing on the user's device.

## Table of Contents

* [Dependencies](#dependencies)
* [Getting started](#getting-started)
* [API](#api)
  * [Documentation](#documentation)
  * [Regenerate client](#regenerate-client)
* [Contributing](#contributing)
* [Licensing](#licensing)

## Dependencies

* [Node.js](https://nodejs.org) (`v12`) and [gRPC](https://grpc.io) for creating the RPC API
* [Pine lnd](https://github.com/timothyej/lnd) as lightning node without private keys
* [btcwallet](https://github.com/btcsuite/btcwallet) and [btcd](https://github.com/btcsuite/btcd) for mocking a wallet during development

## Getting started

1. Install [btcd](https://github.com/btcsuite/btcd), [btcwallet](https://github.com/btcsuite/btcwallet), and [Pine lnd](https://github.com/timothyej/lnd)
2. Start the btcd node, btcwallet, and Pine lnd node
3. Clone this repo:
    ```
    $ git clone https://github.com/blockfirm/pine-lightning.git
    $ cd pine-lightning
    ```
4. Install dependencies:
    ```
    $ npm install
    ```
5. Rename `src/config.template.js` to `src/config.js`
6. Open `src/config.js` and enter all settings and credentials for your nodes

7. Start the server in development mode:
    ```
    $ npm run dev
    ```
8. Or build it and run in production mode:
    ```
    $ npm run build
    $ npm start
    ```

## API

The API is a [gRPC](https://grpc.io) server that the customized lnd node is consuming in order
to interact with the user's wallet to sign transactions and messages.

### Documentation

For documentation of the API, please refer to the [rpc.proto](src/rpc.proto) file.

### Regenerate client

To regenerate the go client used by the Pine lnd node, go to `scripts/` and run
`sh regenerate-proto.sh`.

## Contributing

Want to help us making Pine better? Great, but first read the
[CONTRIBUTING.md](CONTRIBUTING.md) file for instructions.

## Licensing

Pine is licensed under the Apache License, Version 2.0.
See [LICENSE](LICENSE) for full license text.
