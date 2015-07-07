import Ember from 'ember';

function api(path) {return 'https://chain.so/api/' + path;}

export default Ember.Service.extend({
  coins: ['doge', 'nyan', 'rdd', 'ltc', 'pot'],

  getPrice: function(currency, dest) {
    dest = (dest || 'BTC').toUpperCase();
    return Ember.RSVP.resolve(Ember.$.ajax({
      url: api('v2/get_price/' + currency)
    })).then(function (result) {
      return result.data.prices.findProperty('price_base', dest);
    }).then(function(data) {return data.price;});
  },

  getPrices: function(coins) {
    var promises = {btc: this.getPrice('btc', 'usd')};
    (coins || this.get('coins')).forEach(function(name) {
      promises[name] = this.getPrice(name);
    }.bind(this))
    return Ember.RSVP.hash(promises).then(function(prices) {
      prices.satoshi = '0.00000001';
      return prices;
    });
  },

  getTx: function(txid) {
    return Ember.RSVP.resolve(Ember.$.ajax({
      url: api('v2/get_tx/btc/' + txid)
    })).then(function(data) {return data.data;});
  },

  getTxUnspent: function(address) {
    return Ember.RSVP.resolve(Ember.$.ajax({
      url: api('v2/get_tx_unspent/BTC/' + address)
    })).then(function(result) {
      return result.data.txs.map(function(tx) {
        tx.value = parseInt(tx.value.replace('.', ''));
        return tx;
      });
    });
  },

  getAddress: function(address) {
    return Ember.RSVP.resolve(Ember.$.ajax({
      url: api('v2/address/btc/' + address)
    })).then(function(data) {return data.data;});
  }
});
