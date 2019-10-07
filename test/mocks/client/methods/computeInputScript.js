import * as bitcoin from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';

import { tweakKeyPair } from '../crypto';
import config from '../config';
import btcd from '../btcd';

const HASH_TYPE_OLD = 0;
const HASH_TYPE_ALL = 1;
const HASH_TYPE_NONE = 2;
const HASH_TYPE_SINGLE = 3;
const HASH_TYPE_ANY_ONE_CAN_PAY = 4;

const SIGHASH_MAP = {
  [HASH_TYPE_OLD]: 0x00,
  [HASH_TYPE_ALL]: bitcoin.Transaction.SIGHASH_ALL,
  [HASH_TYPE_NONE]: bitcoin.Transaction.SIGHASH_NONE,
  [HASH_TYPE_SINGLE]: bitcoin.Transaction.SIGHASH_SINGLE,
  [HASH_TYPE_ANY_ONE_CAN_PAY]: bitcoin.Transaction.SIGHASH_ANYONECANPAY
};

const getKeyPairByIndex = (addressIndex) => {
  const seed = bip39.mnemonicToSeedSync(config.mnemonic);
  const masterNode = bip32.fromSeed(seed, bitcoin.networks.testnet);

  const purpose = 44;
  const coinType = 0; // Mainnet
  const accountIndex = 0;
  const change = 0; // External
  const path = `m/${purpose}'/${coinType}'/${accountIndex}'/${change}/${addressIndex}`;
  const node = masterNode.derivePath(path);

  return node;
};

const getOutputScript = (publicKey) => {
  const p2pkh = bitcoin.payments.p2pkh({
    pubkey: publicKey,
    network: bitcoin.networks.regtest
  });

  return p2pkh.output;
};

const findKeyByOutputScript = (outputScript) => {
  for (let index = 0; index < 300; index++) {
    const keyPair = getKeyPairByIndex(index);
    const output = getOutputScript(keyPair.publicKey);

    if (output.equals(outputScript)) {
      return keyPair;
    }
  }
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

const computeInputScript = (request) => {
  const { transaction, signDescriptor } = request;
  console.log(`computeInputScript(${JSON.stringify(transaction)}, ${JSON.stringify(signDescriptor)})`);

  const keyPair = findKeyByOutputScript(signDescriptor.output.pkScript);

  if (!keyPair) {
    return Promise.reject(new Error('Could not locate key'));
  }

  const tweakedKeyPair = tweakKeyPair(keyPair, signDescriptor);

  return createTransactionBuilder(transaction)
    .then(psbt => {
      const { inputIndex, hashType } = signDescriptor;

      psbt.signInput(
        inputIndex,
        tweakedKeyPair,
        [SIGHASH_MAP[hashType]]
      );

      psbt.validateSignaturesOfInput(inputIndex);
      psbt.finalizeInput(inputIndex);

      const response = {
        signatureScript: psbt.data.inputs[inputIndex].finalScriptSig
      };

      console.log(`→ ${JSON.stringify(response)}\n`);
      return response;
    })
    .catch(error => {
      console.log(`→ ERROR: ${error.message}\n`);
      throw error;
    });
};

export default computeInputScript;
