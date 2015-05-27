# Ember CLI Cordova Shims

This Ember addon makes it simple to use a range of different Cordova plugins.

## Supported features

### Push Notifications

Dependencies:

* `cordova plugin add org.apache.cordova.device`
* `cordova plugin add https://github.com/phonegap-build/PushPlugin.git`

Automatic behavior:

* Badge count will be set on the application on incoming notification
* Sounds will play on incoming notification (if set in the payload)

Events:

* `alert` - passes the message in the notification
* `badge` - passes a badge count with every emitted event
* `sound` - passes the filename of the sound to play

Public Methods:

* `register` - Prompts the user to allow notifications to this device
* `unregister` - Revokes notification subscription for this device

Usage:

```javascript
// app/initializers/pushplugin.js
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

```javascript
// app/routes/application.js
import Em from 'ember';

export default Em.Route.extend({

  badge: 0,

  listenForNotifications: function(){
    this.notifications.on('alert', function(message){
      alert(message); // or do whatever you want
    });
    this.notifications.on('badge', function(message){
      alert(message); // or do whatever you want
    });
  }.on('init'),

  actions: {
    subscribeForNotifications: function(){
      this.notifications.register().then(function(){
        Em.Logger.info('Successfully registered for notifications');
      }).catch(function(error){
        Em.Logger.error('Something went wrong registering for notifications', error);
      });
    },

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

Caveats:

* PushPlugin has a weird setup for registering devices with GCM. There is a timeout
of 15 seconds when doing a registration with GCM. If GCM does not send a `registered`
event within this timeframe, the device is not registered. The timeout value may be
overridden by passing `gcmTimeout` when instantiating the service.

## Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
