import bitcoin from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import config from '../config';

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

const createTransactionBuilder = (transaction) => {
  const transactionBuilder = new bitcoin.TransactionBuilder(
    bitcoin.networks.testnet
  );

  transactionBuilder.setVersion(transaction.version);
  transactionBuilder.setLockTime(transaction.lockTime);

  transaction.outputs.forEach(output => {
    transactionBuilder.addOutput(
      output.pkScript,
      Number(output.value)
    );
  });

  transaction.inputs.forEach(input => {
    transactionBuilder.__addInputUnsafe(
      input.transactionHash,
      input.index, {
        sequence: input.sequence,
        script: input.signatureScript,
        witness: input.witness
      }
    );
  });

  return transactionBuilder;
};

const findKeyPairByKeyLocator = (keyLocator) => {
  const seed = bip39.mnemonicToSeedSync(config.mnemonic);
  const masterNode = bip32.fromSeed(seed, bitcoin.networks.testnet);

  const purpose = 44;
  const coinType = 1; // Testnet
  const accountIndex = keyLocator.keyFamily;
  const change = 0; // External
  const path = `m/${purpose}'/${coinType}'/${accountIndex}'/${change}/${keyLocator.index}`;
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

  const transactionBuilder = createTransactionBuilder(transaction);
  const keyPair = findKeyPair(signDescriptor.keyDescriptor);
  const tweakedKeyPair = getTweakedKeyPair(keyPair, signDescriptor);

  transactionBuilder.sign({
    prevOutScriptType: 'p2pkh',
    vin: signDescriptor.inputIndex,
    keyPair: tweakedKeyPair,
    hashType: SIGHASH_MAP[signDescriptor.hashType]
  });

  const builtTransaction = transactionBuilder.build();
  const inputSignature = builtTransaction.ins[signDescriptor.inputIndex].script;

  // Chop off the sighash flag at the end of the signature.
  const signature = inputSignature.slice(0, inputSignature.length - 1);

  callback(null, { signature });
};

export default signOutputRaw;

