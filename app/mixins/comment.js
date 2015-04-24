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

  plaintext: function() {
    return this.get('message').replace(/\W+/g, " ").trim();
  }.property('message'),

  address: function() {
    var text = this.get('parsedBody').find(this.get('publicKeySelector')).text().trim();
    if (bitcore.Address.isValid(text)) {
      return new bitcore.Address(text);
    }
    if (!text) {return;}
    return (new bitcore.PublicKey(text)).toAddress();
  }.property('parsedBody'),

  isSigned: function() {
    if (!this.get('address') || !this.get('signatureString')) {return;}
    return Message(this.get('plaintext')).verify(this.get('address'), this.get('signatureString'));
  }.property('plaintext', 'signatureString', 'address'),

  signatureString: function() {
    return this.get('parsedBody').find(this.get('signatureSelector')).text();
  }.property('parsedBody')
})
