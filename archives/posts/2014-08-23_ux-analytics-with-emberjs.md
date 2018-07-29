{{{
  "title": "UX analytics with Ember.js",
  "date": "Aug 23, 2014"
}}}

You need more information about how your users are interacting with your webapp. There are many reasons for this. Chief among them is smugly rubbing your usability predictions in the face of your senior designer. What follows is an easy way to incorporate Google Analytics into your webapp to track usability.<!--more--> I developed a version of this approach during a [Resonate Hackathon](http://blog.resonateinsights.com/a-hackathon-play-by-play/).

This code is meant to work within an Ember application because that's what I work with on a daily basis. But the approach is framework-agnostic, so feel free to transclude directives on your own time.

### Tracking transitions

If all you aim to do is track how the pages of your webapp are accessed, there are plenty of solutions out there already. The best source is the Ember website. They have a [recipe](http://emberjs.com/guides/cookbook/helpers_and_components/adding_google_analytics_tracking/) for you ready to go. While this is a very important part of tracking the experience of your application, we can do even more by seeing how people interact with the elements on any given page.

### Demo

Check out this demo to see how it is possible to track different kinds of interaction.

<a class="jsbin-embed" href="http://jsbin.com/xegada/18/embed?output">Ember GA UX Tracking</a><script src="http://static.jsbin.com/js/embed.js"></script>

### Warning

This post contains code that alters the `Function` prototype. If [monkey punching](http://en.wikipedia.org/wiki/Monkey_patch) prototypes that do not belong to you makes you ill at the thought, stop reading here. Then take 200mg of Perspectivicillin and call me in the morning.

### Motivation

Two things I believe in are frictionless development and separating your business logic from your infrastructure logic. Java brings this to us in the form of annotations.

```
@BombOnEntry(ifRoleIsNot = Roles.SUPER_ADMIN)
public void doSomethingSuperSecret() {
  ...
}
```

Mixing infrastructure logic and business logic is not sexy and is an invitation to error.

```
public void doSomethingSuperSecret() {
  if (permissionHandler.isSuperAdmin()) {
    ...
  }
}
```

Let's bring this declarative style of infrastructure logic over to the JavaScript world and tell our application *what* we want to happen when a user interacts with an element on the page, not exactly *how* to do it.

### Using Google Analytics

To track user experience within a web application, I am simply using the [events API](https://developers.google.com/analytics/devguides/collection/analyticsjs/events) that Google Analytics offers. When I say, "tracking user experience," I mean firing off something like this bad boy whenever somebody takes an action in your webapp.

```
ga('send', 'event', {
  'eventCategory': 'button',
  'eventAction': 'click',
  'eventLabel': 'nav buttons',
  'eventValue': 4
});
```

I make no assumptions regarding the types of values you'll want for the required category and action fields or the optional label and event fields.

### `Function.prototype.track`

When you track user experience, you're usually tracking handled events. Handled events conveniently have functions that execute your logic. Instead of adding the Google Analytics API boilerplate to each of your event handlers, let's add some sugar to the `Function` prototype.

This approach should look extremely familiar if you've used Ember function methods like `property`, `observes` or `on`, for example.

Here is an example of using the `track` method.

```
var handler = function (searchValue) {
  var stuff = searchForStuff(searchValue);
  doThingsWithTheStuff(stuff);
}.track({ /* options */ })
```

Now the `track` method implementation.

```
/**
 * Track this function's invocation.
 * @param {object} options to pass to google analytics
 * @return {function} a new function that wraps this one
 */
Function.prototype.track = function (options) {
  // `this` is the function on which we called `track()`
  var fn = this;

  // Return a wrapper function
  return function () {
    // The arguments present when the wrapped function
    // is invoked
    var args = Array.prototype.slice.apply(arguments);
    // Invoke the wrapped function.
    fn.apply(this, args);

    // `this` is the context with which the wrapped
    // function was invoked, e.g. a route or controller
    var context = this;

    // You can pass either plain values or functions
    // for options.
    // If it is a function, it gets invoked with the
    // same context and arguments with which this wrapped
    // function was invoked. Useful for getting values
    // out of controllers, e.g.
    function extractValueFromArgument(arg) {
      return typeof arg === 'function' ?
         arg.apply(context, args) :
         arg;
    }

    // Allow an optional `when` conditional. Useful when
    // you do not want to track every invocation.
    if (!options.when ||
        options.when.apply(this, args)) {
      // Prepare the set of arguments to pass to GA
      var gaArgs = ['send', 'event'];
      var gaOptions = {
        eventCategory:
            extractValueFromArgument(options.category),
        eventAction:
            extractValueFromArgument(options.action),
        eventLabel:
            extractValueFromArgument(options.label),
        eventValue:
            extractValueFromArgument(options.value)
      };
      // Allow an optional `delay` or track immediately
      window.setTimeout(function () {
        window.ga('send', 'event', gaOptions);
      }, options.delay || 0);
    }
  };
};
```

Here is an example of an Ember controller with a tracked action handler using all the bells and whistles we just put together.

```
App.ProductsController = Ember.ArrayController.extend({
  // ...

  actions: {
    search: function (searchText) {
      // do your logic...
    }.track({
      category: 'products',
      action: 'search',
      label: function(searchTerm) {
        // This would look cooler in CoffeeScript
        return searchTerm;
      },
      value: function () {
        // This would look cooler with ES6 generators
        var searches = (this.get('searches') || 0) + 1;
        this.set('searches', searches);
        return searches;
      },
      when: function (searchTerm) {
        return searchTerm.length > 2;
      },
      delay: 500 // ms
    })
  }
});
```

Yes, that options hash is large, and yes, it can look verbose, but consider having to put all that logic within the handler function itself. Better to keep it separate for readability, ensuring correctness, and maintaining the logic of interacting with the Google Analytics API in one place.

This is a more typical usage of `track()`.

```
function () {
  // handle something...
}.track({
  category: 'feature-set-abc',
  action: 'button-xyz-click'
})
```

You can get super fancy if you want and even chain these guys. How hot is this?

```
function (term) {
  // some logic
}.track({
  category: 'feature-set-abc',
  action: 'thing'
}).track({
  category: 'feature-set-abc',
  action: 'thing-no-results',
  when: function () {
    return this.get('results.length') === 0;
  }
})
```

### `{{track}}` handlebars helper

What if you aren't necessarily handling an event? You might have a plain old `<a>` tag that links to another site. You wouldn't want to remove the `href` from that link and handle the click and navigation through JavaScript just to track the interaction. How about a templating construct to deal with this for you?

```
<a href="http://nigerian-prince-trust-funds.org"
    {{track category="navigation" action="scam-victim-click"}}>
  Donate to a worthy cause!
</a>
```

Here is the handlebars helper. I stole most of this from the official `{{action}}` handler, so I'll only comment what is unique.

```
Ember.Handlebars.registerHelper('track',
    function trackHelper() {
  var options = arguments[arguments.length - 1],
      contexts = Array.prototype.slice.call(arguments, 1, -1);

  var hash = options.hash,
      controller = options.data.keywords.controller;

  var action = {
    eventName: hash.on || 'click',
    parameters: {
      context: this,
      options: options,
      params: contexts
    },
    view: options.data.view,
    bubbles: true,
    preventDefault: false,
    // Don't target anything, just fake it
    target: { root: {} },
    boundProperty: options.types[0] === 'ID'
  };

  // Allow using *Property attributes in this helper.
  // If these are present, look up the value of the
  // corresponding property in the current context.
  if (hash.categoryProperty) {
    hash.category = this.get(hash.categoryProperty);
  }
  if (hash.actionProperty) {
    hash.action = this.get(hash.actionProperty);
  }
  if (hash.labelProperty) {
    hash.label = this.get(hash.labelProperty);
  }
  if (hash.valueProperty) {
    hash.value = this.get(hash.valueProperty);
  }

  trackHelper.trackSequence =
      (trackHelper.trackSequence || 0) + 1;
  var actionName = 'trackAction' + trackHelper.trackSequence;

  // Create the action handler right here.
  action.target.root[actionName] = Em.K.track({
    category: hash.category,
    action: hash.action,
    label: hash.label,
    value: hash.value
  });
  var actionId = Em.Handlebars.ActionHelper.registerAction(actionName, action, hash.allowedKeys);
  return new Em.Handlebars.SafeString('data-ember-action="' + actionId + '"');
});
```

The handler takes the following options: `category`, `action`, `label`, and `value`. You can also specify `categoryProperty`, `actionProperty`, `labelProperty` or `valueProperty` if you'd rather give the name of a property on the current context that holds the value you wish to reference. Because Ember doesn't yet support bound helpers that act as HTML attributes, we have to use this crude API. HTMLBars will be our savior...

### Get out there and track some interactions

These tools should put you on the path to figuring out the ideal user experience for your application. Your senior designer can preach until she's blue in the face. I want concrete evidence to see that people are effectively using my applications.