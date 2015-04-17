import Ember from 'ember';

export default Ember.Route.extend({
  redirect: function() {
    var posts = this.modelFor('ubi');
    this.transitionTo('ubi.thread', posts[0]);
  }
});
