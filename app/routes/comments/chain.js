import Ember from 'ember';

export default Ember.Route.extend({
  auth: Ember.inject.service(),
  bitcore: Ember.inject.service(),

  user : Ember.computed.alias('auth.user'),

  model: function(args) {
    var address = this.get('auth.address') || '1QH81rDQRjyUa2zfT9UfA7rnPnwwstVNU5';
    return Ember.$.ajax({
      url: 'https://chain.so/api/v2/address/btc/' + address
    }).then(function(data) {
      return data.data;
    }).then(function(data) {
      return Ember.$.ajax({
        url: 'https://chain.so/api/v2/get_tx_unspent/BTC/' + address
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
  },

  actions: {
    postTransaction: function() {
      if (!confirm('Are you sure?')) {return;}
      var controller = this.controllerFor('comments.chain');
      var transaction = controller.get('transaction');
      if (!controller.get('isDistributing')) {return;}
      transaction.sign(this.get('auth.privateKey'));
      this.get('bitcore').postTransaction(transaction.toString()).then(function(response) {
        alert('Submitted: ' + response);
      }).catch(function(err) {
        console.error('post error', err);
        alert(err.responseText);
      });
    }
  }
});
