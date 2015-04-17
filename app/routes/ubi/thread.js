import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function(args) {
    return client.raw('https://reddit.com/api/info.json').get({
      id: 't3_' + args.thread_id
    }, {bypassAuth: true}).then(function(result) {
      console.log('result', result);
      return (((result||{}).data||{}).children||[]).map(function(j) {return j.data;});
    }).then(function(posts) {
      return posts[0];
    });
  },

  afterModel: function(post) {
    var coins = ['doge', 'nyan', 'rdd'];
    post.prices = {
      satoshi: '0.00000001'
    };
    return Ember.RSVP.all(coins.map(function(name) {
      return Ember.RSVP.resolve($.ajax({
        url: 'https://chain.so/api/v2/get_price/' + name
      })).then(function (result) {
        return result.data.prices.findProperty('price_base', 'BTC');
      }).then(function(data) {
        post.prices[name] = data.price;
      });
    })).then(function() {
      return Ember.RSVP.resolve($.ajax({
        url: 'https://chain.so/api/v2/get_price/btc'
      })).then(function (result) {
        return result.data.prices.findProperty('price_base', 'USD');
      }).then(function(data) {
        post.prices['btc'] = data.price;
        console.log('prices', post.prices);
      });
    }).then(function() {
      return client('/r/' + post.subreddit + '/comments/' + post.id + '.json').get({depth: 1}).then(function(result) {
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
      if (!confirm('Are you sure you want to distribute?')) {
        return;
      }
      var post = this.modelFor('ubi.thread');
      var commentText = Ember.$('#distcomment').val();
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
