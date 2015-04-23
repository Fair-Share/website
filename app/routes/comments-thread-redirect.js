import Ember from 'ember';

export default Ember.Route.extend({
  model: function(args) {
    return args.thread_id;
  },

  redirect: function(model) {
    var subreddit = this.modelFor('subreddit');
    this.transitionTo('/r/' + subreddit.display_name + '/' + model);
  }
})
