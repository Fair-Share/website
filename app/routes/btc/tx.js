import Ember from 'ember';

export default Ember.Route.extend({
  model: function(args) {
    return Ember.$.ajax({
      url: 'https://chain.so' + '/api/v2/get_tx/btc/' + args.txid
    }).then(function(data) {
      return data.data;
    });
  }
})
