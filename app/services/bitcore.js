import Ember from 'ember';

var bitcore = require('bitcore');
var Message = require('bitcore-message');

export default Ember.Service.extend({
  Message: bitcore.Message,
  Address: bitcore.Address,
  PublicKey: bitcore.PublicKey,
  PrivateKey: bitcore.PrivateKey,
  Transaction: bitcore.Transaction,

  normalizeMarkdown: function(plaintext) {
    return (plaintext || '').replace(/\W+/g, " ").trim();
  },

  sha256: function(input) {
    return bitcore.crypto.Hash.sha256(new bitcore.deps.Buffer(input)).toString('hex');
  },

  message: function(input) {
    return new Message(input);
  },

  signMessage: function(message, privateKey) {
    return this.message(message).sign(privateKey);
  },

  verifySignature: function(message, address, signature) {
    return this.message(message).verify(address, signature);
  },

  publicKey: function(input) {
    return new bitcore.PublicKey(input);
  },

  privateKey: function(input) {
    return new bitcore.PrivateKey(input);
  },

  address: function(input) {
    return new bitcore.Address(input);
  },

  transaction: function(input) {
    return new bitcore.Transaction(input);
  },

  unspentOutput: function(input) {
    return new bitcore.Transaction.UnspentOutput(input);
  },

  postTransaction: function(transaction) {
    return Ember.RSVP.resolve(Ember.$.ajax({
      method: 'post',
      url: 'https://blockchain.info/pushtx?cors=true',
      data: {
        tx: transaction + ''
      }
    }).then(function(response) {
      console.log('blockchain response', response);
    }));
  },

  getUnspentOutputs: function(address) {
    var bc = this;
    return Ember.RSVP.resolve(Ember.$.ajax({
      url: 'https://chain.so/api/v2/get_tx_unspent/BTC/' + address
    })).then(function(result) {
      return result.data.txs.map(function(tx) {
        return bc.unspentOutput({
          txid: tx.txid,
          satoshis: parseInt(tx.value.replace('.', '')),
          vout: tx.output_no,
          script: tx.script_hex
        })
      }).sortBy('satoshis').reverse();
    }).catch(function(err) {
      console.error('getUnspentOutputs', address, err);
      return [];
    });
  },

  getBalance: function(address) {
    return Ember.RSVP.resolve(Ember.$.ajax({
      url: 'https://chain.so/api/v2/address/btc/' + address
    })).then(function(data) {
      return data.data;
    });
  }
});
