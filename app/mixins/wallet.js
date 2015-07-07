import Ember from 'ember';

export default Ember.Mixin.create({
  auth: Ember.inject.service(),
  myHashedPass: Ember.computed.alias('auth.hashedPassPhrase'),

  myPrivateKey: function() {
    var hashed = this.get('myHashedPass');
    if (!hashed) {return;}
    return this.privateKey(hashed);
  }.property('myHashedPass'),

  myPublicKey: function() {
    var privateKey = this.get('myPrivateKey');
    if (!privateKey) {return;}
    return this.publicKey(privateKey);
  }.property('myPrivateKey'),

  myAddress: function() {
    var publicKey = this.get('myPublicKey');
    if (!publicKey) {return;}
    return publicKey.toAddress();
  }.property('myPublicKey'),

  myAddressString: function() {
    var address = this.get('myAddress');
    if (!address) {return;}
    return address.toString();
  }.property('myAddress'),

  signMessage: function(message, privateKey) {
    return this.message(message).sign(privateKey);
  },

  signMarkdown: function(message) {
    var datedMessage = this.get('auth').dateMessage(message);
    var privateKey = this.get('myPrivateKey');
    var address = this.get('myAddress');
    var currency = this.get('currency');
    if (!address) {return;}
    message = this.get('crypto').normalizeMarkdown(datedMessage);
    var signature = this.signMessage(message, privateKey);
    var markdown =  [
      '**[^^^^(' + address + ')](https://fair-share.github.io/#/' + currency + '/addr/' + address + ')**',
      datedMessage,
      '*^^^^(' + signature + ')*'
    ].join('\n\n');
    return {
      dated: datedMessage,
      signature: signature,
      markdown: markdown
    };
  },

  verifySignature: function(message, address, signature) {
    return this.message(message).verify(address, signature);
  },

  isValidAddress: function(address) {
    return this.Address.isValid(address);
  }
});
