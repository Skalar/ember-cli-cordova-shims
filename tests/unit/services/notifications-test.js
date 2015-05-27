import { moduleFor, test } from 'ember-qunit';
/* global expect */

moduleFor('service:notifications', 'Unit | Service | notifications', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

// Replace this with your real tests.
test('subscribeForEcb', function(assert) {
  var service = this.subject();
  assert.equal(typeof(window.onNotificationGCM), 'function');
  assert.equal(typeof(window.onNotificationAPNS), 'function');
});

test('onNotificationGCM | registered', function(assert) {
  expect(2);
  var service = this.subject();

  service.on('_registration', function(data){
    assert.equal(data.network, 'gcm');
    assert.equal(data.token, 'fcbb70da-3c3d-40f8-a747-576f0a763c96');
  });

  window.onNotificationGCM({
    event: 'registered',
    regid: 'fcbb70da-3c3d-40f8-a747-576f0a763c96'
  });
});

test('onNotificationGCM | registered', function(assert) {
  expect(2);
  var service = this.subject();

  service.on('_registration', function(data){
    assert.equal(data.network, 'gcm');
    assert.equal(data.token, 'fcbb70da-3c3d-40f8-a747-576f0a763c96');
  });

  window.onNotificationGCM({
    event: 'registered',
    regid: 'fcbb70da-3c3d-40f8-a747-576f0a763c96'
  });
});

test('onNotificationGCM | message', function(assert) {
  expect(4);
  var service = this.subject();

  window.plugins = {
    pushNotification: {
      setApplicationIconBadgeNumber: function(success, reject, badgeCount) {
        assert.equal(badgeCount, 5);
        success();
      }
    }
  };

  service.on('sound', function(filename){
    assert.equal(filename, '/android_asset/www/somesound.aiff');
  });

  service.on('alert', function(message){
    assert.equal(message, 'This is a message');
  });

  service.on('badge', function(count){
    assert.equal(count, 5);
  });

  window.onNotificationGCM({
    foreground: true,
    event: 'message',
    soundname: 'somesound.aiff',
    payload: {
      message: 'This is a message',
      msgcnt: 5
    }
  });
});

test('onNotificationAPN | plain notification', function(assert) {
  expect(4);
  var service = this.subject();

  window.plugins = {
    pushNotification: {
      setApplicationIconBadgeNumber: function(success, reject, badgeCount) {
        assert.equal(badgeCount, 5);
        success();
      }
    }
  };

  service.on('sound', function(filename){
    assert.equal(filename, 'somesound.aiff');
  });

  service.on('alert', function(message){
    assert.equal(message, 'This is a message');
  });

  service.on('badge', function(count){
    assert.equal(count, 5);
  });

  window.onNotificationAPNS({
    sound: 'somesound.aiff',
    alert: 'This is a message',
    badge: 5
  });
});

test('register | iOS', function(assert){
  expect(7);
  var service = this.subject();

  window.device = {
    platform: 'iOS'
  };

  window.plugins = {
    pushNotification: {
      register: function(success, reject, config) {
        assert.equal(config.ecb, "onNotificationAPNS");
        assert.ok(config.badge);
        assert.ok(config.sound);
        assert.ok(config.alert);
        success('8db8e324-5831-4e32-b325-67e2c10d3568');
      }
    }
  };

  service.on('_registration', function(data){
    assert.equal(data.network, 'apns');
    assert.equal(data.token, '8db8e324-5831-4e32-b325-67e2c10d3568');
  });

  service.register().then(function(){
    assert.ok(true);
  });
});

test('register | Android', function(assert){
  expect(3);
  var service = this.subject({
    gcmSenderId: '124817264812'
  });

  window.device = {
    platform: 'Android'
  };

  window.plugins = {
    pushNotification: {
      register: function(success, reject, config) {
        assert.equal(config.ecb, "onNotificationGCM");
        assert.equal(config.senderId, '124817264812'); // TODO: Fix this!
        success();
        service.trigger('_registration', {
          event: 'registered',
          regid: 'fcbb70da-3c3d-40f8-a747-576f0a763c96'
        });
      }
    }
  };

  service.register().then(function(){
    assert.ok(true);
  });
});

test('register | Android | without gcmSenderId', function(assert){
  expect(1);
  var service = this.subject();

  window.device = {
    platform: 'Android'
  };

  window.plugins = {
    pushNotification: {
      register: function() {}
    }
  };

  service.register().catch(function(error){
    assert.equal(error.message, 'Assertion Failed: Attempted to register device for notifications with GCM Sender ID');
  });
});

test('register | Amazon FireOS', function(assert){
  expect(3);
  var service = this.subject({
    gcmSenderId: '124817264812'
  });

  window.device = {
    platform: 'Amazon-FireOS'
  };

  window.plugins = {
    pushNotification: {
      register: function(success, reject, config) {
        assert.equal(config.ecb, "onNotificationGCM");
        assert.equal(config.senderId, '124817264812'); // TODO: Fix this!
        success();
        service.trigger('_registration', {
          event: 'registered',
          regid: 'fcbb70da-3c3d-40f8-a747-576f0a763c96'
        });
      }
    }
  };

  service.register().then(function(){
    assert.ok(true);
  });
});

test('register | Amazon FireOS | without config', function(assert){
  expect(1);
  var service = this.subject();

  window.device = {
    platform: 'Amazon-FireOS'
  };

  window.plugins = {
    pushNotification: {
      register: function() {}
    }
  };

  service.register().catch(function(error){
    assert.equal(error.message, 'Assertion Failed: Attempted to register device for notifications with GCM Sender ID');
  });
});


test('unregister | success', function(assert){
  expect(1);
  var service = this.subject();

  window.plugins = {
    pushNotification: {
      unregister: function(success, reject, options) {
        success();
      }
    }
  };

  service.unregister().then(function(){
    assert.ok(true);
  });
});

test('unregister | failure', function(assert){
  expect(1);
  var service = this.subject();

  window.plugins = {
    pushNotification: {
      unregister: function(success, error, options) {
        error('Something went wrong');
      }
    }
  };

  service.unregister().catch(function(reason){
    assert.equal(reason, 'Something went wrong');
  });
});
