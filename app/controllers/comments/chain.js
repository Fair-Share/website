import Ember from 'ember';
import CommentMixin from 'fairshare-site/mixins/comment';

export default Ember.Controller.extend({
  auth: Ember.inject.service(),
  bitcore: Ember.inject.service(),
  user : Ember.computed.alias('auth.user'),

  percentage: 10,

  isDistributing: function() {
    return this.get('escrow.address') === this.get('auth.addressString');
  }.property('escrow.address', 'auth.addressString'),

  totalDistribution: function() {
    return Math.floor((parseInt(this.get('percentage')) / 100) * this.get('balance'));
  }.property('percentage', 'balance'),

  balance: function() {
    var balance = 0;
    this.get('unspent').forEach(function(tx) {
      balance += tx.satoshis;
    });
    return balance;
  }.property('escrow.balance'),

  unspent: Ember.computed.map('escrow.unspent', function(tx) {
    return this.get('bitcore').unspentOutput({
      txid: tx.txid,
      satoshis: tx.value,
      vout: tx.output_no,
      script: tx.script_hex
    });
  }),

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
  }.property('unspent.@each.satoshis'),

  totalInputs: function() {
    var inputs = 0;
    (this.get('transactionObj.inputs') || []).forEach(function(input) {
      inputs += input.output.satoshis;
    });
    return inputs;
  }.property('transactionObj.inputs.@each.output.satoshis'),

  totalOutputs: function() {
    var outputs = 0;
    (this.get('transactionObj.outputs') || []).forEach(function(output) {
      outputs += output.satoshis;
    });
    return outputs;
  }.property('transactionObj.outputs.@each.satoshis'),

  fairShare: function() {
    return Math.floor(this.get('totalDistribution') / this.get('uniqueSignatures.length'));
  }.property('totalDistribution', 'uniqueSignatures.length'),

  commentItems: Ember.computed.map('model.comments', function(comment) {
    return Ember.Object.createWithMixins(CommentMixin, {
      comment: comment,
      container: this.get('container')
    });
  }),

  signedItems: Ember.computed.filterProperty('commentItems', 'isSigned', true),

  rawSignatories: Ember.computed.mapBy('signedItems', 'comment.author'),
  signatories: Ember.computed.uniq('rawSignatories'),
  uniqueSignatures: Ember.computed.map('signatories', function(username) {
    return this.get('signedItems').findProperty('comment.author', username);
  }),

  transaction: function() {
    var transaction = this.get('bitcore').transaction();
    var fairShare = this.get('fairShare');
    transaction.from(this.get('toSpend'));
    this.get('uniqueSignatures').forEach(function(item) {
      transaction.to(item.get('address'), fairShare);
    });
    transaction.change(this.get('escrow.address'));
    return transaction;
  }.property('uniqueSignatures.@each', 'toSpend.@each', 'fairShare', 'auth.privateKey', 'isAuthorized'),

  minerFee: function() {
    return this.get('transaction').getFee();
  }.property('transaction'),

  change: function() {
    return this.get('totalOutputs') - this.get('minerFee') - this.get('totalDistribution');
  }.property('minerFee', 'totalOutputs', 'totalDistribution'),

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
  }.property('transactionObj')
});
