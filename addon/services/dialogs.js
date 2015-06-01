import Ember from 'ember';
import missingPlugin from '../utils/missing-plugin';

/**
  Service that allows for displaying native dialogs for user interaction.

  Configuration and setup of the service is done in an initializer:

  ```javascript
  import DialogsService from 'cordova-shims/services/dialogs';

  export function initialize(container, application) {
    application.register('service:dialogs', DialogsService);
    application.inject('route', 'dialogs', 'service:dialogs');
  }

  export default {
    name: 'dialogs-service',
    initialize: initialize
  };
  ```

  The service has an interface for defining custom fallback methods for each
  dialog type.

  - alertFallback
  - confirmFallback
  - promptFallback

  If your app targets both browser and native platforms, you should provide your
  own implementation of these fallbacks methods. There are simple default methods
  defined to get you started quickly.

  @class Dialogs
  @namespace CordovaShims.Services
  @module cordova-shims/services/dialogs
  @extends Ember.Service
  @since 0.2.0
 */
export default Ember.Service.extend({
  init: function(){
    if (!window.navigator.notification) {
      missingPlugin('cordova-plugin-dialogs', 'https://github.com/apache/cordova-plugin-dialogs.git');
    }
  },

  /**
    Display an alert box to the user with a title, message and a customizable button name.

    Example:

    ```javascript
    DialogsService.create().alert({
      title: 'Something important',
      message: 'This just happened!',
      button: 'OK'
    });
    ```

    @method alert
    @param {Object} options
    @param {String} options.title Title for the alert box
    @param {String} options.message Message to show in the alert box
    @param {String} options.button Text for the button that dismisses the alert box
    @return {RSVP.Promise} A promise that will resolve when alert is dismissed.
  */
  alert: function(options){
    let { title, message, button } = options;

    if (!window.navigator.notification) {
      return Ember.RSVP.resolve(this.alertFallback(message, title, button));
    }

    return new Ember.RSVP.Promise(function(resolve){
      window.navigator.notification.alert(message, resolve, title, button);
    });
  },

  /**
    Display a confirm box to the user with a title, message and customizable button names.

    Example:

    ```javascript
    DialogsService.create().confirm({
      title: 'Something important',
      message: 'This just happened!',
      buttons: [
        'OK',
        'Cancel'
      ]
    });
    ```

    @method confirm
    @param {Object} options
    @param {String} options.title Title for the confirm box
    @param {String} options.message Message to show in the confirm box
    @param {Array} options.buttons Text for the button that dismisses the confirm box
    @return {RSVP.Promise} A promise that will resolve with the index of the button pressed (1-indexed).
  */
  confirm: function(options){
    let { title, message, buttons } = options;

    if (!window.navigator.notification) {
      return Ember.RSVP.resolve(this.confirmFallback(message, title, buttons));
    }

    return new Ember.RSVP.Promise(function(resolve){
      window.navigator.notification.confirm(message, resolve, title, buttons);
    });
  },


  /**
    Display a prompt to the user with a title, message, text input and a customizable button name.

    Example:

    ```javascript
    DialogsService.create().prompt({
      title: 'Please provide some info',
      message: 'We need to know something.',
      defaultText: 'foo',
      buttons: [
        'OK',
        'Cancel'
      ]
    });
    ```

    @method prompt
    @param {Object} options
    @param {String} options.title Title for the confirm box
    @param {String} options.message Message to show in the confirm box
    @param {Array} options.buttons Text for the button that dismisses the confirm box
    @return {RSVP.Promise} A promise that will resolve with the following:

        {
          text: "{text-from-input}",
          buttonIndex: 1 // Index of the button pressed
        }
  */
  prompt: function(options){
    let { title, message, buttons, defaultText } = options;

    if (!window.navigator.notification) {
      return Ember.RSVP.resolve(this.promptFallback(message, title, buttons, defaultText));
    }

    return new Ember.RSVP.Promise(function(resolve){
      let callback = function(result){
        let { input1, buttonIndex } = result;
        resolve({ text: input1, buttonIndex });
      };
      window.navigator.notification.prompt(message, callback, title, buttons, defaultText);
    });
  },

  /**
    Hook that gets triggered if the plugin API is not available. Useful for handling
    dialogs in a browser environment.

    @property alertFallback
    @type Function
  */
  alertFallback: function(message, title, buttonName){
    Ember.Logger.warn('Using alert fallback for cordova dialogs shim.');
    Ember.Logger.warn('You should override the alertFallback method in the dialogs service.');
    window.alert(title+"\n"+message+"\n\n"+buttonName);
  },

  /**
    Hook that gets triggered if the plugin API is not available. Useful for handling
    dialogs in a browser environment.

    @property confirmFallback
    @type Function
  */
  confirmFallback: function(message, title, buttonLabels){
    Ember.Logger.warn('Using confirm fallback for cordova dialogs shim.');
    Ember.Logger.warn('You should override the confirmFallback method in the dialogs service.');
    if (window.confirm(title+"\n"+message+"\n\n"+buttonLabels.join(" "))) {
      return 1;
    } else {
      return 2;
    }
  },

  /**
    Hook that gets triggered if the plugin API is not available. Useful for handling
    dialogs in a browser environment.

    @property promptFallback
    @type Function
  */
  promptFallback: function(message, title, buttonLabels, defaultText){
    Ember.Logger.warn('Using confirm fallback for cordova dialogs shim.');
    Ember.Logger.warn('You should override the promptFallback method in the dialogs service.');
    let text = window.prompt(title+"\n"+message+"\n\n"+buttonLabels.join(" "), defaultText);
    let buttonIndex = 1;
    if (!text) {
      buttonIndex = 2;
    }
    return { buttonIndex, text };
  }
});
