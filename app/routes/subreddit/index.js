import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  listing: 'hot',

  model: function() {
    var sub = this.modelFor('subreddit');
    return client('/r/' + sub.subreddit + '/' + this.get('listing')).get().then(function(result) {
      return (((result||{}).data||{}).children||[]).getEach('data');
    });
  },
  afterModel: function(model) {
    Ember.set(model, 'subreddit', this.modelFor('subreddit'));
  },
  actions: {
    switchThread: function() {
      var threadId = this.controllerFor('ubi.thread').get('newThreadId');
      if (!threadId) {return;}
      this.transitionTo('/ubi/' + threadId);
    }
  }
});
