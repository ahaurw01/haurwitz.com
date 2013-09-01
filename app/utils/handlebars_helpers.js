'use strict';

var showdown = new Showdown.converter();

Ember.Handlebars.registerBoundHelper('markdown', function (input) {
  return new Handlebars.SafeString(showdown.makeHtml(input));
});

Ember.Handlebars.registerBoundHelper('date', function (date) {
  return moment(date).format('MMMM Do, YYYY');
});