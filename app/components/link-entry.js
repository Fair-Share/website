import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['media'],
  thumbnail: function() {
    var thumb = this.get('item.thumbnail');
    if (['default', 'self'].contains(thumb)) {return;}
    return thumb;
  }.property('item.thumbnail')
});
