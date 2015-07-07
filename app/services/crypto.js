/* globals require */
import Ember from 'ember';
var bitcore = require('bitcore');

export default Ember.Service.extend({
  sha256: function(input) {
    return bitcore.crypto.Hash.sha256(new bitcore.deps.Buffer(input)).toString('hex');
  },
  normalizeMarkdown: function(plaintext) {
    return (plaintext || '').replace(/\W+/g, " ").trim();
  }
});
