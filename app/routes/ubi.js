import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function() {
    return client('/r/GetFairShare/new').get().then(function(result) {
      return (((result||{}).data||{}).children||[]).getEach('data');
    });
  },
  actions: {
    switchThread: function() {
      var threadId = this.controllerFor('ubi.thread').get('newThreadId');
      if (!threadId) {return;}
      this.transitionTo('/ubi/' + threadId);
    }
  }
});
