import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

export default Router.map(function() {
  this.resource('ubi', function() {
    this.route('thread', {path: '/:thread_id'});
  });
  this.resource('multisig', function() {
    this.route('thread', {path: '/:thread_id'}, function() {
      this.route('enroll');
    });
  });
  this.resource('r', function() {
    this.resource('subreddit', {path: '/:subreddit'}, function() {
      this.route('new');
      this.resource('wiki', function() {
        this.route('page', {path: '/:page'});
      });
      this.resource('thread', {path: '/:thread_id'}, function() {
        this.resource('comments', function() {
          this.route('sign');
          this.route('ubi');
        });
      });
    })
  });
  this.route('privacy');
  this.route('about');
});
