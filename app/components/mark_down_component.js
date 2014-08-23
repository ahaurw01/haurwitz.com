'use strict';

module.exports = Ember.Component.extend({
  didInsertElement: function () {
    $('pre code').each(function(i, block) {
      hljs.highlightBlock(block);
    });
  }
});