import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  beforeModel: function(model) {
    var subreddit = this.modelFor('subreddit');
    var post = this.modelFor('thread');
    return client('/r/' + subreddit.display_name + '/wiki/incomeescrows.json').get({}, {
      bypassAuth: true
    }).then(function(result) {
      var el = Ember.$(Ember.get(result, 'data.content_html') || '');
      Ember.set(subreddit, 'escrows', el.find('blockquote h2').toArray().map(function(item) {
        item = Ember.$(item);
        return {
          name: item.find('a:first').text(),
          unit: item.find('em').text(),
          count: parseFloat(item.find('strong').text()),
          percentage: 10
        }
      }));
    }).then(function() {
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
        });
      }).then(function() {
        Ember.set(post, 'beneficiaries', post.comments.getEach('author').uniq().without('PoliticBot').without('[deleted]').sort());
      });
    });
  },

  afterModel: function() {
    var post = this.modelFor('thread');
    var sub = this.modelFor('subreddit');
    return client('/r/' + sub.subreddit + '/wiki/index.json').get({}, {
      bypassAuth: true
    }).then(function(result) {
      console.log('data', result.data);
      Ember.set(sub, 'wiki', result.data);
    });
  },
  actions: {
    removeCoin: function(coin) {
      this.controllerFor('comments.ubi').get('coins').removeObject(coin);
    },
    doDistribution: function() {
      var post = this.modelFor('comments.ubi');
      var controller = this.controllerFor('comments.ubi');
      var commentText = Ember.$('#distcomment').val();
      var bits = controller.get('shareTotal.bits');
      var comments = post.beneficiaries.map(function(author) {
        return post.comments.findProperty('author', author);
      }).without(undefined);
      var errors = [];
      var quoteList = [];
      function makeNextComment() {
        var parent = comments.popObject();
        if (!parent) {return;}
        var commentLines = commentText.split('\n').map(function(j) {return j.trim();}).without('');
        var flair = parent.author_flair_css_class || '';
        var parts = flair.split('-').without('only').without('exclusion');
        var quote = quoteList[Math.floor(Math.random() * quoteList.length)];
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
        if (flair) {
          flair = ' ' + parent.author_flair_text + ' (' + flair + ')';
        }
        commentLines.insertAt(0, '---');
        commentLines.pushObject('---');
        console.log('Distributing to', parent.author + ' - ' + flair, parent.name, flair, commentLines.length, commentLines);
        commentLines.insertAt(0, 'FairShare for [' + parent.author + flair + '](/api/info?id=' + parent.name + ')');
        commentLines.pushObject('[' + quote.title + '](' + quote.permalink + ')');
        var commentBody = commentLines.join('\n\n');
        controller.get('distComments').insertAt(0, {
          request: parent,
          commentBody: commentBody
        });
        //return Ember.RSVP.resolve(makeNextComment());
        return client('/api/comment').post({
          api_type: 'json',
          thing_id: parent.name,
          text: commentBody
        }).catch(function(error) {
          errors.pushObject(parent);
          console.error('error', parent, error);
        }).then(makeNextComment);
      }

      function fetchQuotes() {
        return client('/r/quotes/top.json').get({
          sort: 'top',
          t: 'week',
          limit: 100
        }, {
          bypassAuth: true
        }).then(function(result) {
          return (((result||{}).data||{}).children||[]).getEach('data');
        }).then(function(quotes) {
          quoteList = quotes;
        });
      }

      function closePost() {
        //return Ember.RSVP.resolve(makeNextComment());
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
          /*return client('/api/editusertext').post({
            api_type: 'json',
            thing_id: post.name,
            text: '# [This distribution is CLOSED for requests](/r/' + post.subreddit + '/about/sticky)'
          });*/
        }).then(makeNextComment).catch(function(error) {
          console.error('comment error', error);
        }).finally(function() {
          console.log(commentText);
          if (!errors.length) {return;}
          console.error('errors', errors);
        });
      }

      function makeNextPost() {
        //return Ember.RSVP.resolve();
        var parts = post.title.split(' - ');
        var num = parseInt(parts[0].slice(1)) + 1;
        var date = moment(parts[1]).add('days', 1).format('YYYY-MM-DD');
        var newTitle = '#' + num + ' - ' + date;
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
      controller.set('isMakingComments', true);
      if (!confirm('Are you sure you want to distribute?')) {
        return;
      }
      if (confirm('Make new post?')) {
        return fetchQuotes().then(makeNextPost).then(closePost);
      } else {
        return fetchQuotes().then(closePost);
      }
    }
  }
});
