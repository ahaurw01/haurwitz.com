(function ($, backburner, global) {
  var Backburner = backburner.Backburner;

  /**
   * ComputeModel constructor
   * @constructor
   * @param {object} hash - hash of concrete and computed properties
   */
  var ComputeModel = function (hash) {
    this.backburner = new Backburner(['recompute', 'afterRecompute']);
    this._values = {}; // Hash of stored property values
    var key, value;
    // Set up the computed properties in a call to run() so that we know
    // our deferred actions will be executed before moving on.
    this.backburner.run(function () {
      for (key in hash) {
        if (hash.hasOwnProperty(key)) {
          value = hash[key];
          if (value instanceof ComputeModel.ComputedProperty) {
            // Create this computed property
            this.createComputedProperty(key, value);
          } else {
            // Plain old-fashioned key/value pair
            log('Initial concrete set: ' + key);
            this._values[key] = hash[key];
          }
        }
      }
    }.bind(this));
  };

  /**
   * Simple logger; set LOGGING to true to see message.
   * @param {string} msg
   */
  function log(msg) {
    if (ComputeModel.LOGGING) {
      console.info(msg);
    }
  }
  ComputeModel.prototype = {
    /**
     * Retrieve the stored value of the given property
     * @param {string} key - name of the property
     */
    get: function (key) {
      return this._values[key];
    },

    /**
     * Set the value of a property and defer computation of related computed properties
     * @param {string} key - name of the property
     * @param {string} value - new value
     */
    set: function (key, value) {
      // Set the value immediately, defer the computation of related computed properties
      this._values[key] = value;
      this.backburner.run(function () {
        this.scheduleRecompute(key);
        this.scheduleNotify(key);
      }.bind(this));
    },

    /**
     * Save the given callback to call whenver values of this model change.
     * @param {function} handler
     */
    registerChangeHandler: function (handler) {
      this.changeHandlers = this.changeHandlers || [];
      this.changeHandlers.push(handler);
    },

    /**
     * Forget about calling the given callback when changes occur
     * @param {function} handler
     */
    unregisterChangeHandler: function (handler) {
      this.changeHandlers = this.changeHandlers || [];
      var index = this.changeHandlers.indexOf(handler);
      if (index >= 0) {
        this.changeHandlers.splice(index, 1);
      }
    },

    /**
     * Initialize a computed property. Meant to be called from the constructor.
     * @private
     * @param {string} key - name of the property to create
     * @param {ComputeModel.ComputedProperty} - computed property instance
     */
    createComputedProperty: function (key, computedProperty) {
      computedProperty.key = key;
      this._computedProperties = this._computedProperties || [];
      this._computedProperties.push(computedProperty);
      // Kick off eventual computation
      var backburner = this.backburner,
          self = this;
      computedProperty.dependentProperties.forEach(function (dp) {
        self.scheduleRecompute(dp);
      });
    },

    /**
     * Schedule the eventual computation of a property
     * @private
     * @param {string} changedKey - name of the property that has changed
     */
    scheduleRecompute: function (changedKey) {
      if (this._computedProperties) {
        this._propertiesToRecompute = this._propertiesToRecompute || [];
        this._computedProperties.forEach(function (cp) {
          // Does this guy depend on `changedKey`? If so, recompute him.
          if (cp.dependentProperties.indexOf(changedKey) >= 0) {
            log('Scheduling recompute: ' + cp.key);
            if (this._propertiesToRecompute.indexOf(cp) === -1) {
              this._propertiesToRecompute.push(cp);
            }
            this.backburner.deferOnce('recompute', this, 'recompute');
          }
        }.bind(this));
      }
    },

    /**
     * Schedule the eventual notification of value changes
     * @private
     * @param {string} key - name of the property that has changed
     */
    scheduleNotify: function (key) {
      log('Scheduling notify: ' + key);
      this._changedProperties = this._changedProperties || [];
      if (this._changedProperties.indexOf(key) === -1) {
        this._changedProperties.push(key);
      }
      this.backburner.deferOnce('afterRecompute', this, 'notify');
    },

    /**
     * Recompute the values of all out-of-date computed properties
     * @private
     */
    recompute: function () {
      var computedProperty;
      // Iterate over all out-of-date properties
      while (this._propertiesToRecompute.length) {
        computedProperty = this._propertiesToRecompute.pop();
        // Retrieve the current values for the dependent keys
        var injectedArgs = computedProperty.dependentProperties.map(function (dp) {
          return this._values[dp];
        }.bind(this));
        log('Recomputing: ' + computedProperty.key);
        this._values[computedProperty.key] = computedProperty.compute.apply(this, injectedArgs);
        this.scheduleNotify(computedProperty.key);
        // Maybe somebody else depends on this computed property!
        this.scheduleRecompute(computedProperty.key);
      }
    },

    /**
     * Notify external parties of value changes.
     * Reads the values in the _changedProperties array set by `scheduleNotify`
     * @private
     */
    notify: function () {
      if (!this.changeHandlers) {
        return;
      }
      log('Notifying: ' + this._changedProperties.join(', '));
      var changedProperties = this._changedProperties;
      this.changeHandlers.forEach(function (handler) {
        handler(changedProperties.slice());
      });
      this._changedProperties = [];
    }
  };

  /**
   * Computed property constructor
   * @constructor
   */
  ComputeModel.ComputedProperty = function (compute, dependentProperties) {
    this.compute = compute;
    this.dependentProperties = dependentProperties;
  };

  /**
   * Create a ComputedProperty instance based off of the function
   */
  Function.prototype.computed = function () {
    var dependentProperties = Array.prototype.slice.call(arguments);
    return new ComputeModel.ComputedProperty(this, dependentProperties);      
  };

  ComputeModel.LOGGING = true;

  global.ComputeModel = ComputeModel;
})(jQuery, backburner, this);