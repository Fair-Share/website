import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

export default Router.map(function() {
  this.resource('ubi');
  this.resource('r', function() {
    this.resource('subreddit', {path: '/:subreddit'}, function() {
      this.resource('aboutStickyRedirect', {path: '/about/sticky'});
      this.resource('commentsThreadRedirect', {path: '/comments/:thread_id'}, function() {
        this.route('slug', {path: '/:slug'});
      });
      this.route('new');
      this.resource('wiki', function() {
        this.route('page', {path: '/:page'});
      });
      this.resource('thread', {path: '/:thread_id'}, function() {
        this.resource('comments', function() {
          this.route('sign');
          this.route('ubi');
          this.route('chainRedirect', {path: '/chain'});
          this.route('chain', {path: '/chain/:address'});
        });
      });
    });
  });
  this.resource('btc', function() {
    this.route('address', {path: '/addr/:address'});
    this.route('tx', {path: '/tx/:txid'});
  });
  this.route('privacy');
  this.route('about');
});

window.onclick = function(e) {
  e = e || window.event;
  var t = e.target || e.srcElement;
  t = Ember.$(t).closest('a').get(0);
  if (t && t.href && !Ember.$(t).hasClass('dontintercept') && !Ember.$(t).hasClass('ember-view')){
    var parts = t.href.split(window.location.origin, 2);
    if (parts.length <= 1) {
      parts = t.href.split('reddit.com', 2);
    }
    if (parts.length > 1) {
      e.preventDefault();
      try {
        window.location.hash = parts[1];
      } catch(err) {
        console.error(err.stack || err);
      }
      return false;
    }
  }
};
