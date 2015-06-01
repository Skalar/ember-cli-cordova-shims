import { moduleFor, test } from 'ember-qunit';
/* global expect */

moduleFor('service:dialogs', 'Unit | Service | dialogs', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

test('alert | cordova', function(assert) {
  var service = this.subject();
  expect(4);

  window.navigator.notification = {};
  window.navigator.notification.alert = function(message, alertCallback, title, buttonName){
    assert.equal(message, 'Some alert message');
    assert.equal(title, 'Title');
    assert.equal(buttonName, 'OK');
    alertCallback();
  };

  service.alert({
    title: 'Title',
    message: 'Some alert message',
    button: 'OK'
  }).then(function(){
    assert.ok(true);
  });
});

test('alert | fallback', function(assert) {
  var service = this.subject({
    alertFallback: function(message, title, buttonName){
      assert.equal(message, 'Some alert message');
      assert.equal(title, 'Title');
      assert.equal(buttonName, 'OK');
    }
  });
  expect(4);

  delete(window.navigator.notification);

  service.alert({
    title: 'Title',
    message: 'Some alert message',
    button: 'OK'
  }).then(function(){
    assert.ok(true);
  });
});

test('confirm | cordova', function(assert) {
  var service = this.subject();
  expect(4);

  window.navigator.notification = {};
  window.navigator.notification.confirm = function(message, confirmCallback, title, buttonLabels) {
    assert.equal(message, 'Something to confirm');
    assert.equal(title, 'Confirm');
    assert.deepEqual(buttonLabels, ['OK', 'Cancel']);
    confirmCallback(1); // Pressed OK
  };

  service.confirm({
    title: 'Confirm',
    message: 'Something to confirm',
    buttons: [
      'OK',
      'Cancel'
    ]
  }).then(function(buttonIndex){
    assert.equal(buttonIndex, 1);
  });
});

test('confirm | fallback', function(assert) {
  var service = this.subject({
    confirmFallback: function(message, title, buttonLabels){
      assert.equal(message, 'Something to confirm');
      assert.equal(title, 'Confirm');
      assert.deepEqual(buttonLabels, ['OK', 'Cancel']);

      return 1; // Simulate pressed OK
    }
  });
  expect(4);

  delete(window.navigator.notification);

  service.confirm({
    title: 'Confirm',
    message: 'Something to confirm',
    buttons: [
      'OK',
      'Cancel'
    ]
  }).then(function(buttonIndex){
    assert.equal(buttonIndex, 1);
  });
});

test('prompt | cordova', function(assert) {
  var service = this.subject();
  expect(6);

  window.navigator.notification = {};
  window.navigator.notification.prompt = function(message, promptCallback, title, buttonLabels, defaultText) {
    assert.equal(message, 'Something to write');
    assert.equal(title, 'Prompt');
    assert.equal(defaultText, 'foo');
    assert.deepEqual(buttonLabels, ['OK', 'Cancel']);
    promptCallback({
      buttonIndex: 1,
      input1: 'bar'
    }); // Pressed OK
  };

  service.prompt({
    title: 'Prompt',
    message: 'Something to write',
    defaultText: 'foo',
    buttons: [
      'OK',
      'Cancel'
    ]
  }).then(function(result){
    let { buttonIndex, text } = result;
    assert.equal(buttonIndex, 1);
    assert.equal(text, 'bar');
  });
});

test('prompt | fallback', function(assert) {
  var service = this.subject({
    promptFallback: function(message, title, buttonLabels, defaultText){
      assert.equal(message, 'Something to write');
      assert.equal(title, 'Prompt');
      assert.equal(defaultText, 'foo');
      assert.deepEqual(buttonLabels, ['OK', 'Cancel']);
      return {
        text: 'bar',
        buttonIndex: 1 // Simulate pressed OK
      };
    }
  });
  expect(6);

  delete(window.navigator.notification);

  service.prompt({
    title: 'Prompt',
    message: 'Something to write',
    defaultText: 'foo',
    buttons: [
      'OK',
      'Cancel'
    ]
  }).then(function(result){
    let { text, buttonIndex } = result;
    assert.equal(buttonIndex, 1);
    assert.equal(text, 'bar');
  });
});
