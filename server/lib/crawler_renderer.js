var _ = require('lodash'),
    Showdown = require('showdown'),
    converter = new Showdown.converter(),
    startHtml = '<html><body><h1>aaron haurwitz</h1>',
    endHtml = '</body></html>';

function renderAllPosts(posts) {
  var html = startHtml;
  posts.forEach(function (post) {
    html += converter.makeHtml(post.intro);
    html += '<a href="#!/posts/' + post.urlTitle + '">read more...</a>';
  });
  html += endHtml;
  return html;
}

function renderSinglePost(post) {
  var html = startHtml;
  html += converter.makeHtml(post.body);
  html += endHtml;
  return html;
}

exports.renderAllPosts = renderAllPosts;
exports.renderSinglePost = renderSinglePost;