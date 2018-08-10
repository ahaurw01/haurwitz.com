'use strict';

// Redirect to an old blog post if the url hash looks like that's what's up.

function getPostUrlFromHash(hash) {
  switch (hash) {
    case '#!/posts/raspberry-pi-docker-swarm-with-lets-encrypt':
      return 'https://github.com/ahaurw01/haurwitz.com/blob/master/archives/posts/2017-06-10_rpi-swarm.md';
    case '#!/posts/ux-analytics-with-emberjs':
      return 'https://github.com/ahaurw01/haurwitz.com/blob/master/archives/posts/2014-08-23_ux-analytics-with-emberjs.md';
    case '#!/posts/were-building-too-much':
      return 'https://github.com/ahaurw01/haurwitz.com/blob/master/archives/posts/2013-12-8_were-building-too-much.md';
    case '#!/posts/fun-with-backburnerjs':
      return 'https://github.com/ahaurw01/haurwitz.com/blob/master/archives/posts/2013-10-14_fun-with-backburner-js.md';
    case '#!/posts/growllike-notifications-with-emberjs':
      return 'https://github.com/ahaurw01/haurwitz.com/blob/master/archives/posts/2013-09-02_growl-like-notifications.md';
    case '#!/posts/using-disqus-with-emberjs':
      return 'https://github.com/ahaurw01/haurwitz.com/blob/master/archives/posts/2013-08-24_using-disqus-with-emberjs.md';
    case '#!/posts/making-your-ajax-webapp-crawlable':
      return 'https://github.com/ahaurw01/haurwitz.com/blob/master/archives/posts/2013-08-11_making-your-ajax-webapp-crawlable.md';
    case '#!/posts/first':
      return 'https://github.com/ahaurw01/haurwitz.com/blob/master/archives/posts/2013-08-10_first.md';
    default:
      return null;
  }
}

var url = getPostUrlFromHash(window.location.hash);
if (url) window.location = url;
