"use strict";



/**------------------------------------------------------------
// Initialization
//-----------------------------------------------------------*/
window.onload = function init() {
  var canvas = document.getElementById('gl-canvas');
  physics.init();
  graphics.init(canvas);
  controls.setUpEvents(canvas);
  tick();
};

//------------------------------------------------------------
// Game Loop
//------------------------------------------------------------
function tick() {
  requestAnimFrame(tick);
  graphics.render();
  physics.tick();
}
