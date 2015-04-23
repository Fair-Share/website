import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  beforeModel: function(model) {
    var subreddit = this.modelFor('subreddit');
    var post = this.modelFor('thread');
    return client('/r/' + subreddit.display_name + '/wiki/incomeescrows.json').get().then(function(result) {
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
  actions: {
    removeCoin: function(coin) {
      this.controllerFor('comments.ubi').get('coins').removeObject(coin);
    }
  }
});
