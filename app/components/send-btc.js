import Ember from 'ember';

export default Ember.Component.extend({
  auth: Ember.inject.service(),
  bitcore: Ember.inject.service(),
  amount: '',
  dest: '',

  placeholder: function(key, value) {
    if (arguments.length > 1) {return value;}
    var balance = this.get('auth.balance');
    if (!balance) {return 'No balance available!';}
    return balance + ' available';
  }.property('auth.balance'),

  isValid: function() {
    var amount = parseInt(this.get('amount'));
    var dest = this.get('dest') || '';
    if (!amount) {return false;}
    if (amount > this.get('auth.balance')) {
      return false;
    }
    return this.get('bitcore').Address.isValid(dest);
  }.property('amount', 'dest'),

  actions: {
    send: function() {
      var dest = this.get('dest');
      var amount = parseInt(this.get('amount'));
      if (!dest || !amount) {return;}
      if (!confirm('Are you sure?')) {return;}
      this.get('auth').sendBtc(dest, amount).then(function() {
        this.setProperties({
          placeholder: 'Sent ' + amount + ' satoshi',
          amount: ''
        });
      }.bind(this));
    }
  }

});
