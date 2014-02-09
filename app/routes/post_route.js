'use strict';

module.exports = Ember.Route.extend({
  afterModel: function (model) {
    // GA tracking
    if (window.ga) {
      window.ga('send', 'event', 'view', 'post', model.get('id'));
    }
  }
});