'use strict';

module.exports = Ember.Route.extend({
  model: function () {
    return this.store.find('post');
  },

  afterModel: function () {
    // GA tracking
    if (window.ga) {
      window.ga('send', 'event', 'view', 'all');
    }
  }
});