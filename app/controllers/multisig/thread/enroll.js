/* globals bitcore */
import Ember from 'ember';
var bitcore = require('bitcore');
var Message = require('bitcore-message');
import CommentMixin from 'fairshare-site/mixins/comment';

export default Ember.Controller.extend({
  needs: ['application'],
  user: Ember.computed.alias('controllers.application.user'),
  percentage: 75,
  maxEnrollment: 16,
  publicKeys: Ember.computed.mapBy('enrolledComments', 'publicKey'),

  isEnrolled: function() {
    var user = this.get('user.name');
    if (!user) {return true;}
    return !!this.get('comments').findProperty('author', user);
  }.property('user.name', 'comments.@each.author'),

  commentItems: Ember.computed.map('model.comments', function(comment) {
    return Ember.Object.createWithMixins(CommentMixin, {
      comment: comment
    });
  }),

  signedCommentItems: Ember.computed.filterProperty('commentItems', 'isSigned', true),

  enrolledComments: function() {
    return this.get('signedCommentItems').slice(0, this.get('maxEnrollment'));
  }.property('signedCommentsItems.@each', 'maxEnrollment'),

  comments: Ember.computed.mapBy('enrolledComments', 'comment'),

  n: function() {
    if (this.get('comments.length') > 16) {
      return 16;
    }
    return this.get('comments.length');
  }.property('commentItems.length'),

  m: function() {
    return Math.floor((parseInt(this.get('percentage'))/100.0) * this.get('n'));
  }.property('n', 'percentage'),

  script: function() {
    var publicKeys = this.get('publicKeys');
    return bitcore.Script.buildMultisigOut(publicKeys, this.get('m'));
  }.property('publicKeys.@each', 'm', 'n'),

  scriptString: function() {
    return this.get('script').toString();
  }.property('script'),

  p2shAddress: function() {
    return bitcore.Address.payingTo(this.get('script'));
  }.property('script'),

  p2shAddressString: function() {
    return this.get('p2shAddress').toString();
  }.property('p2shAddress'),

  actions: {
    removeComment: function(comment) {
      this.get('model.comments').removeObject(comment);
    }
  }
});
