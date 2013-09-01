'use strict';

var App = require('app');

/**
 * Load pre-compiled templates to register them with Ember.TEMPLATES
 * using brunch 1.7's require.list().
 */
function registerTemplates() {
  var r = /^templates\/.*/,
      names = window.require.list();

  names.forEach(function (name) {
    if (r.test(name)) {
      require(name);
    }
  });
}

window.App = App;

registerTemplates();

require('models');
require('controllers');
require('views');
require('routes');
require('utils/handlebars_helpers');
