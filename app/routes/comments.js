import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function() {
    var post = this.modelFor('thread');
    return client('/comments/' + post.id + '.json').get({depth: 1}, {
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
        return client.raw('https://oauth.reddit.com/api/info.json').get({id: ids.join(',')}, {
          bypassAuth: true
        }).then(function(result) {
          return (((result||{}).data||{}).children||[]).map(function(j) {return j.data;});
        }).then(function(moreComments) {
          post.comments = post.comments.concat(moreComments);
          return post;
        }).then(getMoreComments);
      }
      return getMoreComments().then(function() {return post;});
    }).then(function(post) {
      post.persons = post.comments.getEach('author').uniq().without('PoliticBot').without('[deleted]');
      return post;
    });
  }
});
