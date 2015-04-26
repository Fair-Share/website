import Ember from 'ember';
import client from 'fairshare-site/client';

export default Ember.Route.extend({
  model: function(args) {
    return client('/r/' + args.subreddit + '/about.json').get({}, {
      bypassAuth: true
    }).then(function(result) {
      result.data.subreddit = result.data.display_name;
      return result.data;
    });
  }/*,
  afterModel: function(model) {
    return client('/r/' + model.subreddit + '/wiki/roll.json').get({}, {
      bypassAuth: true
    }).then(function(result) {
      if (!result.data) {return;}
      var parsed = Ember.$(result.data.content_html);
      Ember.set(model, 'roll', parsed.find('li').toArray().map(function(el) {
        el = Ember.$(el);
        console.log('el', el);
        var user = el.find('a:first').text().split('/').pop();
        var pubKey = el.find('em').text();
        var sig = el.find('a:last').text();
        return {
          user: user,
          publicKey: pubKey,
          signature: sig
        };
      }));
    });
  }**/
});
