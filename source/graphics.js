var graphics = {

  gl: undefined,
  vao_ext: undefined,
  shdr_prog: undefined,
  shdr_unif_matVP: undefined,
  shdr_unif_matM: undefined,
  shdr_unif_samp: undefined,
  shdr_unif_cPos: undefined,
  shdr_unif_lPos: undefined,
  shdr_unif_lDir: undefined,
  shdr_unif_gCol: undefined,
  shdrSky_prog: undefined,
  shdrSky_unif_invMat: undefined,
  shdrSky_unif_sampler: undefined,
  width: undefined,
  height: undefined,
  sky: undefined,
  skyTex: undefined,
  whichSky: 0,
  mStack: [],
  renderLimbs: true,

  render: function() {
    gl.clear(gl.DEPTH_BUFFER_BIT);    
    camera.updateVPMat();
    gl.useProgram(this.shdr_prog);
    gl.uniform3f(this.shdr_unif_cPos, camera.vec_eye[0],
      camera.vec_eye[1], camera.vec_eye[2]);
    gl.uniformMatrix4fv(this.shdr_unif_matVP, gl.FALSE, flatten(camera.mat_vp));

    gl.uniform3f(this.shdr_unif_gCol, ball.colors[ball.colorCounter][0],
      ball.colors[ball.colorCounter][1], ball.colors[ball.colorCounter][2]);     
    this.drawObjMatStack(ball);
    
    gl.uniform3f(this.shdr_unif_gCol, floor.colors[floor.colorCounter][0],
      floor.colors[floor.colorCounter][1], floor.colors[floor.colorCounter][2]);
    gl.uniform1f(this.shdr_unif_refr, floor.refrIndex);
    this.drawObj(floor);

    gl.useProgram(this.shdrSky_prog);
    this.drawSky(this.sky);
  },

  drawSky: function() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyVertexBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var mat = camera.getVP_inverse();
    gl.uniformMatrix4fv(this.shdrSky_unif_invMat, false, flatten(mat));

    gl.drawArrays(gl.TRIANGLES, 0, this.skyVertCount);
  },

  drawObjMatStackRecurse: function(obj, segment) {
    this.mStack.push(
      mult(
        this.mStack[this.mStack.length - 1],
        translate(segment.offsets[0], segment.offsets[1], segment.offsets[2])  
      )
    );
 
    if (this.renderLimbs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(this.shdr_unif_refr, ball.refrIndex);
    }

    gl.uniformMatrix4fv(this.shdr_unif_matM, gl.FALSE,
      flatten(this.mStack[this.mStack.length - 1]));
    gl.drawArrays(gl.TRIANGLES, 0, obj.triCount);

    this.mStack.push(
      mult(
        this.mStack[this.mStack.length - 1],
        this.rotationMatRequested(
          segment.channels, 0,
          physics.bvhChannels[segment.channelOffset + 0],
          physics.bvhChannels[segment.channelOffset + 1],
          physics.bvhChannels[segment.channelOffset + 2]
        )        
      )
    );
    var i;
    for (i = 0; i < segment.children.length; ++i) {
      this.drawObjMatStackRecurse(obj, segment.children[i]);

      if (this.renderLimbs) {
        this.mStack.push(
          mult(
            this.mStack[this.mStack.length - 1],
            scalem(
              segment.children[i].offsets[0],
              segment.children[i].offsets[1],
              segment.children[i].offsets[2]
            )
          )
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, stick.vertexBuffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, stick.normalBuffer);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(this.shdr_unif_matM, gl.FALSE,
          flatten(this.mStack[this.mStack.length - 1]));
        gl.uniform1f(this.shdr_unif_refr, stick.refrIndex);
        gl.drawArrays(gl.TRIANGLES, 0, stick.triCount);
        this.mStack.pop();
      }
    }

    this.mStack.pop();

    this.mStack.pop();
  },

  drawObjMatStack: function(obj) {
    if (!this.renderLimbs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(this.shdr_unif_refr, ball.refrIndex);
    }
    
    var i;
    var newFocus = vec3();
    try {
      for (i = 0; i < physics.bvh.roots.length; ++i) {
        this.mStack.push(
          mult(
            translate(
              physics.bvhChannels[physics.bvh.roots[i].channelOffset + 0],
              physics.bvhChannels[physics.bvh.roots[i].channelOffset + 1],
              physics.bvhChannels[physics.bvh.roots[i].channelOffset + 2]
            ),
            this.rotationMatRequested(
              physics.bvh.roots[i].channels, 3,
              physics.bvhChannels[physics.bvh.roots[i].channelOffset + 3],
              physics.bvhChannels[physics.bvh.roots[i].channelOffset + 4],
              physics.bvhChannels[physics.bvh.roots[i].channelOffset + 5]
            )
          )
        );
        var p;
        for (p = 0; p < physics.bvh.roots[i].children.length; ++p) {
          this.drawObjMatStackRecurse(obj, physics.bvh.roots[i].children[p]);
        }
        // this.drawObjMatStackRecurse(obj, physics.bvh.roots[i]);
        this.mStack.pop();
        newFocus = add(newFocus, [
        parseFloat(physics.bvhChannels[physics.bvh.roots[i].channelOffset + 0]),
        parseFloat(physics.bvhChannels[physics.bvh.roots[i].channelOffset + 1]),
        parseFloat(physics.bvhChannels[physics.bvh.roots[i].channelOffset + 2])
      ])
      }
      if (i > 1) {
        var k;
        for (k = 0; k < i; ++k) {
          newFocus[k] /= i;
        }
      }

      camera.changeZoomFocus([newFocus[0], newFocus[1], newFocus[2]]);
    } catch(err) {
      physics.resetStuff();
      physics.beginAnim();
    }
  },

  drawObj: function(obj) {
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    for (i = 0; i < obj.mat_model.length; ++i) {
      if (obj.isActive[i]) {
        gl.uniformMatrix4fv(this.shdr_unif_matM, gl.FALSE,
          flatten(obj.mat_model[i]));
        gl.drawArrays(gl.TRIANGLES, 0, obj.triCount);
      }
    }
  },

  initSky: function(skyObj) {
    this.sky = skyObj;
    this.loadCubeMap(this.sky.cubeMap);
  },

  initObj: function(obj) {
    obj.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices),
      gl.STATIC_DRAW);

    obj.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals),
      gl.STATIC_DRAW);

    obj.triCount = obj.vertices.length / 3;
  },

  rotationMatRequested: function(channels, offset, one, two, three) {
    if (channels != 0) {
      var firstRot;
      if (channels[0 + offset] == 'Zrotation') {
        firstRot = rotateZ(one);
        if (channels[1 + offset] == 'Yrotation') {                    // ZYX
          return mult(mult(firstRot, rotateY(two)), rotateX(three));
        } else {                                                      // ZXY
          return mult(mult(firstRot, rotateX(two)), rotateY(three));
        }
      } else if (channels[0 + offset] == 'Xrotation') {
        firstRot = rotateX(one);
        if (channels[1 + offset] == 'Yrotation') {                    // XYZ
          return mult(mult(firstRot, rotateY(two)), rotateZ(three));
        } else {                                                      // XZY
          return mult(mult(firstRot, rotateZ(two)), rotateY(three));
        }
      } else if (channels[0 + offset] == 'Yrotation') {
        firstRot = rotateY(one);
        if (channels[1 + offset] == 'Xrotation') {                    // YXZ
          return mult(mult(firstRot, rotateX(two)), rotateZ(three));
        } else {                                                      // YZX
          return mult(mult(firstRot, rotateZ(two)), rotateX(three));
        }
      } else {
        console.log("ERROR: unrecognized rotation : " + channels);
        return -1;
      }
    } else {
      return mat4();
    }
  },

  loadCubeMap: function(base) {

    var faces = [["posx.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                 ["negx.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                 ["posy.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                 ["negy.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                 ["posz.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                 ["negz.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
    var load_counter = 0;
    for (var i = 0; i < faces.length; ++i) {
      var face = faces[i][1];
      var image = new Image();
      image.onload = function (texture, face, image) {
        return function () {
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          ++load_counter;
          if (load_counter == 6)
          {
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

            gl.useProgram(graphics.shdrSky_prog);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, graphics.skyTex);
            gl.uniform1i(graphics.shdrSky_unif_sampler, graphics.skyTex);

            gl.useProgram(graphics.shdr_prog);
            var nLightDir = normalize(graphics.sky.lightDir);
            gl.uniform3f(graphics.shdr_unif_lDir, nLightDir[0],
              nLightDir[1], nLightDir[2]);
            gl.uniform1i(graphics.shdr_unif_samp, graphics.skyTex);
          }
        }
      }(this.skyTex, face, image);
      image.src = base + '/' + faces[i][0];
    }
  },

  cycleSky: function() {
    ++this.whichSky;
    if (this.whichSky >= skies.length) {
      this.whichSky = 0;
    }
    this.initSky(skies[this.whichSky]);
  },

  cycleObjColor: function(obj) {
    if (++obj.colorCounter >= obj.colors.length) {
      obj.colorCounter = 0;
    }  
  },

  toggleLimbs: function(obj) {
    this.renderLimbs = !this.renderLimbs;
  },

  init: function(canvas) {
    // Initialize WebGL
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
      alert("WebGL isn't available");
    } else {
      console.log('WebGL Initialized.');
    }
    this.width = canvas.width;
    this.height = canvas.height;

    // Configure WebGL
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.25, 0.18, 0.1, 1.0);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);

    // Load Shaders
    this.shdr_prog = initShaders(gl, 'glassy.vert', 'glassy.frag');
    if (this.shdr_prog != -1) {
      this.shdr_unif_matVP = gl.getUniformLocation(this.shdr_prog,
        'viewProjMat');
      this.shdr_unif_matM = gl.getUniformLocation(this.shdr_prog, 'modelMat');
      this.shdr_unif_samp = gl.getUniformLocation(this.shdr_prog, 'samp');
      this.shdr_unif_cPos = gl.getUniformLocation(this.shdr_prog, 'cameraPos');
      this.shdr_unif_refr = gl.getUniformLocation(this.shdr_prog, 'refrIndex');
      this.shdr_unif_lDir = gl.getUniformLocation(this.shdr_prog, 'lightDir');
      this.shdr_unif_gCol = gl.getUniformLocation(this.shdr_prog, 'glassColor');
    } else {
      console.log("MONO SHADER FAIL!");
    }

    this.shdrSky_prog = initShaders(gl, 'sky.vert', 'sky.frag');
    if (this.shdrSky_prog != -1) {
      this.shdrSky_unif_invMat = gl.getUniformLocation(this.shdrSky_prog,
        'inv_mvp');
      this.shdrSky_unif_sampler = gl.getUniformLocation(this.shdrSky_prog,
        'samp');
    } else {
      console.log("SKY SHADER FAIL!");
    }

    // At most 2 attributes per vertex will be used in any shader.
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    // only one texture will be used in this project at a time, so all this
    // can be done just once.
    gl.activeTexture(gl.TEXTURE0);
    this.skyTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.skyTex);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // same with this
    this.skyVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1,   3, -1,   -1, 3]),
      gl.STATIC_DRAW);
    this.skyVertCount = 3;

    // Configure Camera
    camera.setAspectX(canvas.width);
    camera.setAspectY(canvas.height);
    camera.zoomedFocus = [0, 0, 0];
    camera.zoomedFTarget = camera.zoomedFocus;

    // Set up vertex buffers and the sky
    this.initSky(skies[this.whichSky]);
    this.initObj(ball);    
    this.initObj(floor);
    this.initObj(stick);
  }
};
