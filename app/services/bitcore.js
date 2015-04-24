import Ember from 'ember';

var bitcore = require('bitcore');
var Message = require('bitcore-message');

export default Ember.Service.extend({
  Message: bitcore.Message,
  Address: bitcore.Address,
  PublicKey: bitcore.PublicKey,
  PrivateKey: bitcore.PrivateKey,

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
  }
});
