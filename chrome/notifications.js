"use strict";

(function() {

  function init() {
  }

  Espruino.Core.Notifications = {
      init : init,
      success: function(msg, setStatus) {
        if(setStatus)
          Espruino.Core.Status.setStatus(msg);
      },

      error: function(msg, setStatus) {
        if(setStatus)
          Espruino.Core.Status.setStatus(msg);
      },

      warning: function(msg, setStatus) {
        if(setStatus)
          Espruino.Core.Status.setStatus(msg);
      },

      info: function(msg, setStatus) {
        if(setStatus)
          Espruino.Core.Status.setStatus(msg);
      }
  };
  
})();
