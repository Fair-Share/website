import Ember from 'ember';

export default Ember.ObjectController.extend({
  needs: ['application'],
  loginUrl: Ember.computed.alias('controllers.application.loginUrl'),
  user: Ember.computed.alias('controllers.application.user'),
  ubiPool: 30000000,
  percentage: 10,
  coins: function() {
    return [
      {
        name: 'Doge',
        unit: 'Doge',
        count: 5000000,
        tip: function(amount) {
          return '+/u/dogetipbot ' + amount + ' doge verify';
        }
      }, {
        name: 'Reddcoin',
        unit: 'RDD',
        count: 1000000,
        tip: function(amount) {
          return '+/u/reddtipbot ' + amount + ' RDD';
        }
      }, {
        name: 'BTC',
        unit: 'Satoshi',
        count: 50000000,
        tip: function(amount) {
          return '/u/changetip ' + amount + ' satoshi public';
        }
      }
    ];
  }.property(),

  totals: function() {
    var ratio = (parseInt(this.get('percentage')) / 100);
    return this.get('coins').map(function(coin) {
      return {
        coin: coin,
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
        amount: amount,
        tip: total.coin.tip(amount)
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
    console.log('user', this.get('user'));
    return this.get('comments').findProperty('author', this.get('user.name'));
  }.property('user', 'comments.@each.author'),

  actions: {
    makeRequest: function() {
      alert('yo');
    }
  }
});
