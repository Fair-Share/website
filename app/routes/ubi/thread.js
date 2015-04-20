/* globals moment */
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
    var coins = ['doge', 'nyan', 'rdd', 'ltc', 'pot'];
    post.prices = {
      satoshi: '0.00000001'
    };
    return Ember.RSVP.all(coins.map(function(name) {
      return Ember.RSVP.resolve(Ember.$.ajax({
        url: 'https://chain.so/api/v2/get_price/' + name
      })).then(function (result) {
        return result.data.prices.findProperty('price_base', 'BTC');
      }).then(function(data) {
        post.prices[name] = data.price;
      });
    })).then(function() {
      return Ember.RSVP.resolve(Ember.$.ajax({
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
        post.beneficiaries = post.comments.getEach('author').uniq().without('PoliticBot').without('[deleted]').sort();
        return post;
      });
    });
  },

  actions: {
    removeCoin: function(coin) {
      this.controllerFor('ubi.thread').get('coins').removeObject(coin);
    },
    doDistribution: function() {
      var post = this.modelFor('ubi.thread');
      var commentText = Ember.$('#distcomment').val();
      var bits = this.controllerFor('ubi.thread').get('shareTotal.bits');
      var comments = post.beneficiaries.map(function(author) {
        return post.comments.findProperty('author', author);
      }).without(undefined);
      var errors = [];
      function makeNextComment() {
        var parent = comments.popObject();
        var commentLines = commentText.split('\n').map(function(j) {return j.trim();}).without('');
        var flair = parent.author_flair_css_class || '';
        var parts = flair.split('-').without('only').without('exclusion');
        commentLines = commentLines.filter(function(line) {
          if (!flair) {return true;}
          if (flair.match(/exclusion/)) {
            if (parts.find(function(j) {
              return line.toLowerCase().indexOf(j.toLowerCase()) !== -1;
            })) {
              return false;
            }
            return true;
          }
          if (flair.match(/only/)) {
            if (parts.find(function(j) {
              return line.toLowerCase().indexOf(j.toLowerCase()) !== -1;
            })) {
              return true;
            }
            return false;
          }
          return true;
        });
        if (!parent) {return Ember.RSVP.resolve();}
        console.log('Distributing to', parent.author, parent.name, flair, commentLines.length, commentLines);
        return client('/api/comment').post({
          api_type: 'json',
          thing_id: parent.name,
          text: commentLines.join('\n\n')
        }).catch(function(error) {
          errors.pushObject(parent);
          console.error('error', parent, error);
        }).then(makeNextComment);
      }

      function closePost() {
        console.log('closePost',  bits + ' * ' + comments.length);
        return client('/api/comment').post({
          api_type: 'json',
          thing_id: post.name,
          text: Ember.$('#distlog').text()
        }).then(function() {
          /*return client('/api/flair').post({
            api_type: 'json',
            css_class: 'closed',
            link: post.name,
            text: bits + ' * ' + comments.length
          });*/
        }).then(function() {
          return client('/api/editusertext').post({
            api_type: 'json',
            thing_id: post.name,
            text: '# [This distribution is CLOSED for requests](/r/' + post.subreddit + '/about/sticky)'
          });
        }).then(makeNextComment).catch(function(error) {
          console.error('comment error', error);
        }).finally(function() {
          console.log(commentText);
          if (!errors.length) {return;}
          console.error('errors', errors);
        });
      }

      function makeNextPost() {
        var parts = post.title.split(' - ');
        var num = parseInt(parts[0].slice(1)) + 1;
        var date = moment(parts[1]).add('days', 1).format('YYYY-MM-DD');
        var newTitle = '#' + num + ' - ' + date;
        console.log('makeNextPost', newTitle);
        return client('/api/submit').post({
          api_type: 'json',
          sr: post.subreddit,
          kind: 'self',
          title: newTitle,
          text: post.selftext,
          sendreplies: false
        }).then(function(result) {
          /*return client('/api/set_subreddit_sticky').post({
            api_type: 'json',
            id: result.name,
            state: true
          });*/
        });
      }
      if (!confirm('Are you sure you want to distribute?')) {
        return;
      }
      if (confirm('Make new post?')) {
        return makeNextPost().then(closePost);
      } else {
        return closePost();
      }
    }
  }
});
