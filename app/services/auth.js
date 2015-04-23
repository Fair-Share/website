import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Service.extend({
  loginUrl: function() {
    return client.getImplicitAuthUrl();
  }.property('user'),
  loginExpiry: function() {
    return this.get('loginExpires');
  }.property('loginExpires', 'timeupdater.currentMoment'),
  updateUserData: function() {
    if (!this.get('user')) {return;}
    client('/api/v1/me').get().then(function(user) {
      this.set('user', user);
    }.bind(this)).catch(function() {
      this.growl.alert([
        '<div class="message">Logged out</div>'
      ].join('\n'), {clickToDismiss: true});
      this.set('user', null);
    }.bind(this));
  }.observes('timeupdater.currentMoment')
});
