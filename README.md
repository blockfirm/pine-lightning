Pine Lightning
==============

A bridge between a [customized version of lnd](https://github.com/timothyej/lnd) and the [Pine](https://pine.pm) app for signing transactions using keys owned by the user residing on the user's device.

## Table of Contents

* [Dependencies](#dependencies)
* [Getting started](#getting-started)
* [Generate TLS certs](#generate-tls-certs)
* [API](#api)
  * [Documentation](#documentation)
  * [Regenerate client](#regenerate-client)
* [Testing](#testing)
  * [Unit tests](#unit-tests)
  * [Integration tests](#integration-tests)
  * [Mocking](#mocking)
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

## Generate TLS certs

The communication with the Pine app is encrypted using TLS.
Before running the server for the first time you need to
generate a private key and a certificate:

```
$ mkdir certs
$ openssl genrsa -out key.pem 2048
$ openssl req -new -key key.pem -out cert.csr
$ openssl x509 -req -in cert.csr -signkey key.pem -out cert.pem
```

Then copy the `cert.pem` file to the client.

## API

The API is a [gRPC](https://grpc.io) server that the customized lnd node is consuming in order
to interact with the user's wallet to sign transactions and messages.

### Documentation

For documentation of the API, please refer to the [rpc.proto](src/protos/rpc.proto) file.

### Regenerate client

To regenerate the go client used by the Pine lnd node, run the following command:

```
$ npm run regenerate-proto
```

## Testing

### Unit tests

The unit tests mostly test the mock client implementation for now. The proxy and API
integrations are easier to test using integration tests.

To run the unit tests, run the following command:

```
$ npm test
```

### Integration tests

The integration tests test that the different APIs are working together as expected.

To run the integration tests, run the following command:

```
$ npm run test-it
```

### Mocking

To facilitate development, a mock client is available that will act as a Pine client:

```
$ npm run mock-client
```

## Contributing

Want to help us making Pine better? Great, but first read the
[CONTRIBUTING.md](CONTRIBUTING.md) file for instructions.

## Licensing

Pine is licensed under the Apache License, Version 2.0.
See [LICENSE](LICENSE) for full license text.
