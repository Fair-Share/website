import Ember from 'ember';

export default Ember.ObjectController.extend({
  needs: ['application'],
  queryParams: ['isDistributing'],
  loginUrl: Ember.computed.alias('controllers.application.loginUrl'),
  user: Ember.computed.alias('controllers.application.user'),
  distributingUser: 'PoliticBot',
  ubiPool: 30000000,
  coins: function() {
    return [
      {
        name: 'reddtipbot',
        unit: 'rdd',
        plus: true,
        count: 2841730,
        percentage: 10
      }, {
        name: 'tipnyan',
        unit: 'nyan',
        plus: true,
        count: 1028395,
        percentage: 10
      }, {
        name: 'dogetipbot',
        unit: 'doge',
        plus: true,
        count: 44757,
        percentage: 10
      }, {
        name: 'tippot',
        unit: 'pot',
        plus: true,
        count: 9286,
        percentage: 10
      }, {
        name: 'changetip',
        unit: 'satoshi',
        plus: false,
        count: 44421190,
        percentage: 10
      }
    ];
  }.property(),

  _totals: function() {
    var post = this.get('model');

    return this.get('coins').map(function(coin) {
      var val = (parseFloat(post.prices[coin.unit]) * coin.count);
      var ratio = (parseInt(coin.percentage) / 100);

      return {
        coin: coin,
        value: val.toFixed(4),
        usdValue: (parseFloat(post.prices.btc) * val).toFixed(2),
        amount: Math.floor(coin.count * ratio)
      };
    });
  }.property('coins.@each.{count,percentage}'),

  totalsSort: ['value:desc'],
  totals: Ember.computed.sort('_totals', 'totalsSort'),

  collectiveTotal: function() {
    var btcValue = 0;
    var usdValue = 0;
    this.get('totals').forEach(function(total) {
      btcValue += parseFloat(total.value);
      usdValue += parseFloat(total.usdValue);
    });
    return {
      btc: btcValue.toFixed(4),
      usd: usdValue.toFixed(2)
    };
  }.property('totals.@each.value', 'totals.@each.usdValue'),

  shareTotal: function() {
    var post = this.get('model');
    var btcValue = 0;
    var usdValue = 0;
    this.get('shares').forEach(function(share) {
      var btc = (parseFloat(post.prices[share.coin.unit]) * share.amount);
      var usd = (parseFloat(post.prices.btc) * btc);
      btcValue += btc;
      usdValue += usd;
    });
    return {
      bits: (btcValue * 1000000).toFixed(2),
      usd: usdValue.toFixed(2)
    };
  }.property('shares.@each.total', 'model.prices'),

  _shares: function() {
    var count = this.get('beneficiaryCount');
    return this.get('totals').map(function(total) {
      var amount = Math.floor(total.amount/count);
      return {
        coin: total.coin,
        total: total,
        amount: amount
      };
    });
  }.property('totals.@each.total', 'beneficiaryCount'),

  maxCoins: 3,
  shares: function() {
    return this.get('_shares').slice(0, this.get('maxCoins'));
  }.property('_shares.@each', 'maxCoins'),

  beneficiaryCount: function(key, value) {
    if (value) {
      return parseInt(value);
    }
    return this.get('beneficiaries.length');
  }.property('beneficiaries.length'),

  fairShare: function() {
    var count = this.get('beneficiaryCount');
    if (!count) {return this.get('total')};
    return Math.floor(this.get('total') / count);
  }.property('beneficiaryCount', 'total'),

  requestComment: function() {
    return this.get('comments').findProperty('author', this.get('user.name'));
  }.property('user', 'comments.@each.author'),

  isDistributing: function(key, value) {
    if (arguments.length > 1) {return value;}
    return this.get('distributingUser') === this.get('user.name');
  }.property('distributingUser', 'user.name')
});
