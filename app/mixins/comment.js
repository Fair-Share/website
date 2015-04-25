import Ember from 'ember';

export default Ember.Mixin.create({
  bitcore: Ember.inject.service(),
  publicKeySelector: 'strong:first',
  signatureSelector: 'em:last',

  parsedBody: function() {
    return Ember.$(this.get('comment.body_html'));
  }.property('comment.body_html'),

  message: function() {
    var lines = (this.get('comment.body') || '').trim().split('\n');
    lines = lines.splice(1);
    lines.pop();
    return lines.join('\n').trim();
  }.property('comment.body'),

  messageHtml: function() {
    if (!this.get('isSigned')) {return this.get('comment.body_html');}
    var body = Ember.$(this.get('comment.body_html'));
    Ember.$(body.find(this.get('publicKeySelector')).parent()).remove();
    Ember.$(body.find(this.get('signatureSelector')).parent()).remove();
    return '<div class="md">' + body.html() + '</div>';
  }.property('comment.body_html', 'isSigned'),

  plaintext: function() {
    return this.get('bitcore').normalizeMarkdown(this.get('message'));
  }.property('message'),

  address: function() {
    var text = this.get('parsedBody').find(this.get('publicKeySelector')).text().trim();
    if (this.get('bitcore').Address.isValid(text)) {
      return this.get('bitcore').address(text);
    }
    if (!text) {return;}
    return this.get('bitcore').publicKey(text).toAddress();
  }.property('parsedBody'),

  addressString: function() {
    var address = this.get('address');
    if (!address) {return;}
    return address.toString();
  }.property('address'),

  isSigned: function() {
    if (!this.get('address') || !this.get('signature')) {return;}
    var isSigned = this.get('bitcore').verifySignature(this.get('plaintext'), this.get('address'), this.get('signature'));
    if (!isSigned) {console.log('err', this.get('address') + '', this.get('plaintext'));}
    return isSigned;
  }.property('plaintext', 'signature', 'address'),

  signature: function() {
    var sig = this.get('parsedBody').find(this.get('signatureSelector')).text().trim();
    return sig;
  }.property('parsedBody')
})
