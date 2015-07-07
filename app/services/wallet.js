import Ember from 'ember';

var coins = ['btc'];
var proto = {
  auth: Ember.inject.service(),
  crypto: Ember.inject.service(),
  chainso: Ember.inject.service(),
  
  coins: coins,
  default: coins[0],
  
  main: function(key, value) {
    if (arguments.length > 1) {
      this.set('default', Ember.get(value, 'currency'));
    }
    return this.get(this.get('default'));
  }.property('default'),

  balance: Ember.computed.alias('main.balanceDisplay'),
  address: Ember.computed.alias('main.myAddressString'),

  signMarkdown: function(markdown) {
    return this.get('main').signMarkdown(markdown);
  }
};

coins.forEach(function(coin) {proto[coin] = Ember.inject.service();});

export default Ember.Service.extend(proto);
