import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function(args) {
    var subreddit = this.modelFor('subreddit');
    if (args.thread_id === 'sticky') {
      return client('/r/GetFairShare/new').get().then(function(result) {
        return (((result||{}).data||{}).children||[]).getEach('data').get('firstObject');
      });
    }
    return client.raw('https://reddit.com/api/info.json').get({
      id: 't3_' + args.thread_id
    }, {bypassAuth: true}).then(function(result) {
      return (((result||{}).data||{}).children||[]).map(function(j) {return j.data;});
    }).then(function(posts) {
      return posts[0];
    });
  },
  serialize: function(model) {
    return {
      thread_id: Ember.get(model, 'id')
    };
  }
});
