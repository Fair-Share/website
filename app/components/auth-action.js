import Ember from 'ember';

export default Ember.Component.extend({
  auth: Ember.inject.service(),

  click: function() {
    this.sendAction('action');
  },

  actions: {
    doAction: function() {
      this.sendAction('action');
    }
  }
});
