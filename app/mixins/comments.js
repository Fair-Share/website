import Ember from 'ember';
import CommentMixin from 'fairshare-site/mixins/comment';

export default Ember.Mixin.create({
  commentItems: Ember.computed.map('model.comments', function(comment) {
    return Ember.Object.createWithMixins(CommentMixin, {
      comment: comment,
      container: this.get('container')
    });
  }),

  myCommentItems: function() {
    var name = this.get('auth.user.name');
    return Ember.ArrayProxy.createWithMixins({
      cont: this,
      content: Ember.computed.filterProperty('cont.commentItems', 'comment.author', name)
    });
  }.property('auth.user.name'),
  signedItems: Ember.computed.filterProperty('commentItems', 'isSigned', true),

  rawSignatories: Ember.computed.mapBy('signedItems', 'comment.author'),
  signatories: Ember.computed.uniq('rawSignatories'),
  uniqueSignatures: Ember.computed.map('signatories', function(username) {
    return this.get('signedItems').findProperty('comment.author', username);
  })
})
