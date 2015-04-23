import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  /*model: function() {
    return client('/r/GetFairShare/new').get({}, {
      bypassAuth: true
    }).then(function(result) {
      return (((result||{}).data||{}).children||[]).getEach('data');
    });
  },
  afterModel: function(model) {
    return client('/r/GetFairShare/wiki/incomeescrows.json').get({}, {
      bypassAuth: true
    }).then(function(result) {
      console.log('result', result);
      model.escrows = result.data;
    });
  },*/
  redirect: function() {
    this.transitionTo('/r/GetFairShare/sticky');
  },
  actions: {
    switchThread: function() {
      var threadId = this.controllerFor('ubi.thread').get('newThreadId');
      if (!threadId) {return;}
      this.transitionTo('/ubi/' + threadId);
    }
  }
});
