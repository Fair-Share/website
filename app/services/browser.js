import Ember from 'ember';

export default Ember.Service.extend({
  isIOS: function() {
    return ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
  }.property()
});
