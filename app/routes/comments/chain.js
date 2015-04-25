import Ember from 'ember';

export default Ember.Route.extend({
  bitcore: Ember.inject.service(),
  user : Ember.computed.alias('auth.user'),

  model: function(args) {
    return Ember.$.ajax({
      url: 'https://chain.so/api/v2/address/btc/1QH81rDQRjyUa2zfT9UfA7rnPnwwstVNU5'
    }).then(function(data) {
      return data.data;
    }).then(function(data) {
      return Ember.$.ajax({
        url: 'https://chain.so/api/v2/get_tx_unspent/BTC/1QH81rDQRjyUa2zfT9UfA7rnPnwwstVNU5'
      }).then(function(result) {
        data.unspent = result.data.txs.map(function(tx) {
          tx.value = parseInt(tx.value.replace('.', ''));
          return tx;
        });
        return data;
      });
    });
  },

  setupController: function(controller, model) {
    controller.setProperties({
      model: this.modelFor('thread'),
      escrow: model
    });
  },

  renderTemplate: function() {
    this.render({
      into: 'thread'
    });
  }
});
