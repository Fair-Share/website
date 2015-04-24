import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Component.extend ({
  auth: Ember.inject.service(),
  bitcore: Ember.inject.service(),
  user : Ember.computed.alias('auth.user'),
  message: '',
  passPhrase: '',
  passPhraseRepeat: '',
  buttonText: 'comment',
  statusMessage: 'Commenting...',

  matchingPassPhrase: function() {
    if (this.get('passPhrase') === this.get('passPhraseRepeat')) {
      return this.get('passPhrase');
    }
  }.property('passPhrase', 'passPhraseRepeat'),

  hashedPassPhrase: function() {
    var phrase = this.get('matchingPassPhrase');
    if (!phrase) {return;}
    return this.get('bitcore').sha256(phrase);
  }.property('matchingPassPhrase'),

  privateKey: function() {
    var hashed = this.get('hashedPassPhrase');
    if (!hashed) {return;}
    return this.get('bitcore').privateKey(hashed);
  }.property('hashedPassPhrase'),

  markdown: function() {
    var address = this.get('address');
    if (!address) {return;}
    return [
      '**' + address + '**',
      this.get('message'),
      '*' + this.get('signature') + '*'
    ].join('\n\n');
  }.property('publicKey', 'message', 'signature'),

  publicKey: function() {
    var privateKey = this.get('privateKey');
    if (!privateKey) {return;}
    return this.get('bitcore').publicKey(privateKey);
  }.property('privateKey'),

  address: function() {
    var publicKey = this.get('publicKey');
    if (!publicKey) {return;}
    return publicKey.toAddress();
  }.property('publicKey'),

  plaintext: function() {
    return this.get('bitcore').normalizeMarkdown(this.get('message'));
  }.property('message'),

  signature: function() {
    var privateKey = this.get('privateKey');
    if (!privateKey) {return;}
    return this.get('bitcore').signMessage(this.get('plaintext'), this.get('privateKey'));
  }.property('privateKey', 'plaintext'),

  actions: {
    makeComment: function() {
      if (this.get('isCommenting')) {return;}
      var markdown = this.get('markdown');
      var comments = this.get('comments') || [];
      if (!markdown) {return;}
      var thingId = this.get('thingId');
      if (!thingId) {return;}
      if (!this.get('user.name')) {return;}
      this.set('isCommenting', true);
      return client('/api/comment').post({
        api_type: 'json',
        thing_id: thingId,
        text: markdown
      }).then(function(data) {
        var comment = data.json.data.things[0].data;
        comments.insertAt(0, comment);
      }, function(error) {
        console.error(error);
        alert('Error making comment', error);
      }).finally(function() {
        this.set('isCommenting', false)
      }.bind(this));
    }
  }
});
