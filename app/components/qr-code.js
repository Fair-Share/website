/* globals QRCode */
import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['qr-code'],
  value: '',

  qrCode: function() {
    return new QRCode(this.get('element'), this.get('value'));
  }.property(),

  drawCode: function() {
    this.get('qrCode');
  }.on('didInsertElement')
});
