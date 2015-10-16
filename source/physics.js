var physics = {
  oldTime: performance.now(),
  currentBVH: undefined,


  tick: function() {
    this.newTime = performance.now();
    var dt = this.newTime - this.oldTime;

    controls.handleKeys(dt);
    camera.tickShmooze(dt);

    this.oldTime = this.newTime;
  },

  setUpBalls: function() { // move balls into starting triangle
    var triPosZ = -0.5;
    var spacingZ = 0.15; // modify this one to change spacing
    var halfSpcX = spacingZ * 0.55;
    ball.position[0] = [0, 0];
    ball.position[1] = vec2(halfSpcX * 0, triPosZ - spacingZ * 0);
    ball.position[2] = vec2(halfSpcX * 2, triPosZ - spacingZ * 4);
    ball.position[3] = vec2(halfSpcX * -2, triPosZ - spacingZ * 4);
    ball.position[4] = vec2(halfSpcX * -4, triPosZ - spacingZ * 4);
    ball.position[5] = vec2(halfSpcX * 3, triPosZ - spacingZ * 3);
    ball.position[6] = vec2(halfSpcX * -2, triPosZ - spacingZ * 2);
    ball.position[7] = vec2(halfSpcX * -1, triPosZ - spacingZ * 3);
    ball.position[8] = vec2(halfSpcX * 0, triPosZ - spacingZ * 2);
    ball.position[9] = vec2(halfSpcX * 2, triPosZ - spacingZ * 2);
    ball.position[10] = vec2(halfSpcX * -1, triPosZ - spacingZ * 1);
    ball.position[11] = vec2(halfSpcX * 1, triPosZ - spacingZ * 1);
    ball.position[12] = vec2(halfSpcX * 1, triPosZ - spacingZ * 3);
    ball.position[13] = vec2(halfSpcX * -3, triPosZ - spacingZ * 3);
    ball.position[14] = vec2(halfSpcX * 0, triPosZ - spacingZ * 4);
    ball.position[15] = vec2(halfSpcX * 4, triPosZ - spacingZ * 4);
    for (i = 0; i < 16; ++i) {
      ball.mat_oldRot[i] = rotateX(90);
    }
  },

  /**
  * Parses a BVH file and places the result in the bvh variable.
  */
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

    this.currentBVH = new BVH();
    antlr4.tree.ParseTreeWalker.DEFAULT.walk(this.currentBVH, tree);

    // TODO: add any initialization code upon loading a BVH file
    console.log(this.currentBVH);
  },

  init: function() {
    this.setUpBalls();

    // Parse a default file.
    // TODO: change this to testData1 when you're ready to start rendering
    // animation. These strings are defined in test1.bvh.js and test2.bvh.js.
    this.parseNewBVH(testData2);
  }
};
