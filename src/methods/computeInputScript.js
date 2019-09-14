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
    network: bitcoin.networks.testnet
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

const createTransactionBuilder = (transaction, signDescriptor) => {
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
    transactionBuilder.addInput(
      input.transactionHash,
      input.index,
      input.sequence,
      signDescriptor.output.pkScript
    );
  });

  return transactionBuilder;
};

const computeInputScript = ({ request }, callback) => {
  const { transaction, signDescriptor } = request;
  console.log(`computeInputScript(${JSON.stringify(transaction)}, ${JSON.stringify(signDescriptor)})`);

  const keyPair = findKeyByOutputScript(signDescriptor.output.pkScript);
  const transactionBuilder = createTransactionBuilder(transaction, signDescriptor);

  transactionBuilder.sign(
    signDescriptor.inputIndex,
    keyPair,
    null,
    SIGHASH_MAP[signDescriptor.hashType]
  );

  const builtTransaction = transactionBuilder.build();

  const response = {
    signatureScript: builtTransaction.ins[0].script
  };

  //console.log(JSON.stringify(builtTransaction.ins));
  //console.log('keypair: ', keyPair);

  callback(null, response);
  console.log(`→ ${response}\n`);
};

export default computeInputScript;
