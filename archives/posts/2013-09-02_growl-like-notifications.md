# Growl-like notifications with Ember.js

_Sep 02, 2013_

Do you have things to say? Do you have a message for the world? Are you seeking a vessel to express this divine inspiration? Do you feel like blurting out this message at the top right corner of the screen in a fancy way? Then you may need to consider growl-like notifications in your webapp.<!--more-->

### Demo

Before we go any further, I know you greedy webdev types. You're thinking, "demo or it didn't happen." [Check it out](/#!/demos/notifications). When you're done playing, come back and see how it is done.

### The approach

At a high level, this is the approach we will take. This is done within the context of an Ember.js webapp, but you could take these ideas and run with them in your framework of choice.

#### Collection of notification objects

A controller will be responsible for getting told about new notifications and storing them within a collection.

#### View to house the current notifications

A fixed-position view will be put in the DOM that will have sub-views inserted when new notifications arrive. These sub-views will have to do a little work to figure out where to place themselves and respond to clicks.

#### Fancy CSS

The least important but most fun. You'll see when we get there.

### The controller

For the purposes of this post we'll make this controller the `ApplicationController` inside of the ember app. This controller is usually generated for you, but if you explicitly define it, it can be whatever you want. Here it is.

```
App.ApplicationController = Ember.Controller.extend({
  /**
   * @property {Array} The array of app-wide notifications
   */
  notifications: Em.A(),

  /**
   * @observer Not technically necessary, but cleans up
   * the notifications array when all have been closed
   */
  notificationsWereClosed: function () {
    var notifications = this.get('notifications');
    // Don't do anything if there are no notifications.
    if (!notifications.length) {
      return;
    }
    // If all the notifications have been closed,
    // wipe our list clean so cruft doesn't build up
    if (this.get('notifications').everyBy('closed')) {
      this.set('notifications', Em.A());
    }
  }.observes('notifications.@each.closed'),

  actions: {
    /**
     * Action handler for creating a new notification.
     * Could be called from elsewhere throughout the application.
     * @param type {String} classification; used for which icon to show
     * @param title {String} leading text
     * @param message {String} supporting text
     */
    pushNotification: function (type, title, message) {
      var notification = Ember.Object.create({
        type: type,
        title: title,
        message: message,
        closed: false
      });
      this.notifications.pushObject(notification);
    }
  }
});
```

I took the liberty of deciding what makes up a notification object. In this example, it contains information about an icon type, a title, and the descriptive message. You may decide you'd want more or less information.

To trigger these notifications throughout your app, you could do it in a variety of ways. Here's one very simple example.

```
App.SomeRoute = Ember.Route.extend({
  actions: {
    ...
    // doing something that gives you a promise to work with, for example
    workPromise.then(
        function (value) {
          this.controllerFor('application').pushNotification('success', 'You did it!', 'The thing was completed. Hooray!');
        },
        function (error) {
          this.controllerFor('application').pushNotification('failure', 'Nooo', 'Cue the sad trombone...');
        });
  }
});
```

You may have noticed there is a `closed` property on the notification object. There is a reason this is used instead of recomputing the array of notifications. The view will explain.

### The views

The container for your notifications will need to be a fixed-position, high-z-index view that sits empty until populated with notifications. I put this container inside of the application template for demo purposes. It is an extension of the `Ember.CollectionView` class. The `CollectionView` will spit out a child view for every item in its `content` property. _Hat tip to Asaf for suggesting this instead of the `{{#each}}` helper._

```
<script type="text/x-handlebars" data-template-name="application">
  {{view App.NotificationContainerView}}

  {{! Other fun things... }}
</script>
```

```
App.NotificationContainerView = Ember.CollectionView.extend({
  /**
   * @property {String[]} The array of concrete class names to put on this view's element
   */
  classNames: ['notification-container'],

  /**
   * @property {View} Our notification view class.
   * This determines what view class to render for each item in the content array
   */
  itemViewClass: App.NotificationView,

  /**
   * Binding to our controller's notifications array.
   * There will be an App.NotificationView rendered for each
   * guy in here.
   */
  content: Ember.computed.oneWay('controller.notifications')
});
```

The `NotificationView` starts to get more interesting.

```
<script type="text/x-handlebars" data-template-name="notification">
  <i class="{{unbound view.iconType}} icon"></i>
  <a class="close-notification" {{action "close" target="view"}}>
    <i class="icon-remove"></i>
  </a>
  <strong>
    {{view.content.title}}
  </strong>
  <p>
    {{view.content.message}}
  </p>
</script>
```

I am using the notification object's properties here by inserting the title and the message directly. (Note that the `content` property of the view is one of the notification objects from the parent view's `content` array.)

The type is used by a computed property on the view called `iconType`. This is simply for mapping a meaningful type name to a FontAwesome CSS class. There is also a link with an action on it that will need to close the notification.

Here are all the properties of the `NotificationView`. We'll regroup after all the code.

```
App.NotificationView = Ember.View.extend({
  templateName: 'notification',

  classNameBindings: [
    ':notification',
    'content.closed',
    'isOpaque'
  ],

  attributeBindings: ['style'],

  /**
   * @property {Number} Will be set by `didInsertElement`.
   * Used for clearing the auto-hide timeout
   */
  timeoutId: null,

  /**
   * Lifecycle hook - called when view is created.
   * Note: this is a private method in ember, so make sure to
   * call `this._super()` before doing anything.
   */
  init: function () {
    this._super();
    var fn = function () {
      this.notifyPropertyChange('style');
    }.bind(this);
    this.set('_recomputeStyle', fn);
    $(window).bind('resize', fn);
  },

  /**
   * Lifecycle hook - called right before view is destroyed
   */
  willDestroyElement: function () {
    $(window).unbind('resize', this.get('_recomputeStyle'));
  },

  /**
   * View lifecycle hook - called when the view enters the DOM
   */
  didInsertElement: function () {
    // Be prepared to auto-hide the notification
    this.set('timeoutId', setTimeout(function () {
      this.send('close');
    }.bind(this), this.get('hideAfterMs')));
    // Fade in the view.
    Ember.run.later(this, function () {
      this.set('isOpaque', true);
    }, 1);
  },

  /**
   * @property {Boolean} should the view be opaque now?
   * Used for fancy fading purposes.
   */
  isOpaque: false,

  /**
   * @property {Number} View will be hidden after this
   * many milliseconds
   */
  hideAfterMs: 10000,

  /**
   * @property {String} The extra styling necessary for placement
   * within the notification container
   */
  style: function () {
    // Get all open notifications
    var notifications = this.get('controller.notifications').rejectBy('closed'),
        index = notifications.indexOf(this.get('content')), // content is the notification object
        viewportHeight = $(window).height(),
        unitHeight = 80,
        unitWidth = 320,
        unitsPerColumn = Math.floor(viewportHeight / unitHeight),
        column = Math.floor(index / unitsPerColumn),
        row = index % unitsPerColumn;

    if (index === -1) {
      // Wasn't in the list, don't care.
      return '';
    }

    var topPx = row * unitHeight,
        rightPx = column * unitWidth;

    return 'top: ' + topPx + 'px; right: ' + rightPx + 'px;';
  }.property('controller.notifications.@each.closed'),

  /**
   * @property {String} fontawesome class for the icon
   */
  iconType: function () {
    var type = this.get('content.type'),
        hash = {
          'alert': 'icon-exclamation-sign',
          'success': 'icon-ok',
          'bad': 'icon-frown',
          'loud': 'icon-bullhorn'
        };
    return hash[type] || '';
  }.property('content.type'),

  actions: {
    /**
     * Action handler - "close" the notification
     */
    close: function () {
      this.set('isOpaque', false);
      setTimeout(function () {
        this.set('content.closed', true);
        clearTimeout(this.get('timeoutId'));
      }.bind(this), 300);
    }
  }
});
```

...And that's it! Ok, I'll explain some of this nonsense.

#### Animation

All of the animation is done using the CSS3 `transition` capability. Examining the styles later you'll see that transitions are done for `opacity`, `top`, and `right` property changes. Keep this in mind when looking back at what styling changes are done by the view.

#### Automatic hiding

`didInsertElement` gets called with the view is rendered into the DOM. At that point we set up a `setTimeout` to emit the `close` event after 10 seconds, according to the `hideAfterMs` property.

#### Fading in and out

When the `isOpaque` property is true, the view will have the class `is-opaque` added to its list of classes. It starts off false and is set to true some time shortly after it is inserted into the DOM. This is achieved by `Ember.run.later` in the `didInsertElement` hook. If we instead set `isOpaque` to true immediately in that hook, it acts as though `is-opaque` was never not there, so no animation occurs.

When the view catches the `close` event, it sets `isOpaque` to false, letting the animation happen once again in the opposite direction.

#### `notification.closed` property

Whenever a notification is closed, we want all other notifications that were present to stay on the screen, but animate to their new location. To achieve this, we must make sure that the collection of notifications being wrapped by our `NotificationContainerView` does not change in a significant way. If this collection is rebuilt, every notification view that was in the DOM is ripped out and new ones are put in. We don't want that because the new ones would not know where they were previously and animation would be near impossible.

Instead what we do is set a `closed` property on any notification that has been closed and just don't display it on the screen anymore. We can simply update the position settings of the views that need to stay visible and they will animate nicely to their new homes.

In the `close` event handler, we wait 300 milliseconds to set the `closed` property to true since we have a classname binding on the `content.closed` property that sets `display: none`.

#### Horizontal and vertical placement

Since we are relying on CSS to do the animation for us, we just need to programmatically set the `top` and `right` placement of each view. This is done by specifying in the `attributeBindings` array that we want to have the output of the `style` computed property slapped into the corresponding attribute of the DOM element. That computed property just does some math to figure out what row and column in which to place the notification, taking the window height into consideration.

#### Update placement on window resize

When the view is being created (`init` hook) and destroyed (`willDestroyElement` hook) we want to bind and unbind a handler to the jQuery window resize event. In this handler, we just want to force the `style` property to be recomputed. Ember lets us do this through the `notifyPropertyChange` method. Handy.

### CSS

"But it's the beauty on the inside that matters!" Right.

Most important is the `transition` stuff going on in the `.notification` class and the `.closed` class hiding notifications that have been axed.

```
.notification-container {
  position: fixed;
  right: 10px;
  top: 10px;
  z-index: 999; /*must be highest element on page*/
}

.notification {
  opacity: 0;
  position: absolute;
  right: 10px;
  width: 300px;
  height: 65px;
  padding: 5px 10px 5px 45px;
  border: 2px solid transparent;
  border-radius: 10px;
  background-color: rgba(50, 50, 50, 0.5);
  color: rgb(255, 255, 255);
  font-size: 12px;
  font-family: 'Open Sans', sans-serif;
  text-shadow: 1px 1px 3px rgb(0, 0, 0);
  box-shadow: 0px 0px 15px -5px rgb(0, 0, 0);
  transition: opacity 0.3s ease-out, top 0.3s ease-out, right 0.3s ease-out;
}

.notification.is-opaque {
  opacity: 1;
}

.notification:hover {
  border-color: rgb(255, 255, 255);
}

.notification.closed {
  display: none;
}

.notification .icon {
  position: absolute;
  top: 9px;
  left: 9px;
  font-size: 26px;
}

.notification .close-notification {
  display: none;
  position: absolute;
  top: -6px;
  right: 6px;
  font-size: 22px;
  cursor: pointer;
  text-decoration: none;
  color: rgb(255, 255, 255);
}

.notification:hover .close-notification {
  display: block;
}
```

[Play with the demo](/#!/demos/notifications) and leave feedback. I'm curious how other folks are handling notifications.
