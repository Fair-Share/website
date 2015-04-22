/* globals bitcore */
import Ember from 'ember';
var bitcore = require('bitcore');
var Message = require('bitcore-message');

export default Ember.Controller.extend({
  needs: ['application'],
  user: Ember.computed.alias('controllers.application.user'),
  percentage: 75,
  publicKeys: Ember.computed.mapBy('comments', 'publicKey'),

  isEnrolled: function() {
    var user = this.get('user.name');
    if (!user) {return true;}
    return !!this.get('comments').findProperty('author', user);
  }.property('user.name', 'comments.@each.author'),

  comments: function() {
    return this.get('model.comments').slice(0, this.get('n')).map(function(comment) {
      var pubKey = Ember.$(comment.body_html).find('strong:first').text();
      Ember.set(comment, 'publicKey', bitcore.PublicKey(pubKey));
      Ember.set(comment, 'publicKeyString', Ember.get(comment, 'publicKey').toString('hex'));
      return comment;
    });
  }.property('model.comments.@each', 'n'),
  n: function() {
    if (this.get('model.comments.length') > 16) {
      return 16;
    }
    return this.get('model.comments.length');
  }.property('model.comments.length'),
  m: function() {
    return Math.floor((parseInt(this.get('percentage'))/100.0) * this.get('n'));
  }.property('n', 'percentage'),
  script: function() {
    return bitcore.Script.buildMultisigOut(this.get('publicKeys'), this.get('m'));
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
