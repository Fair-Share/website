import Ember from 'ember';

export default Ember.ObjectController.extend({
  needs: ['application'],
  loginUrl: Ember.computed.alias('controllers.application.loginUrl'),
  user: Ember.computed.alias('controllers.application.user'),
  distributingUser: 'PoliticBot',
  ubiPool: 30000000,
  percentage: 10,
  coins: function() {
    return [
      {
        name: 'reddtipbot',
        unit: 'rdd',
        plus: true,
        count: 3115002
      }, {
        name: 'tipnyan',
        unit: 'nyan',
        plus: true,
        count: 1099452
      }, {
        name: 'changetip',
        unit: 'satoshi',
        plus: false,
        count: 48823936
      }
    ];
  }.property(),

  totals: function() {
    var ratio = (parseInt(this.get('percentage')) / 100);
    var post = this.get('model');

    return this.get('coins').map(function(coin) {
      var val = (parseFloat(post.prices[coin.unit]) * coin.count);
      return {
        coin: coin,
        value: val.toFixed(4),
        usdValue: (parseFloat(post.prices.btc) * val).toFixed(2),
        amount: Math.floor(coin.count * ratio)
      };
    });
  }.property('coins.@each.count', 'percentage'),

  shares: function() {
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

  isDistributing: function() {
    return this.get('distributingUser') === this.get('user.name');
  }.property('distributingUser', 'user.name')
});
