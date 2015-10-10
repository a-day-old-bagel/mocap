var physics = {
  cBallStart: vec2(0.0, 1.2),
  cueOffsetY: 0.02,
  ballRadius: 0.0575,
  ballDiam: undefined,
  ballVelDead: 0.00001,
  ballCircum: undefined,
  tableBoundsZ: 1.6558,
  tableBoundsX: 0.823,
  cPockSize: 0.06,
  cPockRad: 0.06,
  sPockSize: 0.07,
  sPockRad: 0.06,
  sPockMargin: 0.03,
  oldTime: performance.now(),
  readyToStrike: false,
  isScratched: false,

  animate: function() {

    this.newTime = performance.now();
    var dt = this.newTime - this.oldTime;

    camera.tickShmooze(dt);

    var aBallHasMoved = false;
    for (i = 0; i < 16; ++i) {
      if (ball.isMoving[i] && ball.isActive[i]) {
        aBallHasMoved = true;
        var oldPos = ball.position[i];
        ball.position[i] = add(ball.position[i], scale(dt, ball.velocity[i]));

        // ball collisions
        for (j = 0; j < 16; ++j) {
          if (j == i || ball.isActive[j] == false) {
            continue;
          }
          var vec21 = subtract(ball.position[i], ball.position[j]);
          var len21 = length(vec21);
          if (len21 < this.ballDiam) {  // if balls are colliding
            var vel1i = ball.velocity[i];
            var refFrameCompensator = undefined;
            if (ball.isMoving[j]) { // if both balls are in motion,
                                    // use Gallilean reference frames
                                    // to resolve collision as a
                                    // single-ball-moving scenario
              refFrameCompensator = ball.velocity[j];
              vel1i = subtract(vel1i, refFrameCompensator);
            } else {
              refFrameCompensator = null;
            }
            // now here's the single-ball-moving problem that
            // will always be easy to solve
            var magVel1i = length(vel1i);
            var normVel1i = scale(1 / magVel1i, vel1i);
            var vec21DotVel1i = dot(vec21, vel1i);
            var projVel1iVec21 = scale(vec21DotVel1i / dot(vel1i, vel1i),
              vel1i);
            var orthoVel1i = subtract(vec21, projVel1iVec21);
            var distNearestTo2 = length(orthoVel1i);
            var trueCollCorrection = Math.sqrt(Math.pow(this.ballDiam, 2) -
              Math.pow(distNearestTo2, 2));
            // this is clip-corrected point of collision as vec from ball 2 to 1
            var trueVec21 = subtract(orthoVel1i, scale(trueCollCorrection,
              normVel1i));
            var normTrueVec12 = scale(-1 / length(trueVec21), trueVec21);
            var weight = dot(normTrueVec12, normVel1i);

            var pos1f = add(ball.position[j], trueVec21);
            var extraMovement = length(subtract(ball.position[i], pos1f));

            var vel2f = scale(weight * magVel1i, normTrueVec12);
            var pos2f = add(ball.position[j], scale(extraMovement * weight,
              normTrueVec12));

            var vel1f = subtract(vel1i, vel2f);
            var normVel1f = scale(1 / length(vel1f), vel1f);
            pos1f = add(pos1f, scale((1 - weight) * extraMovement, normVel1f));            

            if (refFrameCompensator != null) {
              vel1f = add(vel1f, refFrameCompensator);
              vel2f = add(vel2f, refFrameCompensator);
            }

            ball.position[i] = pos1f;
            ball.position[j] = pos2f;
            ball.velocity[i] = vel1f;
            ball.velocity[j] = vel2f;
            ball.isMoving[j] = true;
          }
        }

        // bumper and pocket collisions
        if (ball.position[i][1] > this.tableBoundsZ) {
          if (Math.abs(ball.position[i][0]) < this.tableBoundsX -
              this.cPockSize) {
            ball.position[i][1] = this.tableBoundsZ - (ball.position[i][1] -
              this.tableBoundsZ);
            ball.velocity[i][1] *= -0.9;
          } else if (ball.position[i][0] > 0) {
            if (ball.position[i][0] > this.tableBoundsX + this.cPockRad ||
                ball.position[i][1] > this.tableBoundsZ + this.cPockRad) {
              this.ballInPocket(i);
              continue;
            }
          } else {
            if (ball.position[i][0] < -this.tableBoundsX - this.cPockRad ||
              ball.position[i][1] > this.tableBoundsZ + this.cPockRad) {
              this.ballInPocket(i);
              continue;
            }
          }
        } else if (ball.position[i][1] < -this.tableBoundsZ) {
          if (Math.abs(ball.position[i][0]) < this.tableBoundsX -
              this.cPockSize) {
            ball.position[i][1] = -this.tableBoundsZ - (ball.position[i][1] +
              this.tableBoundsZ);
            ball.velocity[i][1] *= -0.9;
          } else if (ball.position[i][0] > 0) {
            if (ball.position[i][0] > this.tableBoundsX + this.cPockRad ||
              ball.position[i][1] < -this.tableBoundsZ - this.cPockRad) {
              this.ballInPocket(i);
          	  continue;
            }
          } else {
            if (ball.position[i][0] < -this.tableBoundsX - this.cPockRad ||
              ball.position[i][1] < -this.tableBoundsZ - this.cPockRad) {
              this.ballInPocket(i);
          	  continue;
            }
          }
        }
        if (ball.position[i][0] > this.tableBoundsX) {
          if (Math.abs(ball.position[i][1]) > this.sPockSize +
              this.sPockMargin && Math.abs(ball.position[i][1]) <
              this.tableBoundsZ - this.cPockSize) {
            ball.position[i][0] = this.tableBoundsX - (ball.position[i][0] -
              this.tableBoundsX);
            ball.velocity[i][0] *= -0.9;
          } else if (Math.abs(ball.position[i][1]) <= this.sPockSize) {
            if (ball.position[i][0] > this.tableBoundsX + this.sPockRad) {
              this.ballInPocket(i);
              continue;
            }
          } else if ((Math.abs(ball.position[i][1]) <= this.sPockSize +
              this.sPockMargin)) {
            ball.velocity[i][1] *= -0.9;
            if (ball.position[i][0] > this.tableBoundsX + this.sPockRad) {
              this.ballInPocket(i);
              continue;
            }
          } else if (ball.position[i][0] > this.tableBoundsX + this.cPockRad) {
          	this.ballInPocket(i);
            continue;
          }
        } else if (ball.position[i][0] < -this.tableBoundsX) {
          if (Math.abs(ball.position[i][1]) > this.sPockSize +
              this.sPockMargin && Math.abs(ball.position[i][1]) <
              this.tableBoundsZ - this.cPockSize) {
            ball.position[i][0] = -this.tableBoundsX - (ball.position[i][0] +
              this.tableBoundsX);
            ball.velocity[i][0] *= -0.9;
          } else if (Math.abs(ball.position[i][1]) <= this.sPockSize) {
            if (ball.position[i][0] < -this.tableBoundsX - this.sPockRad) {
              this.ballInPocket(i);
              continue;
            }
          } else if ((Math.abs(ball.position[i][1]) <= this.sPockSize +
              this.sPockMargin)) {
            ball.velocity[i][1] *= -0.9;
            if (ball.position[i][0] < -this.tableBoundsX - this.sPockRad) {
              this.ballInPocket(i);
              continue;
            }
          } else if (ball.position[i][0] < -this.tableBoundsX - this.cPockRad) {
          	this.ballInPocket(i);
            continue;
          }
        }

        // apply velocity damping (physics phriction phudge)
        ball.velocity[i] = scale(0.99, ball.velocity[i]);
        if (length(ball.velocity[i]) < this.ballVelDead) {
          ball.isMoving[i] = false;
          ball.velocity[i] = [0, 0];
        }

        // calculate visual rotation based on translation
        oldPos = subtract(ball.position[i], oldPos);
        if (length(oldPos) > 0) {
          ball.angle[i] = length(oldPos) * this.ballCircum;
          ball.axis[i] = normalize(cross([oldPos[0], 0, oldPos[1]],
            [0, -1, 0]));
        }
      }
    }

    // determine if all balls have stopped
    if (!aBallHasMoved && !this.readyToStrike) {
      camera.changeZoomFocus(
        vec3(ball.mat_model[0][0][3],
        ball.yPlane + 0.14,
        ball.mat_model[0][2][3]));
      cue.focus = [ball.position[0][0], 0.0, ball.position[0][1]];
      if (this.isScratched) {
        ball.isActive[0] = true;
        this.isScratched = false;
      }
      this.readyToStrike = true;
    }

    // continue cue stick animation if in progress
    if (cue.strikeAnimCounter > 0) {
      cue.strikeAnim(dt);
    }

    this.oldTime = this.newTime;
  },

  ballInPocket: function(ballNum) {
    if (ballNum == 0) {
      alert('SCRATCH!');
      this.newTime = performance.now();
      this.isScratched = true;
      ball.position[0] = [0, 0];
      ball.velocity[0] = [0, 0.00002];
    } else if (ballNum == 8) {
      alert('8-BALL IN!');
      this.resetGame();
      return;
    }
    ball.isActive[i] = false;
  },

  resetGame: function() {
    ball.angle = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    ball.velocity = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
    ball.isActive = [true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true];
    ball.isMoving = [true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true];
    this.setUpBalls();
  },

  strikeCueBall: function() {
    if (length(arrow.vec_whack) > this.ballVelDead) {
      ball.velocity[0][0] += arrow.vec_whack[0] * 0.01;
      ball.velocity[0][1] += arrow.vec_whack[1] * 0.01;
      ball.isMoving[0] = true;
      this.readyToStrike = false;
    }
  },

  setUpBalls: function() { // move balls into starting triangle
    var triPosZ = -0.5;
    var spacingZ = 0.15; // modify this one to change spacing
    var halfSpcX = spacingZ * 0.55;
    ball.position[0] = vec2(this.cBallStart[0], this.cBallStart[1]);
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

  init: function() {
    this.ballDiam = this.ballRadius * 2;
    this.ballCircum = 360 / (this.ballRadius * Math.PI * 2);
    cue.init(ball.yPlane, this.ballRadius);
    this.setUpBalls();
  },

  destroy: function() {
    console.log('Physics Self-Destruct');
  }
};
