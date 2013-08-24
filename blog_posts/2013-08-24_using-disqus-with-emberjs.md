{{{
  "title": "Using Disqus with Ember.js",
  "date": "Aug 24, 2013"
}}}

Out of the box, Disqus is made to work with request/response websites that load a fresh html document for every page of the site. That doesn't mean that it can't work with an ajax webapp that refreshes only part of the DOM whenever changing pages. Here's how I have accomplished it with my ember.js-powered blog to add no-maintenance commenting. Even if you are an Angular fanboi, or (heaven forbid) one of those savage jQuery do-it-yourselfers, the concepts here will apply to you too. You'll just have to figure out the equivalent hooks in your framework/library of choice. Be strong; be brave.<!--more-->

### Disqus: the easy road

Here's their official code documentation on how to spin up a Disqus thread on your page.

```
<div id="disqus_thread"></div>
<script type="text/javascript">
  /* * * CONFIGURATION VARIABLES: EDIT BEFORE PASTING INTO YOUR WEBPAGE * * */
  var disqus_shortname = 'your-short-name'; // required: replace example with your forum shortname

  /* * * DON'T EDIT BELOW THIS LINE * * */
  (function() {
    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  })();
</script>
<noscript>Please enable JavaScript to view the <a href="http://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
<a href="http://disqus.com" class="dsq-brlink">comments powered by <span class="logo-disqus">Disqus</span></a>
```

First, everybody have a good LOL at being told we need to include a link advertising Disqus. After that's out of the way, you may note the following:

- You need a div with the id `disqus_thread`.
- You need to define a global variable (ugh) with the name `disqus_shortname`.
- Some script is retrieved that contains magical incantations that will apparently turn your `disqus_thread` div into a sexy comment section.

Just an aside: they recommend putting in this `<noscript>` tag for folks who don't have javascript enabled. Then they expect these same weirdos to click on a link to take them to some site that is urging them to enable javascript. Yeah, ok.

This official approach works just fine when you only need that script to sprinkle its pixie dust once, but what if you want it to re-initialize that `disqus_thread` over and over?

### Reloading Disqus

In a [dusty corner](http://help.disqus.com/customer/portal/articles/472107-using-disqus-on-ajax-sites) of the disqus site, they make mention of this API:

```
DISQUS.reset({
  reload: true,
  config: function () {  
    this.page.identifier = "newidentifier";  
    this.page.url = "http://example.com/#!newthread";
  }
});
```

Critiquing this API is outside the scope of this post, but let's leave it at noticing the following:

- You must supply the `this.page.identifier` and `this.page.url` variables inside the `config` function.
- A `#!` is the required hash separator in your url.

### The recipe for Ember.js

TL;DR - Good, you've come to the right section. Code first, explanation later.

```
App.DisqusView = Ember.View.extend({
  elementId: 'disqus_thread',
  tagName: 'div',
  didInsertElement: function () {
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
});
```

Within a handlebars template, you would use this view in the following way.

```
{{! controller.content is the post I care about }}
{{view App.DisqusView postBinding="controller.content"}}
```

Ok, here's what happened. Whenever ember renders this view, it will spit out a div with the id `disqus_thread` due to the `tagName` and `elementName` properties above. `didInsertElement` is a lifecycle hook that an ember view will call when it has been rendered in the DOM. We've provided two logic paths here inside of this hook. Look at the `else` condition first to see how we need to get started for the first time.

Actually before that, read up on the meaning of the Disqus configuration variables [here](http://help.disqus.com/customer/portal/articles/472098-javascript-configuration-variables). When Disqus loads for the first time, it requires your configuration to be defined in the form of global variables. Don't worry - their $200 fine for littering is in the mail. You *must* define the `disqus_shortname` variable, or else nothing will load. The rest is icing, but actually pretty necessary to have meaningful comment threads. Maybe you could think of it as a three-year-old's birthday party: if there's no icing, you're gonna have some tears.

Ok, so back to the code. If the script has never loaded, we do so in the officially prescribed way. On subsequent renderings of this div, though, `window.DISQUS` is defined and we get to make use of that beautiful `DISQUS.reset()` API. If you try to re-run the script instead of using the `reset()` capability, Disqus will let you hear it through the console; it is only made to be intialized once.

The `didInsertElement` hook is useful for me, since this view gets re-rendered every time a post is rendered. If that is not the case, you could always attach an observer to your post object to see when it changes and do you Disqus logic there. For example,

```
App.DisqusView = Ember.View.extend({
  ...
  postDidChange: function () {
    if (window.DISQUS) {
      ...
    } else {
      ...
    }
  }.observes('post')
})
```

### Postscript tidbits

Testing this out with a buddy of mine, we noticed that he was not able at first to leave a comment, and could only do so after enabling third-party cookies on his browser. Disqus makes you sign in either with an official Disqus account or some other service like Facebook, Twitter, or Google, which ultimately uses cookies to manage your session. 

This makes me feel a little better, though, knowing the reason my thousands of readers are not leaving comments is due to them turning off their third-party cookies.