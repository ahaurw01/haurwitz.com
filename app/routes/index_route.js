'use strict';

module.exports = Ember.Route.extend({
  redirect: function () {
    this.transitionTo('posts');
  }
});