module.exports = Ember.CollectionView.extend({
  /**
   * @property {String[]} The array of concrete class names to put on this view's element
   */
  classNames: ['notification-container'],
  
  /**
   * @property {View} Our notification view class.
   * This determines what view class to render for each item in the content array
   */
  itemViewClass: require('views/demos/notification_view'),
  
  /**
   * Binding to our controller's notifications array
   */
  contentBinding: 'controller.notifications'
});