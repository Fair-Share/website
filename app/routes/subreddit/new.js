import IndexRoute from 'fairshare-site/routes/subreddit/index';

export default IndexRoute.extend({
  listing: 'new',
  renderTemplate: function() {
    this.render('subreddit/index');
  }
});
