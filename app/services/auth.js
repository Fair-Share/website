/* globals moment */
import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Service.extend({
  bitcore: Ember.inject.service(),

  /*
    checkPassWait is how long in ms to wait for passPhrase to stop changing
    after this interval it will built an address fron the passPhrase and check
    for transaction history.  Valid transaction history means a good login
    Checking too often may be a security risk as it can be a path to building
    up the early parts of the phrase
  */
  checkPassWait: 3145,


  loginUrl: function() {
    return client.getImplicitAuthUrl();
  }.property('user'),
  loginExpiry: function() {
    return this.get('loginExpires');
  }.property('loginExpires', 'timeupdater.currentMoment'),

  passPhrase: '',
  passPhraseRepeat: function(key, value) {
    if (arguments.length > 1) {return value;}
    return '';
  }.property('passPhrase'),

  _checkPassPhrase: function() {
    var phrase = this.get('passPhrase');
    if (!phrase) {return;}
    var hash = this.get('bitcore').sha256(phrase);
    var privateKey = this.get('bitcore').privateKey(hash);
    var publicKey = this.get('bitcore').publicKey(privateKey);
    this.get('bitcore').getBalance(publicKey.toAddress()).then(function(data) {
      if (data.total_txs) {
        if (phrase === this.get('passPhrase')) {
          this.set('passPhraseRepeat', phrase);
        }
      }
    }.bind(this));
  },

  checkPassPhrase: function() {
    Ember.run.debounce(this, this._checkPassPhrase, this.get('checkPassWait'));
  }.observes('passPhrase'),

  username: function() {
    var username = this.get('user.name');
    if (!username) {return 'anonymous';}
    return username;
  }.property('user.name'),

  matchingPassPhrase: function() {
    if (this.get('passPhrase') === this.get('passPhraseRepeat')) {
      return this.get('passPhrase');
    }
  }.property('passPhrase', 'passPhraseRepeat'),

  hashedPassPhrase: function() {
    var phrase = this.get('matchingPassPhrase');
    if (!phrase) {return;}
    return this.get('bitcore').sha256(phrase);
  }.property('matchingPassPhrase'),

  privateKey: function() {
    var hashed = this.get('hashedPassPhrase');
    if (!hashed) {return;}
    return this.get('bitcore').privateKey(hashed);
  }.property('hashedPassPhrase'),

  publicKey: function() {
    var privateKey = this.get('privateKey');
    if (!privateKey) {return;}
    return this.get('bitcore').publicKey(privateKey);
  }.property('privateKey'),

  address: function() {
    var publicKey = this.get('publicKey');
    if (!publicKey) {return;}
    return publicKey.toAddress();
  }.property('publicKey'),

  balance: function() {
    return parseInt((this.get('addressData.balance')||'').replace('.', ''));
  }.property('addressData.balance'),

  balanceBtc: function() {
    var balance = this.get('balance') || 0;
    console.log('balance', balance);
    return (balance/100000000).toFixed(8);
  }.property('balance'),

  unspent: [],

  updateBalance: function() {
    var address = this.get('address');
    if (address) {
      Ember.$.ajax({
        url: 'https://chain.so/api/v2/address/btc/' + address
      }).then(function(data) {
        console.log('data', data);
        this.set('addressData', data.data);
      }.bind(this));
      this.get('bitcore').getUnspentOutputs(address).then(function(unspent) {
        this.set('unspent', unspent);
      }.bind(this));
    }
  }.observes('address'),

  addressString: function() {
    var address = this.get('address');
    if (!address) {return;}
    return address.toString();
  }.property('address'),

  dateMessage: function(message) {
    return [
      message,
      '---',
      "# [[pressiah button]](https://zh.reddit.com/api/v1/authorize?client_id=UA_O1fRBjh7_lQ&state=884&redirect_uri=https%3A%2F%2Fmodlog.github.io%2F%23%2F%3F&response_type=token&scope=submit) accept transparency with the red pill",
      "Keep [trying](https://zh.reddit.com/r/SubredditDrama/comments/quq7n/mods_connected_to_srs_and_moderator_of/c40nyr3) the impossible [removed] data will be assimilated Moderator resistance is futile /r/botsrights",
      '---',
      '^([美国鬼子ಠ_ಠ](https://zh.reddit.com/domain/zh.reddit.com) /r/go1dfish /u/go1dfish/m/readme /u/go1dfish/m/fairshare)'
    ].join('\n\n');
  },

  signMessage: function(message) {
    var datedMessage = this.dateMessage(message);
    var privateKey = this.get('privateKey');
    var address = this.get('address');
    if (!address) {return;}
    message = this.get('bitcore').normalizeMarkdown(datedMessage);
    var signature = this.get('bitcore').signMessage(message, privateKey);
    var markdown =  [
      '**[^^^^(' + address + ')](https://fair-share.github.io/#/btc/addr/' + address + ')**',
      datedMessage,
      '*^^^^(' + signature + ')*'
    ].join('\n\n');
    return {
      dated: datedMessage,
      signature: signature,
      markdown: markdown
    };
  },

  updateUserData: function() {
    if (!this.get('user')) {return;}
    client('/api/v1/me').get().then(function(user) {
      this.set('user', user);
    }.bind(this)).catch(function() {
      this.growl.alert([
        '<div class="message">Logged out</div>'
      ].join('\n'), {clickToDismiss: true});
      this.set('user', null);
    }.bind(this));
  }.observes('timeupdater.currentMoment'),

  sendBtc: function(dest, amount) {
    var bitcore = this.get('bitcore');
    var address = this.get('address');
    var privateKey = this.get('privateKey');
    if (!address) {return;}
    var transaction = bitcore.transaction().to(dest, amount).change(address);
    return bitcore.getUnspentOutputs(address).then(function(uxto) {
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
      transaction.sign(privateKey);
      return bitcore.postTransaction(transaction).then(function(result) {
        console.log('postTransaction result', result);
        alert('Sent ' + amount + ' to ' + address);
      }).catch(function(err) {
        console.error('error', err);
        alert(err.responseText);
        throw err;
      }).then(this.updateBalance.bind(this));
    }.bind(this));
  }
});
