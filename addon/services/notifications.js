import Em from 'ember';

export default Em.Service.extend(Em.Evented, {

  gcmSenderId: null,
  gcmTimeout: 15000,

  init: function(){
    this._subscribeForEcb();
    this.on('badge', this, this._setBadgeCount);
    this.on('sound', this, this._playSound);
  },

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

  _setBadgeCount: function(badgeCount){
    new Em.RSVP.Promise(function(resolve, reject){
      const pushNotification = window.plugins.pushNotification;
      pushNotification.setApplicationIconBadgeNumber(resolve, reject, badgeCount);
    }).catch(function(e){
      Em.Logger.error("Failed to set badge. %s", e.message);
    });
  },

  _playSound: function(filename){
    if (!window.Media) {
      Em.Logger.warn("Unable to play sound. Media object not available.");
      return;
    }
    let sound = new window.Media(filename);
    sound.play();
  },

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

  unregister: function(){
    return new Em.RSVP.Promise((resolve, reject) => {
      const pushNotification = window.plugins.pushNotification;
      pushNotification.unregister(resolve, reject, {});
    });
  }

});
