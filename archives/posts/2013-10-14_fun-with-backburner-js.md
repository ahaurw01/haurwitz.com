{{{
  "title": "Fun with Backburner.js",
  "date": "Oct 14, 2013"
}}}

[ebryn/backburner.js](https://github.com/ebryn/backburner.js) is a queueing library that happens to be the heart and soul of the Ember.js internal workflow. Over in the Ember world, this workflow is referred to as the RunLoop. I have put together a fun little example of Backburner to demystify some of its inner workings and to shed light on how other frameworks put it to use.

But before that, let's take a look at what Backburner has to offer.<!--more-->

### Need I remind you, 007, that you have a license to kill, not to break the traffic laws. --Q

```
backburner = new Backburner(['morningActivities', 
    'midDayActivities', 'eveningActivities']);
```

This creates a new Backburner instance with three queues. When you use Backburner's API to interact with these queues, you are ensured that actions deferred to one queue only occur after all actions in prior queues have been executed. This is the core concept of Backburner.

### `Backburner#run`

```
backburner.run(function () {
  doSomethingThatDefersActions();
  doSomethingElseThatCanAlsoDeferActions();
});
// All deferred actions have been executed.
```

`Backburner#run` will first immediately execute the given function (or named method of an object). Second, it kicks off the algorithm of flushing queues, ultimately ensuring that all deferred actions have been executed by the time `run()` completes.

### `Backburner#defer` and `Backburner#deferOnce`

These are the true moneymakers of Backburner. Both methods allow you to defer an action to one of the queues. In the case of `deferOnce`, the action will only be executed once in the flushing of that queue, no matter how many times `deferOnce` is called with that action.

```
backburner.defer('midDayActivities', person, 'eatASnack', 'chips');
```

This says that you want to call the `person`'s `eatASnack` method with the argument `'chips'` during the flushing of the `midDayActivities` queue.

```
backburner.deferOnce('morningActivities', bedroom, 'makeTheBed');
```

This says, "Mom, relax. I'll do it before the morning is over. You've told me like a million times already."

### When do I use `Backburner#run`?

You might wonder what happens when you make a call to `Backburner#defer` if you don't do it inside of a call to `Backburner#run`. 

If you happen to call `defer` during the execution of the queue-draining algorithm, Backburner merges your request with the current instance of the algorithm execution. If you defer an action to the `morningActivities` queue while the `eveningActivities` queue is currently being flushed, then Backburner will circle back and drain the `morningActivities` and `midDayActivities` queues before eventually finishing the `eveningActivities` queue.

If you instead happen to call `defer` outside of an active draining of the queues, Backburner will automatically kick off the algorithm by way of a `setTimeout(..., 0)`. This is useful to know if you expect deferred actions to be executed immediately before your code continues. 

If you are invoking a function that has deferred side effects and want those side effects to be resolved immediately after you invoke that function, you must wrap the invocation in a call to `Backburner#run`.

### Other API goodies

Backburner's API includes more than `run`, `defer`, and `deferOnce`, although in my estimation, those are the core entry points.

The rest of the API includes `Backburner#setTimeout`, `Backburner#debounce`, `Backburner#throttle`, and `Backburner#cancel`. These gems act basically as one might expect, but you get the added benefit of working within the confines of the queue-flushing algorithm. 

So say, for example, you make a couple calls to `Backburner#setTimeout` that happen to occur around the same time. They will likely occur within the same queue-flushing run and offer you the action prioritization and optimizations you have come to know and love about Backburner.

### Computed properties with Backburner.js

On to the fun stuff. This miniature library shows the usefulness of Backburner.js by creating a model object that has computed properties. For reference, here is the [full source of the library](https://github.com/ahaurw01/backburner-computed-properties/blob/master/compute_model.js).

Here is an example of what we hope to create:

```
var kitty = new ComputeModel({
  name: 'ToobSox',
  weight: 12,
  sassLevel: 'quiteSassy',

  isFatAndSassy: function (weight, sassLevel) {
    return weight > 14 && 
        ['quiteSassy', 'ludicrouslySassy'].indexOf(sassLevel) >= 0;
  }.computed('weight', 'sassLevel'),

  description: function (name, isFatAndSassy) {
    return name + (isFatAndSassy ? ', Jedi Cat' : ', Padawan Learner Kitten');
  }.computed('name', 'isFatAndSassy')
});

kitty.get('description');
// "ToobSox, Padawan Learner Kitten"
kitty.set('weight', 15);
kitty.get('description');
// "ToobSox, Jedi Cat"
```

...and now the fiddle so you know it can be accomplished!

<iframe width="100%" height="300" src="http://jsfiddle.net/ahaurw01/E7NfE/6/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

### Overview

- Each `ComputeModel` instance will contain its own Backburner instance. This Backburner is responsible for scheduling recalculations of computed properties and batching change notifications for external listeners.

- This Backburner will consist of two queues - `recompute` and `notify`.

- `ComputeModel`s have a `set` method that triggers the scheduling of recomputation for all affected computed properties. It also schedules the eventual notification of interested external listeners.

- Recomputing a computed property means executing the function associated with it, storing the resulting value, and then scheduling recomputation of other computed properties that may depend on this computed property.

- After all necessary recomputations have occurred, external listeners will be notified of all properties that just changed.

### `scheduleRecompute`

```
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
}
```

When we know a value has changed (for example, from a call to `set`), we need to see what computed properties exist that depend upon this changing value. Here we iterate through all computed properties and stash the ones in `this._propertiesToRecompute` that will need to be recomputed. If there is at least one that needs to be recomputed, we call `backburner.deferOnce` to ensure that during the flushing of the `recompute` queue, the `recompute` method will be executed. The `recompute` will then inspect the `_propertiesToRecompute` and go from there.

### `recompute`

```
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
}
```

When recomputing a computed property, we pop it off of the `_propertiesToRecompute` array and simply call its compute function with its dependent values, storing the result. After doing this, however, there may be other computed properties that depend on this one, so we have to schedule recomputation of anybody who happens to depend on him. Here is also where we schedule the eventual notification of external listeners that this property has changed. Remember that Backburner ensures that this won't happen until all of the recomputes are done.

### `scheduleNotify`

```
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
  this.backburner.deferOnce('notify', this, 'notify');
}
```

Similar to scheduling the recomputes, we need to stash the changed property names and tell Backburner that we want to defer the `notify` execution to the `notify` queue.

### `notify`

```
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
```

Due to the magic of Backburner, this will only get executed once for each set of computed property changes that occur. This optimizes rendering in my example. The view will want to repaint itself when its underlying model has changed, but you wouldn't want to render three times in a row if one value change kicks off two other computed property updates.

### `get` and `set`

```
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
}
```

These two methods are straightforward. `get` simply retrieves the stored values for the property you want.

`set` will immediately store the given value for the property you wish to update. Then, it will schedule the recomputation of affected computed properties and the notification of the change of the explicitly updated property.

What's important here is that the call to `backburner.run` will ensure that all deferred actions are executed before moving on.

This allows you to retrieve the value of a computed property immediately after setting the value of one of its dependent properties. For example...

```
person.set('middleName', 'Danger');
person.get('fullName'); // "Angus Danger Macgyver"
```

### Who else is using Backburner?

Ember.js is obviously a huge fan of what Backburner provides. It uses it to schedule the synchronization of bindings between objects, execution of user-generated actions, rendering of views, and more. [Erik Bryn](http://erikbryn.com/) provides a [pretty useful example](https://github.com/ebryn/backburner.js#simple-backbone-example) of deferring rendering in the context of a Backbone app.

What are you folks deferring?