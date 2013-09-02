'use strict';

// A counter for globally unique identifiers
var _guid = 0;

module.exports = Ember.Controller.extend({
  /**
   * The view that houses a single notification
   */
  NotificationView: require('views/notification_view'),

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

  /**
   * Create some random nonsense
   */
  randomText: function () {
    var types = [
          'alert',
          'success',
          'bad',
          'loud'
        ],
        titles = [
          'Check it',
          'Look here!',
          'This is something',
          'Alert!'
        ],
        messages = [
          'Something happened and I think you should know about it!',
          'Look behind you! Quick! No, you missed it.',
          'Your mom called. She just wanted to send her greetings.',
          'Hi! Nothing important...just distracting you. Hope you didn\'t lose your train of thought.'
        ];
    return {
      type: types[Math.floor(Math.random() * 3 + 0.5)],
      title: titles[Math.floor(Math.random() * 3 + 0.5)],
      message: messages[Math.floor(Math.random() * 3 + 0.5)]
    };
  }.property().volatile(), // volatile not usually recommended; used here so text is recomputed every time

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
        guid: ++_guid,
        closed: false
      });
      this.notifications.pushObject(notification);
    },

    /**
     * Action handler - create a new notification
     */
    createNotification: function () {
      var randomText = this.get('randomText');
      this.send('pushNotification', randomText.type, randomText.title, randomText.message);
    },
  }
});