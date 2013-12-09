## haurwitz.com

An express-powered site that renders markdown blog posts inside of an ember.js front end.

### I'll be your guide to the repo.

- app. All the front-end code
  - js/app.js. Contains the entirety of the ember code.
  - index.html. The base html and all handlebars templates for the site.
- blog_posts. The blog posts written in markdown syntax
- server. All the server-side code
  - app.js. Contains the routes and high-level logic for loading all the blog posts into memory.
  - lib. Contains helper modules that aid in rendering for crawlers and url beautification.