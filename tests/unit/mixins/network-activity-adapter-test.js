import Ember from 'ember';
import NetworkActivityAdapterMixin from '../../../mixins/network-activity-adapter';
import { module, test } from 'qunit';
/* global expect */

module('Unit | Mixin | network activity adapter', {
  beforeEach: function(){
    window.NetworkActivity = Ember.Object.create({
      active: false,
      activityStart: function(){
        this.set('active', true);
      },
      activityStop: function(){
        this.set('active', false);
      }
    });
  },

  afterEach: function(){
    delete window.NetworkActivity;
  }
});

test('it starts/stops activity indicator when ajax is called', function(assert) {
  let done = assert.async();
  expect(3);

  var BaseAdapter = Ember.Object.extend({
    ajax: function(){
      assert.equal(window.NetworkActivity.get('active'), true);
      return Ember.RSVP.resolve();
    }
  });

  var NetworkActivityAdapterObject = BaseAdapter.extend(NetworkActivityAdapterMixin);

  var subject = NetworkActivityAdapterObject.create();
  assert.equal(window.NetworkActivity.get('active'), false);
  subject.ajax().finally(function(){
    Ember.run.later(function(){
      assert.equal(window.NetworkActivity.get('active'), false);
      done();
    });
  });
});

test("it doesn't affect the resolved value", function(assert) {
  let done = assert.async();
  expect(2);

  var BaseAdapter = Ember.Object.extend({
    ajax: function(){
      return Ember.RSVP.resolve({ foo: 'bar' });
    }
  });

  var NetworkActivityAdapterObject = BaseAdapter.extend(NetworkActivityAdapterMixin);

  var subject = NetworkActivityAdapterObject.create();
  subject.ajax().then(function(data){
    assert.deepEqual(data, { foo: 'bar' });
  }).finally(function(){
    Ember.run.later(function(){
      assert.equal(window.NetworkActivity.get('active'), false);
      done();
    });
  });
});

test("it doesn't affect catch", function(assert) {
  let done = assert.async();
  expect(2);

  var BaseAdapter = Ember.Object.extend({
    ajax: function(){
      return Ember.RSVP.reject(new Error('some reason'));
    }
  });

  var NetworkActivityAdapterObject = BaseAdapter.extend(NetworkActivityAdapterMixin);

  var subject = NetworkActivityAdapterObject.create();
  subject.ajax().catch(function(reason){
    assert.equal(reason.message, 'some reason');
  }).finally(function(){
    Ember.run.later(function(){
      assert.equal(window.NetworkActivity.get('active'), false);
      done();
    });
  });
});
