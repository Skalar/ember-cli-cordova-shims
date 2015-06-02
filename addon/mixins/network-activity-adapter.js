import Em from 'ember';
import missingPlugin from '../utils/missing-plugin';
/* global NetworkActivity */

/**
  Mixin for your ember-data adapter that toggles the NetworkActivity indicator.

  Use by importing and applying the mixin to your adapter

  ```javascript
  // app/adapters/application.js
  import DS from 'ember-data';
  import NetworkActivityAdapterMixin from 'cordova-shims/mixins/network-activity-adapter';

  export default DS.RESTAdapter.extend(NetworkActivityAdapterMixin, {
    ...
  });
  ```

  @class NetworkActivityAdapterMixin
  @namespace CordovaShims.Mixins
  @module cordova-shims/mixins/network-activity-adapter
  @extends Ember.Mixin
  @since {wip}
 */
export default Em.Mixin.create({
  _pendingAjaxCalls: 0,

  ajax: function(){
    this.incrementProperty('_pendingAjaxCalls');

    return new Em.RSVP.Promise((resolve, reject) => {
      this._super.apply(this, arguments)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.decrementProperty('_pendingAjaxCalls');
        });
    });
  },

  /**
    @method _toggleNetworkActivity
    @private
  */
  _toggleNetworkActivity: Em.observer('_pendingAjaxCalls', function(){
    if (!window.NetworkActivity) {
      Em.run.scheduleOnce('afterRender', this, this._missingPlugin);
      return;
    }

    if (this.get('_pendingAjaxCalls') > 0) {
      NetworkActivity.activityStart();
    } else {
      NetworkActivity.activityStop();
    }
  }),

  /**
    @method _missingPlugin
    @private
  */
  _missingPlugin: function(){
    missingPlugin('NetworkActivity', 'com.wearecocoon.cordova.plugin.networkactivity');
  }
});
