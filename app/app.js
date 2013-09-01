'use strict';

var App = Ember.Application.create();

App.Store = DS.Store.extend({
  adapter: DS.RESTAdapter.extend({
    namespace: 'rest'
  })
});

var get = Ember.get, set = Ember.set;

Ember.Location.registerImplementation('hashbang', Ember.HashLocation.extend({
  getURL: function () {
    return get(this, 'location').hash.substr(2);
  },

  setURL: function (path) {
    get(this, 'location').hash = '!' + path;
    set(this, 'lastSetURL', '!' + path);
  },

  onUpdateURL: function (callback) {
    var self = this;
    var guid = Ember.guidFor(this);

    Ember.$(window).bind('hashchange.ember-location-' + guid, function () {
      Ember.run(function() {
        var path = location.hash.substr(2);
        if (get(self, 'lastSetURL') === path) { return; }
        set(self, 'lastSetURL', null);
        callback(path);
      });
    });
  },

  formatURL: function (url) {
    return '#!' + url;
  }
}));

App.Router.reopen({
  location: 'hashbang'
});

module.exports = App;