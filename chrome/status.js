"use strict";
(function(){
  
  function init() {
  }
  
  function setStatus(text, progress) {
    console.log(">>> "+ text);    
  }

  function hasProgress() {
    return true; // TODO: remove?
  }    
  
  function incrementProgress(amount) {
  }  
  
  Espruino.Core.Status = {
      init : init,
      setStatus : setStatus,
      hasProgress : hasProgress,
      incrementProgress : incrementProgress,
  };
}());
