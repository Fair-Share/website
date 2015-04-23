import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function(args) {
    return client.raw('https://reddit.com/api/info.json').get({
      id: 't3_' + args.thread_id
    }, {bypassAuth: true}).then(function(result) {
      return (((result||{}).data||{}).children||[]).map(function(j) {return j.data;});
    }).then(function(posts) {
      return posts[0];
    });
  },

  afterModel: function(post) {
    return client('/r/' + post.subreddit + '/comments/' + post.id + '.json').get({depth: 1}, {
      bypassAuth: true
    }).then(function(result) {
      var moreItems = result[1].data.children.filterProperty('kind', 'more').getEach('data');
      var remainingIds = [];
      post.comments = result[1].data.children.filterProperty('kind', 't1').getEach('data');
      moreItems.forEach(function(item) {
        remainingIds.addObjects(item.children || []);
      });
      remainingIds = remainingIds.map(function(id) {return 't1_' + id;});
      function getMoreComments() {
        var ids = remainingIds.splice(0,100);
        if (!ids.length) {return Ember.RSVP.resolve();}
        return client.raw('https://oauth.reddit.com/api/info.json').get({id: ids.join(',')}).then(function(result) {
          return (((result||{}).data||{}).children||[]).map(function(j) {return j.data;});
        }).then(function(moreComments) {
          post.comments = post.comments.concat(moreComments);
          return post;
        }).then(getMoreComments);
      }
      return getMoreComments().then(function() {return post;});
    }).then(function(post) {
      post.persons = post.comments.getEach('author').uniq().without('PoliticBot').without('[deleted]');
      post.comments = post.persons.map(function(name) {
        return post.comments.findProperty('author', name);
      })
      return post;
    });
  }
});
