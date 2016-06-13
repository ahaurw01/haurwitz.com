var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    _ = require('lodash'),
    rsvp = require('rsvp'),
    path = require('path'),
    fs = require('fs'),
    urlHelpers = require('./lib/url_helpers'),
    crawlerRenderer = require('./lib/crawler_renderer'),
    posts = [];

function findPostByTitle(title) {
  return _.find(posts, function (post) {
    return post.urlTitle === title;
  });
}

// Please don't go through heroku!
app.use(function (req, res, next) {
  if (req.hostname.indexOf('heroku') > -1) {
    res.redirect(301, 'http://aaron.haurwitz.com' + req.url);
  } else {
    next();
  }
});

// Free love
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// Appease the crawler
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

// Static files
app.use(express.static(path.normalize(__dirname + '/../public/')));

// body parser for demo purposes
app.use(bodyParser.json());

// Look through the blog_posts directory and put the posts into memory
fs.readdir(path.normalize(__dirname + '/../blog_posts/'), function (err, files) {
  if (err) {
    console.error(err);
  } else {
    // Read in all the files, hipster style
    var promises = files.map(function (file) {
      var promise = new rsvp.Promise(function (resolve, reject) {
        file = path.normalize(__dirname + '/../blog_posts/' + file);
        fs.readFile(file, {encoding: 'utf8'}, function (err, text) {
          if (err) {
            reject(err);
            return;
          }
          text = text.toString();
          // Look for {{{...}}}
          var jsonStart = text.indexOf('{{{') + 2,
              jsonEnd = text.indexOf('}}}'),
              textStart = jsonEnd + 3,
              json = text.substring(jsonStart, jsonEnd + 1),
              post = JSON.parse(json);

          // Ensure there is a title
          if (!post.title) {
            console.error('You must have a title for each blog post.');
            return;
          }

          post.body = text.substring(textStart);

          // Look for <!--more-->
          var more = '<!--more-->',
              moreStart = text.indexOf(more);
          if (moreStart === -1) {
            moreStart = text.length;
          }
          post.intro = text.substring(textStart, moreStart);

          // Make a url-friendly title for this post
          post.urlTitle = post.id = urlHelpers.makeSafeUrlString(post.title);

          posts.push(post);
          resolve();
        });
      });
      return promise;
    });

    // Once they're all read, sort them
    rsvp.all(promises).then(function () {
      // Sort by date descending
      posts.sort(function (p1, p2) {
        var date1 = new Date(p1.date),
            date2 = new Date(p2.date);
        return date2.getTime() - date1.getTime();
      });
    });
  }
});

app.get('/rest/posts', function (req, res) {
  res.send({posts: posts});
});

// :postTitle will be the urlTitle, i.e. lowercase, dashed representation of the actual title
// e.g. /rest/posts/this-is-my-first-post
app.get('/rest/posts/:postTitle', function (req, res) {
  res.send({
    post: findPostByTitle(req.params.postTitle)
  });
});

// Demo API fun stuff
var demoApiHandlers = require('./lib/demo_api');
app.get('/demo/customers/:handle', demoApiHandlers.getCustomer);
app.get('/demo/products', demoApiHandlers.getProducts);
app.get('/demo/products/:id', demoApiHandlers.getProduct);
app.get('/demo/wishlists/:id', demoApiHandlers.getWishlist);
app.put('/demo/wishlists/:id', demoApiHandlers.putWishlist);
app.options('*', demoApiHandlers.options);

// Server-rendered pages.
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.get('/about', function (req, res) {
  res.render('about');
});

var port = process.env.PORT || 3000
app.listen(port);
console.log('Server started on port ' + port);

exports.posts = posts;
