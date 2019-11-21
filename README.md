Pine Lightning
==============

A bridge between a [customized version of lnd](https://github.com/timothyej/lnd) and the [Pine](https://pine.pm) app for signing transactions using keys owned by the user residing on the user's device.

## Table of Contents

* [Dependencies](#dependencies)
* [Getting started](#getting-started)
* [Configure SSL](#configure-ssl)
* [Client REST API](#client-rest-api)
  * [Endpoints](#endpoints)
  * [Error handling](#error-handling)
  * [Authentication](#authentication-1)
  * [Rate limiting](#rate-limiting-1)
* [Client Websocket API](#client-websocket-api)
  * [Requests](#requests)
  * [Responses](#responses)
  * [Server events](#server-events)
  * [Authentication](#authentication-2)
  * [Rate limiting](#rate-limiting-2)
* [Node API](#node-api)
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
* [Redis](https://redis.io) for caching channel info to be used by the Pine Payment Server
* [btcwallet](https://github.com/btcsuite/btcwallet) and [btcd](https://github.com/btcsuite/btcd) for mocking a wallet during development (*optional*)

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

## Configure SSL

The Pine Payment Protocol requires all servers to be configured with SSL (HTTPS). The server
doesn't directly support that so instead you need to setup a reverse proxy such as [nginx](https://www.nginx.com)
and terminate there before forwarding to this server. The easiest way to obtain an SSL
certificate is by using [Let's Encrypt](https://letsencrypt.org).

For information on how to proxy WebSocket traffic with nginx, see
<http://nginx.org/en/docs/http/websocket.html>.

## Client REST API

The client REST API is an API used by the Pine app to start and end websocket sessions.

### Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | [/v1/lightning/sessions](#get-v1lightningsessions) | Start a new session |
| DELETE | [/v1/lightning/sessions/:sessionId](#delete-v1lightningsessionssessionid) | End a session |

### `POST` /v1/lightning/sessions

Returns a new session ID that can be used to open a websocket connection.
Requires [authentication](#authentication).

#### Returns

Returns a JSON object containing the new session ID.

| Name | Type | Description |
| --- | --- | --- |
| sessionId | *string* | A session ID that can be used to open a new websocket connection. |

### `DELETE` /v1/lightning/sessions/:sessionId

Ends an existing session. Requires [authentication](#authentication).

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| sessionId | *string* | ID of session to end. |

### Error handling

Errors are returned as JSON in the following format:

```json
{
    "error": "<error message>"
}
```

### Authentication

See <https://github.com/blockfirm/pine-payment-server#authentication> for more information.

### Rate limiting

The REST API is rate limited to 1 request per second with bursts up to 2 requests. The rate limiting is
based on the [Token Bucket](https://en.wikipedia.org/wiki/Token_bucket) algorithm and can be configured
in `src/config.js` at `servers.session.rateLimit`.

The limit is per IP number, so if your server is behind a reverse proxy or similar you must change the
config to rate limit by the `X-Forwarded-For` header instead of the actual IP:

```js
rateLimit: {
  ...
  ip: false,
  xff: true
  ...
}
```

## Client Websocket API

The client websocket API is an API used by the Pine app in order to communicate with its
lnd node. Both the server and the client can make RPC calls to each other.

### Requests

Requests can be sent by both the server and the client as a JSON string with the following fields:

| Name | Type | Description |
| --- | --- | --- |
| id | *number* | A unique call ID. |
| method | *string* | Name of method to call. Server requests: Must be one of the defined methods in [rpc.proto](src/protos/rpc.proto), but starting with lowercase. Client requests: Must be one of the defined methods in [methods/](src/methods/). |
| request | *Object* | Request data to pass to the method. |

### Responses

Responses are sent as a response to a server or client request and should have the following JSON fields:

| Name | Type | Description |
| --- | --- | --- |
| id | *number* | The call ID to respond to. |
| response | *Object* | Response data. |

Errors should have the following format:

| Name | Type | Description |
| --- | --- | --- |
| id | *number* | The call ID to respond to. |
| error | *Object* | Error data. |
| error.name | *string* | Optional error name. |
| error.message | *string* | Description of the error. |

### Server events

The server can send sporadic events to the client that are not related to a particular RPC call.
Events have the following JSON fields:

| Name | Type | Description |
| --- | --- | --- |
| event | *string* | Event name. |
| data | *Object* | Optional event data. |

#### Ready event

The `ready` event is emitted when a client has connected and its lnd node is ready.

| Event Name | Event Data |
| --- | --- |
| `ready` | *N/A* |

#### Error event

The `error` event is emitted when an error occurs that is not related to a particular RPC call.

| Event Name | Event Data |
| --- | --- |
| `error` | `name` and `message` |

### Authentication

The websocket API requires authentication by using HTTP Basic Authorization
to provide the session ID and a signature of the session ID obtained from the
client REST API, signed by the same user that requested the session ID.

Set the `Authorization` header to the following:

```
Basic <credentials>
```

`<credentials>` must be replaced with a base64-encoded string of the session ID and a signature of the
session ID:

```
base64('<sessionId>:<signature>')
```

The **signature** is a signature of the session ID using the user's private key
(`secp256k1.sign(sha256(sha256(sessionId)), privateKey).toBase64()` with recovery).

**Note:** If your client doesn't support setting custom headers, use the `Sec-WebSocket-Protocol`
header instead. This can be done by passing the header as the `protocols` parameter
to [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket):

```javascript
const websocket = new WebSocket(url, 'Basic <credentials>');
```

### Rate limiting

The websocket API is rate limited for each connected client. Each client can by default
send 50 messages per minute unless otherwise configured in the config file.

## Node API

The node API is a gRPC API used by the customized lnd node to make requests to the
Pine app through this proxy/bridge. Each RPC call will be passed on to the connected
client through the client API websocket.

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
They require that you have a testing environment set up with lnd, btcd, and btcwallet
and that they are configurated to work together.

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
