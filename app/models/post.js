var attr = DS.attr,
    Post = DS.Model.extend({
      title: attr('string'),
      intro: attr('string'),
      body: attr('string'),
      date: attr('date')
    });

module.exports = Post;