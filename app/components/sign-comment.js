import Ember from 'ember';
import client from 'fairshare-site/client';
var bitcore = require('bitcore');
var Message = require('bitcore-message');

export default Ember.Component.extend ({
  message: '',
  passPhrase: '',
  passPhraseRepeat: '',

  matchingPassPhrase: function() {
    if (this.get('passPhrase') === this.get('passPhraseRepeat')) {
      return this.get('passPhrase');
    }
  }.property('passPhrase', 'passPhraseRepeat'),

  hashedPassPhrase: function() {
    var phrase = this.get('matchingPassPhrase');
    if (!phrase) {return;}
    return bitcore.crypto.Hash.sha1(new bitcore.deps.Buffer(phrase)).toString('hex');
  }.property('matchingPassPhrase'),

  privateKey: function() {
    var hashed = this.get('hashedPassPhrase');
    if (!hashed) {return;}
    return new bitcore.PrivateKey(hashed);
  }.property('hashedPassPhrase'),

  markdown: function() {
    var publicKey = this.get('publicKey');
    if (!publicKey) {return;}
    return [
      '**' + publicKey + '**',
      this.get('message'),
      '*' + this.get('signature') + '*'
    ].join('\n\n');
  }.property('publicKey', 'message', 'signature'),

  publicKey: function() {
    var privateKey = this.get('privateKey');
    if (!privateKey) {return;}
    return new bitcore.PublicKey(privateKey);
  }.property('privateKey'),

  signature: function() {
    var privateKey = this.get('privateKey');
    if (!privateKey) {return;}
    return Message(this.get('message') || '').sign(this.get('privateKey'));
  }.property('privateKey', 'message'),

  actions: {
    makeComment: function() {
      if (this.get('isCommenting')) {return;}
      var markdown = this.get('markdown');
      var comments = this.get('comments') || [];
      if (!markdown) {return;}
      var thingId = this.get('thingId');
      console.log('thingId', thingId);
      if (!thingId) {return;}
      if (!this.get('user.name')) {return;}
      this.set('isCommenting', true);
      return client('/api/comment').post({
        api_type: 'json',
        thing_id: thingId,
        text: markdown
      }).then(function(data) {
        console.log('data', data);
        var comment = data.json.data.things[0].data;
        console.log('comment', comment);
        comments.pushObject(comment);
      }, function(error) {
        console.error(error);
        alert('Error making comment', error);
      }).finally(function() {
        this.set('isCommenting', false)
      }.bind(this));
    }
  }
});
