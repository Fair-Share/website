/* globals require */
import Ember from 'ember';
import WalletMixin from 'fairshare-site/mixins/wallet';

var bitcore = require('bitcore');
var Message = require('bitcore-message');

export default Ember.Service.extend(WalletMixin, {
  crypto: Ember.inject.service(),
  chainso: Ember.inject.service(),
  currency: 'btc',
  Message: bitcore.Message,
  Address: bitcore.Address,
  PublicKey: bitcore.PublicKey,
  PrivateKey: bitcore.PrivateKey,
  Transaction: bitcore.Transaction,
  unspent: [],

  checkPassWait: Ember.computed.alias('auth.checkPassWait'),

  message: function(input) {
    return new Message(input);
  },

  publicKey: function(input) {
    return new bitcore.PublicKey(input);
  },

  privateKey: function(input) {
    return new bitcore.PrivateKey(input);
  },

  address: function(input) {
    return new bitcore.Address(input);
  },

  transaction: function(input) {
    return new bitcore.Transaction(input);
  },

  unspentOutput: function(input) {
    return new bitcore.Transaction.UnspentOutput(input);
  },

  postTransaction: function(transaction) {
    return Ember.RSVP.resolve(Ember.$.ajax({
      method: 'post',
      url: 'https://blockchain.info/pushtx?cors=true',
      data: {
        tx: transaction + ''
      }
    }).then(function(response) {
      console.log('blockchain response', response);
      return response;
    }));
  },

  getUnspentOutputs: function(address) {
    return this.get('chainso').getTxUnspent(address).then(function(unspent) {
      return unspent.map(function(tx) {
        return this.unspentOutput({
          txid: tx.txid,
          satoshis: tx.value,
          vout: tx.output_no,
          script: tx.script_hex
        });
      }.bind(this)).sortBy('satoshis').reverse();
    }.bind(this)).catch(function(err) {
      console.error('getUnspentOutputs', address, err);
      return [];
    });
  },

  updateBalance: function() {
    var address = this.get('myAddress');
    if (!address) {return;}
    return Ember.RSVP.hash({
      addressData: this.get('chainso').getAddress(address),
      unspent: this.getUnspentOutputs(address)
    }).then(this.setProperties.bind(this));
  }.observes('myAddress'),

  balance: function() {
    return parseInt((this.get('addressData.balance')||'').replace('.', ''));
  }.property('addressData.balance'),

  balanceDisplay: function() {
    var balance = this.get('balance') || 0;
    return (balance/100000000).toFixed(8) + ' btc';
  }.property('balance'),

  sendTo: function(dest, amount) {
    var address = this.get('myAddress');
    var myPrivateKey = this.get('myPrivateKey');
    if (!address) {return;}
    var transaction = this.transaction().to(dest, amount).change(address);
    return this.getUnspentOutputs(address).then(function(uxto) {
      var totalInputs = 0;
      var tx;
      while (totalInputs < amount) {
        tx = uxto.popObject();
        if (!tx) {
          alert('Insufficient inputs');
          return;
        }
        totalInputs += tx.satoshis;
        transaction.from(tx);
      }
      transaction.sign(myPrivateKey);
      return this.postTransaction(transaction).then(function(result) {
        console.log('postTransaction result', result);
        alert('Sent ' + amount + ' to ' + address);
      }).catch(function(err) {
        console.error('error', err);
        alert(err.responseText);
        throw err;
      }).then(this.updateBalance.bind(this));
    }.bind(this));
  },

  _checkPassPhrase: function() {
    var phrase = this.get('auth.passPhrase');
    if (!phrase) {return;}
    var hash = this.get('crypto').sha256(phrase);
    var privateKey = this.privateKey(hash);
    var publicKey = this.publicKey(privateKey);
    this.get('chainso').getAddress(publicKey.toAddress()).then(function(data) {
      if (data.total_txs) {
        if (phrase === this.get('auth.passPhrase')) {
          this.set('auth.passPhraseRepeat', phrase);
        }
      }
    }.bind(this));
  },

  checkPassPhrase: function() {
    Ember.run.debounce(this, this._checkPassPhrase, this.get('checkPassWait'));
  }.observes('auth.passPhrase')
});
