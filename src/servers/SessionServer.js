import restify from 'restify';
import errors from 'restify-errors';
import uuidv4 from 'uuid/v4';
import { authenticate } from '../middlewares';

export default class SessionServer {
  constructor(config) {
    this.config = config;

    this.sessions = {};
    this.server = restify.createServer();

    this.server.use(restify.plugins.authorizationParser());
    this.server.use(restify.plugins.queryParser());
    this.server.use(restify.plugins.throttle(config.rateLimit));
    this.server.use(authenticate);

    this.server.post('/v1/lightning/sessions', this._wrapEndpoint(this._startSession));
    this.server.del('/v1/lightning/sessions/:sessionId', this._wrapEndpoint(this._endSession));
  }

  start() {
    const { host, port } = this.config;

    this.server.listen(port, host, () => {
      console.log(`[SESSION] Server listening at ${host}:${port}`);
    });
  }

  stop() {
    this.server.close();
    console.log('[SESSION] Server was stopped');
  }

  _wrapEndpoint(endpoint) {
    return (request, response, next) => {
      try {
        return endpoint.call(this, request, response, next);
      } catch (error) {
        return this._handleUncaughtException(response, next, error);
      }
    };
  }

  _handleUncaughtException(response, next, error) {
    const status = error.statusCode || 500;
    const code = error.code || 'InternalServerError';

    console.error(`[SESSION] ERROR ${status} ${code}: ${error.message}`);

    if (status === 500) {
      return next(
        new errors.InternalServerError('An unexpected error occurred on the server')
      );
    }

    return next(error);
  }

  _startSession(request, response, next) {
    if (!request.userId) {
      return next(
        new errors.UnauthorizedError('Authentication is required to start a new session')
      );
    }

    const sessionId = uuidv4();
    this.sessions[sessionId] = request.userId;
    response.send({ sessionId });
  }

  _endSession(request, response, next) {
    if (!request.userId) {
      return next(
        new errors.UnauthorizedError('Authentication is required to end a session')
      );
    }

    const { sessionId } = request.params;

    if (!sessionId) {
      return next(
        new errors.BadRequestError('The sessionId parameter is missing')
      );
    }

    const userId = this.sessions[sessionId];

    if (userId !== request.userId) {
      return next(
        new errors.NotFoundError('Session not found')
      );
    }

    delete this.sessions[sessionId];
    response.send(204);
  }
}
