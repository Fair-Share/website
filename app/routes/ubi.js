import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function() {
    return client('/r/GetFairShare/new').get().then(function(result) {
      return (((result||{}).data||{}).children||[]).getEach('data');
    }).then(function(posts) {
      return posts.find(function(post) {
        return post.title.match(/\#/);
      });
    }).then(function(post) {
      return client('/r/GetFairShare/comments/' + post.id + '.json').get({depth: 1}).then(function(result) {
        post.comments = result[1].data.children.getEach('data');
        post.beneficiaries = post.comments.getEach('author').uniq().without('PoliticBot').without('[deleted]');
        return post;
      });
    });
  }
});
