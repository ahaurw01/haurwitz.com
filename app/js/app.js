App = Ember.Application.create({
  LOG_TRANSITIONS: true
});

App.Store = DS.Store.extend({
  adapter: DS.RESTAdapter.extend({
    namespace: 'rest'
  })
});

App.Router.map(function () {
  this.resource('posts');
  this.resource('post', { path: 'posts/:post_id' });
});

App.IndexRoute = Ember.Route.extend({
  redirect: function () {
    this.transitionTo('posts');
  }
});

App.PostsRoute = Ember.Route.extend({
  model: function () {
    return App.Post.find();
  }
});

var attr = DS.attr;

App.Post = DS.Model.extend({
  title: attr('string'),
  intro: attr('string'),
  body: attr('string'),
  date: attr('date')
});

var showdown = new Showdown.converter();

Ember.Handlebars.registerBoundHelper('markdown', function (input) {
  return new Handlebars.SafeString(showdown.makeHtml(input));
});

Ember.Handlebars.registerBoundHelper('date', function (date) {
  return moment(date).format('MMMM Do, YYYY');
});