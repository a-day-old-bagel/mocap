var physics = {
  oldTime: performance.now(),
  animTime: undefined,
  animMaxTime: undefined,
  pausedTime: undefined,
  bvh: undefined,
  bvhChannels: undefined,
  animHasStarted: false,
  animIsRunning: false,
  animSpeed: 1.0,

  tick: function() {
    this.newTime = performance.now();
    var dt = this.newTime - this.oldTime;

    controls.handleKeys(dt);
    camera.tickShmooze(dt);
    if (this.animIsRunning) {
      var animLoopTime = this.newTime - this.animTime;
      if (animLoopTime > this.animMaxTime) {
        do {
          animLoopTime -= this.animMaxTime;
        } while (animLoopTime > this.animMaxTime)        
        this.animTime = this.newTime - animLoopTime;
      }
      if (this.animSpeed >= 1.0) {
        this.setChannelDataNearest(animLoopTime);
      } else {
        this.setChannelDataInterpolate(animLoopTime);
      }      
    }

    this.oldTime = this.newTime;
  },

  beginAnim: function() {
    this.animTime = performance.now();
    this.animIsRunning = true;
    this.animHasStarted = true;
  },

  pauseAnim: function() {
    this.pausedTime = performance.now();
    this.animIsRunning = false;
  },

  resumeAnim: function() {
    this.animTime += performance.now() - this.pausedTime;
    this.animIsRunning = true;
  },

  toggleAnim: function() {
    if (this.animHasStarted) {
      if (this.animIsRunning) {
        this.pauseAnim();
      } else {
        this.resumeAnim();
      }
    } else {
      this.beginAnim();
    }
  },

  setChannelDataNearest: function(time) {
    this.bvhChannels =
      this.bvh.frames[Math.floor(((time) * 0.001) / this.bvh.frameTime)];
  },

  setChannelDataInterpolate: function(time) {
    var frameT = ((time) * 0.001) / this.bvh.frameTime;
    var frame0 = Math.floor(frameT);
    frameT = frameT - frame0;
    var i;
    for (i = 0; i < this.bvh.numChannels; ++i) {
      this.bvhChannels[i] = this.bvh.frames[fram0][i] +
        (this.bvh.frames[frame0 + 1][i] - this.bvh.frames[frame0][i]) * frameT;
    }
  },

  resetStuff: function() {
    this.bvhChannels = new Array();
    this.animIsRunning = false;
    this.animHasStarted = false;
    this.setChannelDataNearest(0);
  },

  parseNewBVH: function(input) {
    var antlr4 = require('./antlr4/index');
    var BVHLexer = require('./parser/BVHLexer');
    var BVHListener = require('./parser/BVHListener');
    var BVHParser = require('./parser/BVHParser');
    require('./common/BVH');

    var chars = new antlr4.InputStream(input);
    var lexer = new BVHLexer.BVHLexer(chars);
    var tokens  = new antlr4.CommonTokenStream(lexer);
    var parser = new BVHParser.BVHParser(tokens);
    parser.buildParseTrees = true;
    var tree = parser.mocap();

    this.bvh = new BVH();
    antlr4.tree.ParseTreeWalker.DEFAULT.walk(this.bvh, tree);

    this.animMaxTime = this.bvh.frameTime * this.bvh.frames.length * 1000;
    this.resetStuff();

    console.log(this.bvh.toString());
  },

  init: function() {

    // resize balls
    var i;
    for (i = 0; i < ball.vertices.length; ++i) {
      ball.vertices[i] *= 15;
    }

    this.parseNewBVH(testData1);
  }
};
