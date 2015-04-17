import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

export default Router.map(function() {
  this.resource('ubi', function() {
    this.route('thread', {path: '/:thread_id'});
  });
  this.route('privacy');
  this.route('about');
});
