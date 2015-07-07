/* globals Snoocore */
import Ember from 'ember';
import config from 'fairshare-site/config/environment';

export default Ember.Service.extend({
  userAgent: 'FairShare 0.0.1 by go1dfish',

  scope: [
    'identity',
    'submit'
  ],

  api: function() {
    return new Snoocore({
      userAgent: this.get('userAgent'),
      decodeHtmlEntities: true,
      oauth: {
        type: 'implicit',
        mobile: false,
        duration: 'temporary',
        consumerKey: config.consumerKey,
        redirectUri: config.redirectUrl,
        scope: this.get('scope')
      }
    });
  }.property('userAgent', 'scope')
});
