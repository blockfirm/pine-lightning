import { getKeyPairFromMnemonic, hash256, signHash } from '../../../../crypto';

const mnemonic = 'abuse boss fly battle rubber wasp afraid hamster guide essence vibrant tattoo';

const post = function post(request, response) {
  return Promise.resolve().then(() => {
    const keyPair = getKeyPairFromMnemonic(mnemonic);
    const hash = hash256(Buffer.from(request.body, 'base64'));
    const signature = signHash(hash, keyPair);

    response.send(signature);
  });
};

export default post;
