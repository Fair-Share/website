import Ember from 'ember';

export default Ember.Mixin.create({
  auth: Ember.inject.service(),
  bitcore: Ember.inject.service(),

  unspent: [],
  totalDistribution: 0,
  minimumFairShare: 5430, // https://github.com/bitcoin/bitcoin/pull/2577

  fromAddress: null,
  toAddresses: [],

  transaction: function() {
    return this.transactionForShareAmount(this.get('fairShare'), this.get('minerFee'));
  }.property('toAddresses.@each', 'fromAddress', 'fairShare', 'toSpend'),

  fairShare: function() {
    var addresses = this.get('toAddresses');
    if (!addresses.length) {return 0;}
    return Math.floor(this.get('totalMinusFees') / addresses.uniq().length);
  }.property('toAddresses.@each', 'totalMinusFees'),

  totalMinusFees: function() {
    return this.get('totalDistribution') - this.get('minerFee');
  }.property('totalDistribution', 'minerFee'),

  minerFee: function(key, value) {
    if (arguments.length > 1) {return parseInt(value);}
    return this.transactionForShareAmount(1).getFee();
  }.property('toAddresses.@each', 'toSpend.@each'),

  toSpend: function() {
    var unspent = this.get('unspent').sortBy('satoshis');
    var toSpend = [];
    var amount = 0;
    var needed = this.get('totalDistribution');
    var bigTxs = unspent.filter(function(tx) {
      return tx.satoshis > needed;
    });
    var tx;
    if (bigTxs.length) {return [bigTxs[0]];}
    while (amount < needed) {
      tx = unspent.popObject();
      amount += tx.satoshis;
      toSpend.pushObject(tx);
    }
    return toSpend;
  }.property('unspent.@each', 'totalDistribution'),

  totalInputs: function() {
    var inputs = 0;
    (this.get('transactionObj.inputs') || []).forEach(function(input) {
      inputs += input.output.satoshis;
    });
    return inputs;
  }.property('transactionObj.inputs.@each'),

  totalOutputs: function() {
    var outputs = 0;
    (this.get('transactionObj.outputs') || []).forEach(function(output) {
      outputs += output.satoshis;
    });
    return outputs;
  }.property('transactionObj.outputs.@each.satoshis'),

  transactionForShareAmount: function(amount, fee) {
    var transaction = this.get('bitcore').transaction();
    var fromAddress = this.get('fromAddress');
    transaction.from(this.get('toSpend'));
    this.get('toAddresses').uniq().forEach(function(address) {
      transaction.to(address, amount);
    });
    transaction.change(fromAddress);
    if (fee) {transaction.fee(fee);}
    return transaction;
  },

  transactionObj: function() {
    var transaction = this.get('transaction');
    if (!transaction) {return;}
    var obj = transaction.toObject();
    return obj;
  }.property('transaction'),

  transactionString: function( ){
    var transaction = this.get('transaction');
    if (!transaction) {return;}
    return transaction.toString();
  }.property('transaction'),

  transactionJsonString: function() {
    return JSON.stringify(this.get('transactionObj'), null, 1);
  }.property('transactionObj'),

  isValid: function() {
    return this.get('fairShare') > this.get('minimumFairShare');
  }.property('fairShare', 'minimumFairShare')
});
