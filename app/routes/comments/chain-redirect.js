import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  redirect: function() {
    this.transitionTo('/r/GetFairShare/sticky/comments/chain/1JBbuhbsnou187vsQX8M9xHX64HWCAEpJi');
  }
});
