import errors from 'restify-errors';
import { verifyPineSignature } from '../crypto';

const authenticate = function authenticate(request, _response, next) {
  if (!request.authorization || !request.authorization.basic) {
    return next();
  }

  const { username, password } = request.authorization.basic;
  const message = request.href() + (request.rawBody || '');

  if (username.indexOf('@') > -1) {
    return next(
      new errors.UnauthorizedError('External users are not authorized to use this API')
    );
  }

  try {
    if (!verifyPineSignature(message, password, username)) {
      throw new Error('Verification failed');
    }
  } catch (error) {
    return next(
      new errors.InvalidCredentialsError('Authentication failed')
    );
  }

  request.userId = username;

  return next();
};

export default authenticate;
