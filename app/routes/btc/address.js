import Ember from 'ember';

export default Ember.Route.extend({
  model: function(args) {
    return Ember.$.ajax({
      url: 'https://chain.so/api/v2/address/btc/' + args.address
    }).then(function(data) {
      console.log('data', data);
      return data.data;
    });
  }
});
