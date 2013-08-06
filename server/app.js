var express = require('express'),
    app = express(),
    path = require('path'),
    fs = require('fs');

// Static files
app.use(express.static(path.normalize(__dirname + '/../app/')));

var post = {
  id: 1,
  title: 'First!',
  date: new Date(),
  intro: 'Intro',
  body: 'Full Content'
};

app.get('/rest/posts', function (req, res) {
  res.send({posts: [post]});
});

app.get('/rest/posts/:postId', function (req, res) {
  res.send({post: post});
});

var port = process.env.SERVER_PORT || 3000
app.listen(port);
console.log('Server started on port ' + port);