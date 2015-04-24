import Ember from 'ember';
var bitcore = require('bitcore');
var Message = require('bitcore-message');

export default Ember.Mixin.create({
  publicKeySelector: 'strong:first',
  signatureSelector: 'em:last',
  parsedBody: function() {
    return Ember.$(this.get('comment.body_html'));
  }.property('comment.body_html'),

  message: function() {
    var lines = (this.get('comment.body') || '').split('\n');
    lines = lines.splice(1);
    lines.pop();
    return lines.join('\n').trim();
  }.property('comment.body'),

  address: function() {
    return this.get('publicKey').toAddress();
  }.property('publicKey'),

  isSigned: function() {
    if (!this.get('publicKeyString') || !this.get('address') || !this.get('signatureString')) {return;}
    return Message(this.get('message')).verify(this.get('address'), this.get('signatureString'));
  }.property('message', 'signatureString', 'address'),

  publicKeyString: function() {
    return this.get('parsedBody').find(this.get('publicKeySelector')).text();
  }.property('parsedBody'),

  publicKey: function() {
    return new bitcore.PublicKey(this.get('publicKeyString'))
  }.property('publicKeyString'),

  signatureString: function() {
    return this.get('parsedBody').find(this.get('signatureSelector')).text();
  }.property('parsedBody')
})
