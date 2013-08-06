var express = require('express'),
    app = express(),
    _ = require('lodash'),
    path = require('path'),
    fs = require('fs');

// Static files
app.use(express.static(path.normalize(__dirname + '/../app/')));


// Look through the blog_posts directory and put the posts into memory
var posts = [], _postId = 1;
fs.readdir(path.normalize(__dirname + '/../blog_posts/'), function (err, files) {
  if (err) {
    console.error(err);
  } else {
    files.forEach(function (file) {
      file = path.normalize(__dirname + '/../blog_posts/' + file);
      fs.readFile(file, {encoding: 'utf8'}, function (err, text) {
        text = text.toString();
        // Look for {{{...}}}
        var jsonStart = text.indexOf('{{{') + 2,
            jsonEnd = text.indexOf('}}}'),
            json = text.substring(jsonStart, jsonEnd + 1),
            post = JSON.parse(json);
        post.body = post.intro = text.substring(jsonEnd + 3);
        post.id = _postId++;

        posts.push(post);
      });
    });
  }
});

app.get('/rest/posts', function (req, res) {
  res.send({posts: posts});
});

app.get('/rest/posts/:postId', function (req, res) {
  res.send({
    post: _.find(posts, function (post) {
      return post.id === req.params.postId;
    })
  });
});

var port = process.env.SERVER_PORT || 80
app.listen(port);
console.log('Server started on port ' + port);