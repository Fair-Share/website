import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function(args) {
    var sub = this.modelFor('subreddit');
    return client('/r/' + sub.subreddit + '/wiki/' + args.page + '.json').get().then(function(result) {
      Ember.set(result.data, 'subreddit', sub);
      Ember.set(result.data, 'title', args.page);
      return result.data;
    });
  }
});
