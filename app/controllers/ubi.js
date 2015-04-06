import Ember from 'ember';

export default Ember.ObjectController.extend({
  ubiPool: 30000000,
  percentage: 10,
  total: function() {
    return parseInt(parseInt(this.get('ubiPool')) * (this.get('percentage') / 100));
  }.property('ubiPool', 'ratio'),
  fairShare: function() {
    var count = this.get('beneficiaries.length');
    if (!count) {return this.get('total')};
    return Math.floor(this.get('total') / count);
  }.property('beneficiaries.length', 'total')
});
