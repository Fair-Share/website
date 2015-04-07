import Ember from 'ember';

export default Ember.ObjectController.extend({
  ubiPool: 30000000,
  percentage: 10,
  total: function() {
    return parseInt(parseInt(this.get('ubiPool')) * (this.get('percentage') / 100));
  }.property('ubiPool', 'percentage'),
  beneficiaryCount: function(key, value) {
    if (value) {
      return parseInt(value);
    }
    return this.get('beneficiaries.length');
  }.property('beneficiaries.length'),
  fairShare: function() {
    var count = this.get('beneficiaryCount');
    if (!count) {return this.get('total')};
    return Math.floor(this.get('total') / count);
  }.property('beneficiaryCount', 'total')
});
