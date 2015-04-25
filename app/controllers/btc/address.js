import Ember from 'ember';
import CommentMixin from 'fairshare-site/mixins/comment';

export default Ember.Controller.extend({
  auth: Ember.inject.service(),
  isMine: function() {
    return (this.get('auth.address') + '') === this.get('model.address');
  }.property('auth.address', 'model.address')
});
