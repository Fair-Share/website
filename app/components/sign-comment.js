/* globals moment */
import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Component.extend ({
  auth: Ember.inject.service(),
  bitcore: Ember.inject.service(),
  user : Ember.computed.alias('auth.user'),
  message: '',
  buttonText: 'comment',
  statusMessage: 'Commenting...',
  address: Ember.computed.alias('auth.publicKey'),
  username: Ember.computed.alias('auth.username'),
  markdown: Ember.computed.alias('signed.markdown'),
  signature: Ember.computed.alias('signed.signature'),

  signed: function() {
    return this.get('auth').signMessage(this.get('message'));
  }.property('address', 'message'),

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
