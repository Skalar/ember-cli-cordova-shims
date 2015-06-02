import Em from 'ember';
import missingPlugin from '../utils/missing-plugin';

/**
  Service that allows for registration/unregistration and handling of push
  notifications received from GCM or APNs.

  Configuration and setup of the service is done in an initializer:

  ```javascript
  import NotificationsService from 'ember-cli-cordova-shims/services/notifications';

  export function initialize(container, application) {
    let service = NotificationsService.create({
      gcmSenderId: '{INSERT-KEY-FROM-GCM-HERE}',
      gcmTimeout: 10000 // Timeout for GCM in ms. Default: 15000
    });
    application.register('service:notifications', service, {
      instantiate: false
    });
    application.inject('route', 'notifications', 'service:notifications');
  }

  export default {
    name: 'notifications-service',
    initialize: initialize
  };
  ```

  @class Notifications
  @namespace CordovaShims.Services
  @module ember-cli-cordova-shims/services/notifications
  @extends Ember.Service
  @since 0.1.0
 */
export default Em.Service.extend(Em.Evented, {
  /**
   @event alert
   @param {String} message The message received in the payload
  */

  /**
   @event badge
   @param {Number} count Badge count recieved in the payload
  */

  /**
   @event sound
   @param {String} filename Filename of the sound that should be played
  */

  /**
   Please do not attach event listeners to this event. Use the `register` method
   instead to handle device registration.

   @event registered
   @private
   @param {Object} data An object with a `network` and a `token`. `network` will
                        be either 'apns' or 'gcm'.
  */

  /**
    Project ID from Google API Console. Must be set if you want to register
    devices with GCM.

    @property gcmSenderId
    @type String
  */
  gcmSenderId: null,

  /**
    Timeout for GCM registration. In ms.

    @property gcmTimeout
    @type Number
    @default 15000
  */
  gcmTimeout: 15000,

  init: function(){
    this._subscribeForEcb();
    this.on('badge', this, this._setBadgeCount);
    this.on('sound', this, this._playSound);
    if (!window.device) {
      missingPlugin('Device', 'org.apache.cordova.device');
    }
    if (!window.plugins || !window.plugins.pushNotification) {
      missingPlugin('PushPlugin', 'https://github.com/phonegap-build/PushPlugin.git');
    }
  },

  /**
    Registers the device for push notifications.

    Example:

    ```javascript
    // app/routes/application.js
    import Em from 'ember';

    export default Em.Route.extend({
      actions: {
        subscribeForNotifications: function(){
          let store = this.store;

          this.notifications.register().then(function(data){
            let network = data.network,
                  token = data.token;
            return store.createRecord('device', {
              network: network,
              token: token
            }).save();
          }).then(function(deviceModelFromStore){
            Em.Logger.info('Successfully registered for notifications');
          }).catch(function(error){
            Em.Logger.error('Something went wrong registering for notifications', error);
          });
        }
      }
    });
    ```

    @method register
    @return {RSVP.Promise} A promise that will resolve with an object containing
                           the `network` (apns or gcm) and the `token` for the
                           device.
  */
  register: function(){
    return new Em.RSVP.Promise((resolve, reject) => {
      const pushNotification = window.plugins.pushNotification;
      let success = resolve;

      this.one('_registration', resolve);
      switch (window.device.platform.toLowerCase()) {
        case 'android':
        case 'amazon-fireos':
          let gcmSenderId = this.get('gcmSenderId'),
              gcmTimeout  = this.get('gcmTimeout');

          Em.assert('Attempted to register device for notifications with GCM Sender ID', gcmSenderId);

          Em.Logger.info('Attempting registration with GCM');
          success = function(){
            // Wait for registration event for up to 15 seconds
            setTimeout(function(){
              reject(new Error('Timed out while registering for GCM'));
            }, gcmTimeout);
          };
          pushNotification.register(success, reject, {
            senderId: gcmSenderId,
            ecb: "onNotificationGCM"
          });
          break;
        case 'ios':
          Em.Logger.info('Attempting registration with APNS');
          success = (token) => {
            this.trigger('_registration', {
              network: 'apns',
              token: token
            });
          };
          pushNotification.register(success, reject, {
            badge: true,
            sound: true,
            alert: true,
            ecb: "onNotificationAPNS"
          });
          break;
        default:
          reject(new Error('Invalid platform'));
      }
    });
  },

  /**
    Unregisters this specific device for push notifications.

    Example:

    ```javascript
    // app/routes/application.js
    import Em from 'ember';

    export default Em.Route.extend({
      actions: {
        unsubscribeNotifications: function(){
          this.notifications.unregister().then(function(){
            Em.Logger.info('Successfully unregistered the device');
          }).catch(function(error){
            Em.Logger.error('Something went wrong while unregistering', error);
          });
        }
      }
    });
    ```

    @method unregister
    @return {RSVP.Promise} A promise that will resolve when registration is successful.
  */
  unregister: function(){
    return new Em.RSVP.Promise((resolve, reject) => {
      const pushNotification = window.plugins.pushNotification;
      pushNotification.unregister(resolve, reject, {});
    });
  },

  /**
    Sets up callbacks expected by PushPlugin
    @method _subscribeForEcb
    @private
  */
  _subscribeForEcb: function(){
    window.onNotificationGCM = (e) => {
      switch (e.event) {
        case 'registered':
          if (e.regid.length > 0) {
            Em.Logger.info('Received regid %s from GCM', e.regid);
            this.trigger('_registration', {
              network: 'gcm',
              token: e.regid
            });
          }
          break;
        case 'message':
          // if this flag is set, this notification happened while we were in the foreground.
          // you might want to play a sound to get the user's attention, throw up a dialog, etc.
          if (e.foreground) {
            // on Android soundname is outside the payload.
            // On Amazon FireOS all custom attributes are contained within payload
            let soundfile = e.soundname || e.payload.sound;
            if (soundfile) {
              this.trigger('sound', '/android_asset/www/' + soundfile);
            }

            if (e.payload.message) {
              this.trigger('alert', e.payload.message);
            }

            if (e.payload.msgcnt) {
              this.trigger('badge', e.payload.msgcnt);
            }
          } else if (e.coldstart) {
            // App was launched completely
            // TODO: Handle events
          } else {
            // App was launched from a running background activity
            // TODO: Handle events
          }

          break;
        default:
          Em.Logger.error('Unable to handle %s event type from GCM.', e.event);
      }
    };

    window.onNotificationAPNS = (event) => {
      if (event.alert) {
        this.trigger('alert', event.alert);
      }

      if (event.sound) {
        this.trigger('sound', event.sound);
      }

      if (event.badge) {
        this.trigger('badge', event.badge);
      }
    };
  },

  /**
    Sets the badge count on the app icon if possible. Fails silently.
    @method _setBadgeCount
    @param {Number} badgeCount The current badge count.
    @private
  */
  _setBadgeCount: function(badgeCount){
    new Em.RSVP.Promise(function(resolve, reject){
      const pushNotification = window.plugins.pushNotification;
      pushNotification.setApplicationIconBadgeNumber(resolve, reject, badgeCount);
    }).catch(function(e){
      Em.Logger.error("Failed to set badge. %s", e.message);
    });
  },

  /**
    Plays a sound on the device. Fails silently.
    @method _playSound
    @param {String} filename Filename for the sound to play.
    @private
  */
  _playSound: function(filename){
    if (!window.Media) {
      Em.Logger.warn("Unable to play sound. Media object not available.");
      return;
    }
    let sound = new window.Media(filename);
    sound.play();
  }
});
