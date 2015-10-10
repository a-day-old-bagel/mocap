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
  physics.animate();
}

/**------------------------------------------------------------
// Destruction
//-----------------------------------------------------------*/
window.onunload = function destroy() {
  graphics.destroy();
  physics.destroy();
};




var canvas;
var gl;

// Viewing
var aspect = 1.0;

// Data
var bvh;

var reader = new FileReader();
reader.onload = function(e) {
  var text = reader.result;
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Parses a BVH file and places the result in the bvh variable.
 */
function parse(input) {
  var antlr4 = require('antlr4/index');
  var BVHLexer = require('parser/BVHLexer');
  var BVHListener = require('parser/BVHListener');
  var BVHParser = require('parser/BVHParser');
  require('./BVH');

  var chars = new antlr4.InputStream(input);
  var lexer = new BVHLexer.BVHLexer(chars);
  var tokens  = new antlr4.CommonTokenStream(lexer);
  var parser = new BVHParser.BVHParser(tokens);
  parser.buildParseTrees = true;
  var tree = parser.mocap();

  bvh = new BVH();
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(bvh, tree);

  // TODO: add any initialization code upon loading a BVH file
  console.log(bvh);
}

function keyDown(e) {
  switch (e.keyCode) {
  case 37:
    // left
    break;
  case 38:
    // up
    break;
  case 39:
    // right
    break;
  case 40:
    // down
    break;
  case 32:
    // spacebar
    break;
  case "F".charCodeAt(0):
    // F or f
    break;
  default:
    // To see what the code for a certain key is, uncomment this line,
    // reload the page in the browser and press the key.
    // console.log("Unrecognized key press: " + e.keyCode);
    break;
  }
}

window.onload = function init() {
  document.onkeydown = keyDown;

  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.width, canvas.height);
  aspect = canvas.width/canvas.height;

  // Awesome green background.
  gl.clearColor(0.0, 0.7, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers

  // Listen for a file to be loaded and parse
  var fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', function(e) {
    var file = fileInput.files[0];
    if (file && file.name) {
      if (file.name.match(/.*\.bvh/)) {
        var reader = new FileReader();
        reader.onload = function(e) {
          parse(reader.result);
        }
        reader.readAsText(file);	
      } else {
        console.log("File not supported! " + file.type);
      }
    }
  });

  // Parse a default file.
  // TODO: change this to testData1 when you're ready to start rendering
  // animation. These strings are defined in test1.bvh.js and test2.bvh.js.
  parse(testData2);

  render();
}
