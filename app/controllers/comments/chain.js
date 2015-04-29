import Ember from 'ember';
import CommentsMixin from 'fairshare-site/mixins/comments';
import FairShareTx from 'fairshare-site/mixins/fairshare-tx';

export default Ember.Controller.extend(CommentsMixin, FairShareTx, {
  user : Ember.computed.alias('auth.user'),

  fromAddress: Ember.computed.alias('escrow.address'),
  toAddresses: Ember.computed.mapBy('uniqueSignatures', 'address'),

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
  })
});
