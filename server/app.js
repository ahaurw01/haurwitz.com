var express = require('express'),
    app = express(),
    path = require('path'),
    fs = require('fs');

// Static files
app.use(express.static(path.normalize(__dirname + '/../app/')));

var post1 = {
  id: 1,
  title: 'First!',
  date: new Date(),
  intro: 'Intro',
  body: 'Full Content'
};

var post2 = {
  id: 2,
  title: 'Second...',
  date: new Date(),
  intro: 'Intro',
  body: 'Full Content'
};

app.get('/rest/posts', function (req, res) {
  res.send({posts: [post1, post2]});
});

app.get('/rest/posts/:postId', function (req, res) {
  res.send({post: req.params.postId === 1 ? post1 : post2});
});

var port = process.env.SERVER_PORT || 3000
app.listen(port);
console.log('Server started on port ' + port);