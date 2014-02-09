/* jshint camelcase: false */
/* global disqus_shortname, disqus_identifier, disqus_url, disqus_title */

'use strict';

module.exports = Ember.View.extend({
  elementId: 'disqus_thread',
  tagName: 'div',
  didInsertElement: function () {
    // Only spin up disqus if not in dev mode
    if (window.location.toString().split('#')[0].indexOf('localhost') < 0) {
      if (window.DISQUS) { // Simply reload disqus
        var id = this.get('post.id'),
            title = this.get('post.title');
        DISQUS.reset({
          reload: true,
          config: function () {
            this.page.identifier = id;
            this.page.title = title;
            this.page.url = window.location.toString();
          }
        });
      } else {
        window.disqus_shortname = 'haurwitz';
        window.disqus_identifier = this.get('post.id');
        window.disqus_url = window.location.toString();
        window.disqus_title = this.get('post.title');
        var dsq = document.createElement('script');
        dsq.type = 'text/javascript';
        dsq.async = true;
        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      }
    }
  }
});