import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Controller.extend({
  queryParams: ['access_token'],
  auth: Ember.inject.service(),
  loginUrl: Ember.computed.alias('auth.loginUrl'),
  user: Ember.computed.alias('auth.user'),
  didChangeModel: function() {
    this.set('auth.user', this.get('model'));
  }.observes('model').on('init')
});
