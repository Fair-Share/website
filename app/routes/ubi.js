import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function() {
    return client('/r/GetFairShare/new').get().then(function(result) {
      return result.data.children;
    }).then(function(posts) {
      var post = posts.find(function(post) {
        console.log('1', post);
        return post.data.title.match(/Prototype Distribution/);
      });
      if (post) {return post.data};
    }).then(function(post) {
      return client('/r/GetFairShare/comments/' + post.id + '.json').get().then(function(result) {
        post.comments = result[1].data.children.getEach('data');
        post.beneficiaries = post.comments.getEach('author').uniq().without('PoliticBot');
        return post;
      });
    });
  }
});
