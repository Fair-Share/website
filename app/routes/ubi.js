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
        post.beneficiaries = post.comments.getEach('author').uniq().without('PoliticBot').without('[deleted]');
        return post;
      });
    });
  },

  actions: {
    doDistribution: function() {
      var post = this.modelFor('ubi');
      var commentText = Ember.$('#distcomment').text();
      var unflairedComments = post.comments.filter(function(comment) {
        return ((comment.author_flair_css_class === 'userflair') || !comment.author_flair_css_class);
      });
      var comments = post.beneficiaries.map(function(author) {
        return unflairedComments.findProperty('author', author);
      }).without(undefined);
      var flaired = post.beneficiaries.slice().removeObjects(comments.getEach('author'));
      var errors = [];
      function makeNextComment() {
        var parent = comments.popObject();
        if (!parent) {return Ember.RSVP.resolve();}
        console.log('Distributing to', parent.author, parent.name);
        return client('/api/comment').post({
          api_type: 'json',
          thing_id: parent.name,
          text: commentText
        }).catch(function(error) {
          errors.pushObject(parent);
          console.error('error', parent, error);
        }).then(makeNextComment)
      }
      return client('/api/comment').post({
        api_type: 'json',
        thing_id: post.name,
        text: Ember.$('#distlog').text()
      }).then(makeNextComment).catch(function(error) {
        console.error('comment error', error);
      }).finally(function() {
        console.log(commentText);
        console.error('flaired', flaired);
        console.error('errors', errors);
      });
    }
  }
});
