{{{
  "title": "Making your ajax webapp crawlable",
  "date": "Aug 11, 2013"
}}}

As awesome as Google's crawlbot is, it doesn't view your website like a real human does. If your page requires ajax requests to fire and javascript code to populate the DOM in order to view anything useful, Google won't see that. Here's how I've solved this problem for this blog. <!--more-->

### The official documentation

Google has some [great information](https://developers.google.com/webmasters/ajax-crawling/docs/getting-started) on how to get started in the right direction. They are intimately aware of the problem, especially since one of their prize open source projects, Angular, is plagued by this very problem. In short, they tell you that you need to have all your routing in the url after a hashbang (`#!`) and describe how you need to make your server give back html snapshots of all the routes you want crawlable.

### How this blog does it with ember.js

I know you're like me and want a recipe instead of pouring over official documentation, so here it goes.

Google requires you to have not just a hash (`#`) be the delimiter right before your webapp's route, but a hashbang (`#!`). Ember doesn't support this out of the box, so we need to register a new type of location implementation. Here is it:

```
Ember.Location.registerImplementation('hashbang', Ember.HashLocation.extend({
  getURL: function () {
    return Ember.get(this, 'location').hash.substr(2);
  },

  setURL: function (path) {
    Ember.get(this, 'location').hash = '!' + path;
    Ember.set(this, 'lastSetURL', '!' + path);
  },

  onUpdateURL: function (callback) {
    var self = this;
    var guid = Ember.guidFor(this);

    Ember.$(window).bind('hashchange.ember-location-' + guid, function () {
      Ember.run(function() {
        var path = location.hash.substr(2);
        if (Ember.get(self, 'lastSetURL') === path) { return; }
        Ember.set(self, 'lastSetURL', null);
        callback(path);
      });
    });
  },

  formatURL: function (url) {
    return '#!' + url;
  }
}));
```

This takes the implementation of the HashLocation and extends it to use the characters `#!` instead of just `#`. Once this bit of work is out of they way, make sure your router is taking advantage of your craftsmanship.

```
App.Router.reopen({
  location: 'hashbang'
});
```

Aside: If you're braver than I am, you could totally sidestep the problem of having a hash in your url and making use of the fancy PushState API with `location: 'history'`, but then you have to do a lot more work on your server-side for being able to bookmark or refresh on any route.

You should be able to shuttle around your app like always, except now the tic-tac-toe board is excited.

### How Google crawls your #! urls

You'd find that if you make a request to `http://example.com/#!/categories/bieber-nip-slips`, the server will not receive any information after the `#` character. This is by specification. Google is smart and knows this, so it has a solution. Google reads any url that has a `#!` in it and treats whatever follows as a query parameter. The crawler would make a request instead to `http://example.com?_escaped_fragment_=/categories/bieber-nip-slips`. I'm not kidding - the exact string `_escaped_fragment_`.

In this way, they pass their cleverness on to your server so that your server can see that somebody is crawling your site who won't be able to make the ajax magic happen, but they still really want to see those provocative Bieber pics. It is now up to your server to return some sort of html snapshot of the page that you would normally see if you were a real person with a real browser.

### How I appease the Google gods

So, on to the express-compatible recipe:

```
app.use('/', function (req, res, next) {
  var route = req.query['_escaped_fragment_'];
  if (route !== undefined) {
    var title = _.last(route.split('/')),
        html;
    if (title === 'posts' || title === '') {
      html = crawlerRenderer.renderAllPosts(posts);
    } else {
      html = crawlerRenderer.renderSinglePost(findPostByTitle(title));
    }
    res.send(html);
  } else {
    next();
  }
});
```

I do this before setting up the `express.static` middleware for my public directory so that my crawler helper has a chance to send back the html snapshot before the normal static file serving kicks in.

The secret sauce would have to be in whatever your preferred implemenation of my `crawlerRenderer` would be. Mine is pretty simple and just uses the npm package called showdown to render markdown syntax as html. Feel free to replace in my url the hashbang with `?_escaped_fragment_=` to see what happens on this page. Go ahead, I'll wait.

If you want to get real fancy, you could have a headless browser like phantom visit your site and make html snapshots of what it finds, but I'm happy with my plain html for now. I make sure in my homepage html snapshot to list links to all my other posts with the appropriate url so that Google will crawl those as well after seeing my homepage.

### Speaking of the homepage, it may not have a hashbang

You're very observant. There are cases where a page may be ajax-powered but you wouldn't know it by looking at the url. There are a couple ways to deal with this.

#### `<noscript>`

Probably the most straightforward way is to just be nice to everybody who may not have javascript enabled on their browser. I am nowhere near this kind or accommodating. I can't believe you know any of those conspiracy theorists who browse without javascript enabled. Anyway, on the off chance that you think this is a reasonable solution, this will make Google perfectly happy since there will be no ajax needed and it will see your equivalent content inside of `<noscript>` tags. So if you think that rendering your page's html server-side and then asking the client to request data to render the same thing again on every page hit is fun, then you have a weird idea of what is fun.

#### A special meta tag

```
<meta name="fragment" content="!" />
```

Putting this meta tag in your `<head>` is enough for the big G to realize that your page is ajax-reliant. Once it sees this, Google will make a request to your page that looks like `example.com?_escaped_fragment_=`. As long as your server is ready to get hit with this request and return a reasonable html snapshot of what a normal user would see by requesting `example.com`, then you are good to go.

### Gotchas and tips

Remember never to put `_escaped_fragment_` anywhere in your html snapshots. Google knows when it needs to change `#!` into `?_escaped_fragment_=` and does not need coaxing, thankyouverymuch.

You can see what Google sees by poking around at the [webmaster tools](https://www.google.com/webmasters/). Once your add your site, click on Crawl->Fetch as Google at the left. After some frustration, you'll realize like I did that this tool does not respect your meta fragment tag if you have one. You have to put in `#!` in the path text box to force it to get the de-ajax-ified version from your server. But they assure you this bug is not present in the actual crawler. Be careful; apparently you only get 500 test fetches. Somebody's gotta pay for all this, you know.