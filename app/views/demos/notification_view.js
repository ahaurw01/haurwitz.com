'use strict';

module.exports = Ember.View.extend({
  template: require('templates/demos/notification'),
  
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
        index = notifications.indexOf(this.get('content')),
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