const btcd = {
  getRawTransaction: () => {
    return Promise.resolve({
      hex: '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff1802c91d084f32d813f4315e7a0b2f503253482f627463642fffffffff0100f2052a010000001976a9145e1ff98beaf601d973eb950f7607265d3ae22fd188ac00000000',
      txid: '6ef97a5887da4a9496c3c47ce7ce11d895c82583c4daa38bd7fb93a1077f2400',
      hash: '6ef97a5887da4a9496c3c47ce7ce11d895c82583c4daa38bd7fb93a1077f2400',
      size: 109,
      vsize: 109,
      version: 1,
      locktime: 0,
      vin: [{
        coinbase: '02c91d084f32d813f4315e7a0b2f503253482f627463642f',
        sequence: 4294967295
      }],
      vout: [{
        value: 50,
        n: 0,
        scriptPubKey: {
          asm: 'OP_DUP OP_HASH160 5e1ff98beaf601d973eb950f7607265d3ae22fd1 OP_EQUALVERIFY OP_CHECKSIG',
          hex: '76a9145e1ff98beaf601d973eb950f7607265d3ae22fd188ac',
          reqSigs: 1,
          type: 'pubkeyhash',
          addresses: ['SVsgrXBziXHVbvhUdW9tLiP3VvRv1r5ibr']
        }
      }],
      blockhash: '00ce06e4ba6ba534f4ee061aa50a09752b00a2a672d91e9ff88fa21b1d2e4d5a',
      confirmations: 492,
      time: 1566512511,
      blocktime: 1566512511
    });
  }
};

export default btcd;
