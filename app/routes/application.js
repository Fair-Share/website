/* globals moment,window */
import Ember from 'ember';
import client from 'fairshare-site/client';

function getParamByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash.replace(/^#/, '?'));
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export default Ember.Route.extend({
  model: function() {
    var code = getParamByName('access_token');
    if (code) {
      this.controllerFor('application').set(
        'loginExpires',
        moment().add(parseInt(getParamByName('expires_in')), 'second')
      );

      return client.auth(code).then(function() {
        return client('/api/v1/me').get();
      }).then(function(res) {
        this.growl.info([
          '<h1>Logged in as',res.name,'</h1>'
        ].join('\n'));
        return res;
      }.bind(this));
    }
    this.growl.info([
      '<h1>Welcome to <em>V for reddit</em></h1><div class="message">',
      '<p>This is still an early and incomplete alpha!</p></div>'
    ].join('\n'), {
      closeIn: 6000
    });
  },

  redirect: function(model) {
    if (model) {
      this.transitionTo('ubi');
    }
  },

  actions: {
    logout: function() {
      client.deauth().then(function() {
        this.controllerFor('application').set('user', null);
      }.bind(this)).catch(function(e) {
        console.error(e.stack || e);
        alert("Logout is broken due to a Snoocore bug, but if you refresh I forget your token.  So I'll do that now");
        window.location.reload();
      });
    }
  }
});
