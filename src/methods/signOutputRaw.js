/* eslint-disable max-lines */
import * as bitcoin from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';

import config from '../config';
import btcd from '../btcd';

const HASH_TYPE_OLD = 0;
const HASH_TYPE_ALL = 1;
const HASH_TYPE_NONE = 2;
const HASH_TYPE_SINGLE = 3;
const HASH_TYPE_ANY_ONE_CAN_PAY = 4;

const SIGHASH_MAP = {
  [HASH_TYPE_OLD]: bitcoin.Transaction.SIGHASH_ALL, // TODO: Find correct sighash.
  [HASH_TYPE_ALL]: bitcoin.Transaction.SIGHASH_ALL,
  [HASH_TYPE_NONE]: bitcoin.Transaction.SIGHASH_NONE,
  [HASH_TYPE_SINGLE]: bitcoin.Transaction.SIGHASH_SINGLE,
  [HASH_TYPE_ANY_ONE_CAN_PAY]: bitcoin.Transaction.SIGHASH_ANYONECANPAY
};

const fetchInputTransactions = (inputs) => {
  const promises = inputs.map(input => {
    const txid = input.transactionHash.hexSlice().match(/../g).reverse().join('');

    return btcd.getRawTransaction(txid).then(transaction => {
      input.transaction = transaction;
    });
  });

  return Promise.all(promises).then(() => inputs);
};

const createTransactionBuilder = (transaction) => {
  const psbt = new bitcoin.Psbt({
    network: bitcoin.networks.regtest
  });

  psbt.setVersion(transaction.version);
  psbt.setLocktime(transaction.lockTime);

  transaction.outputs.forEach(output => {
    psbt.addOutput({
      script: output.pkScript,
      value: Number(output.value)
    });
  });

  return fetchInputTransactions(transaction.inputs).then(inputs => {
    inputs.forEach(input => {
      psbt.addInput({
        hash: input.transactionHash,
        index: input.index,
        sequence: input.sequence,
        nonWitnessUtxo: Buffer.from(input.transaction.hex, 'hex')
      });
    });

    return psbt;
  });
};

const findKeyPairByKeyLocator = (keyLocator) => {
  const seed = bip39.mnemonicToSeedSync(config.mnemonic);
  const masterNode = bip32.fromSeed(seed, bitcoin.networks.testnet);

  const purpose = 1017;
  const coinType = 1; // Testnet
  const accountIndex = keyLocator.keyFamily;
  const change = 0; // External
  const path = `m/${purpose}'/${coinType}'/${accountIndex}/${change}/${keyLocator.index}`;
  const node = masterNode.derivePath(path);

  return node;
};

const findKeyPairByPublicKey = (publicKey) => {
  // TODO: Find key by looping through all addresses.
  throw new Error('Find key by public key is not implemented');
};

const findKeyPair = (keyDescriptor) => {
  const { keyLocator, publicKey } = keyDescriptor;

  if (keyLocator) {
    return findKeyPairByKeyLocator(keyLocator);
  }

  if (publicKey && publicKey.length) {
    return findKeyPairByPublicKey(publicKey);
  }
};

const getTweakedKeyPair = (keyPair, signDescriptor) => {
  const { singleTweak, doubleTweak } = signDescriptor;

  if (doubleTweak && doubleTweak.length) {
    // TODO
    throw new Error('DoubleTweak is not implemented');
  }

  if (singleTweak && singleTweak.length) {
    // TODO
    throw new Error('SingleTweak is not implemented');
  }

  return keyPair;
};

const signOutputRaw = ({ request }, callback) => {
  const { transaction, signDescriptor } = request;
  console.log(`signOutputRaw(${JSON.stringify(transaction)}, ${JSON.stringify(signDescriptor)})`);

  const keyPair = findKeyPair(signDescriptor.keyDescriptor);

  if (!keyPair) {
    return callback(new Error('Could not locate key'));
  }

  const pubkey = bitcoin.ECPair.fromPublicKey(signDescriptor.keyDescriptor.publicKey);
  console.log(pubkey.publicKey.toString('hex'));
  console.log(keyPair.publicKey.toString('hex'));

  const tweakedKeyPair = getTweakedKeyPair(keyPair, signDescriptor);

  createTransactionBuilder(transaction)
    .then(psbt => {
      psbt.signInput(
        signDescriptor.inputIndex,
        tweakedKeyPair,
        [SIGHASH_MAP[signDescriptor.hashType]]
      );

      psbt.validateSignaturesOfInput(signDescriptor.inputIndex);
      psbt.finalizeAllInputs();

      const inputSignature = psbt.data.inputs[signDescriptor.inputIndex].partialSig[0];

      // Chop off the sighash flag at the end of the signature.
      const signature = inputSignature.slice(0, inputSignature.length - 1);

      callback(null, { signature });
      console.log(`→ ${JSON.stringify(signature)}\n`);
    })
    .catch(error => {
      callback(error);
      console.log(`→ ERROR: ${error.message}\n`);
    });
};

export default signOutputRaw;

