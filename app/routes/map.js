'use strict';

var App = require('app');

App.Router.map(function () {
  this.resource('posts');
  this.resource('post', { path: 'posts/:post_id' });
  this.resource('demos', function () {
    this.route('notifications');
  });
});