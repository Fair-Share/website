import Ember from 'ember';
export default Ember.Route.extend({
  redirect: function() {
    var post = this.modelFor('thread');
    if ((post.title || '').match(/#[0-9]* - /)) {
      return this.transitionTo('comments.ubi');
    }
    this.transitionTo('comments');
  }
});
