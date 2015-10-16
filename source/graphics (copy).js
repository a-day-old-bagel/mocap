var graphics = {

  gl: undefined,
  vao_ext: undefined,
  shdr_prog: undefined,
  shdr_unif_matVP: undefined,
  shdr_unif_matM: undefined,
  shdr_unif_tex: undefined,
  shdr_unif_split: undefined,
  shdr_unif_cPos: undefined,
  shdr_unif_lPos: undefined,
  shdr_unif_lDir: undefined,
  shdrSky_prog: undefined,
  shdrSky_unif_invMat: undefined,
  shdrSky_unif_sampler: undefined,
  width: undefined,
  height: undefined,

  render: function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    
    camera.updateVPMat();

    gl.useProgram(this.shdr_prog);
    gl.uniform3f(this.shdr_unif_cPos, camera.vec_eye[0],
      camera.vec_eye[1], camera.vec_eye[2]);
    gl.uniformMatrix4fv(this.shdr_unif_matVP, gl.FALSE, flatten(camera.mat_vp));
    ball.updateMats();
    this.drawObj(ball);
    this.drawObj(floor);
  },

  drawObj: function(obj) {
    gl.activeTexture(gl.TEXTURE0 + obj.texUnit);
    gl.bindTexture(gl.TEXTURE_2D, obj.texture);
    gl.uniform1i(this.shdr_unif_tex, obj.texUnit);

    vao_ext.bindVertexArrayOES(obj.vao);

    // gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    // gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(0);

    // gl.bindBuffer(gl.ARRAY_BUFFER, obj.uvBuffer);
    // gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(1);

    // gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    // gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(2);

    for (i = 0; i < obj.mat_model.length; ++i) {
      if (obj.isActive[i]) {
        gl.uniformMatrix4fv(this.shdr_unif_matM, gl.FALSE,
          flatten(obj.mat_model[i]));
        gl.uniform3f(this.shdr_unif_split, obj.tex_split[0],
          obj.tex_split[1], obj.tex_which[i]);
        gl.drawArrays(gl.TRIANGLES, 0, obj.triCount);
      }
    }
  },

  initObj: function(obj) {
    obj.vao = vao_ext.createVertexArrayOES();
    vao_ext.bindVertexArrayOES(obj.vao);

    obj.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices),
      gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    obj.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.uvs),
      gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    obj.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals),
      gl.STATIC_DRAW);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(2);

    obj.triCount = obj.vertices.length / 3;
  },

  loadTextureBase64String: function(dataString, textureUnit) {
    var texture = gl.createTexture();
    var image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    image.src = 'data:image/png;base64,' + dataString;
    return texture;
  },

  loadCubeMap: function(base) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

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
          }
          // requestAnimationFrame(draw);
        }
      }(texture, face, image);
      image.src = base + '/' + faces[i][0];
    }
    return texture;
  },

  init: function(canvas) {
    // Initialize WebGL
    gl = WebGLUtils.setupWebGL(canvas);
    vao_ext = gl.getExtension('OES_vertex_array_object');
    if (!gl) {
      alert("WebGL isn't available");
    } else {
      console.log('WebGL Initialized.');
    }
    if (!vao_ext) {
      alert('ERROR: Your browser does not support WebGL VAO extension');
    } else {
      console.log('VAO extension Initialized.');
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
    this.shdr_prog = initShaders(gl, 'monolithic.vert', 'monolithic.frag');
    if (this.shdr_prog != -1) {
      this.shdr_unif_matVP = gl.getUniformLocation(this.shdr_prog, 'viewProjMat');
      this.shdr_unif_matM = gl.getUniformLocation(this.shdr_prog, 'modelMat');
      this.shdr_unif_tex = gl.getUniformLocation(this.shdr_prog, 'texture');
      this.shdr_unif_split = gl.getUniformLocation(this.shdr_prog, 'texSplitter');
      this.shdr_unif_cPos = gl.getUniformLocation(this.shdr_prog, 'cameraPos');
      this.shdr_unif_lPos = gl.getUniformLocation(this.shdr_prog, 'lightPos');
      this.shdr_unif_lDir = gl.getUniformLocation(this.shdr_prog, 'lightDir');      
    }

    this.shdrSky_prog = initShaders(gl, 'sky.vert', 'sky.frag');
    if (this.shdrSky_prog != -1) {
      this.shdrSky_unif_invMat = gl.getUniformLocation(this.shdrSky_prog, 'inv_mvp');
      this.shdrSky_unif_sampler = gl.getUniformLocation(this.shdrSky_prog, 'samp');
    }


    // Configure Camera
    camera.setAspectX(canvas.width);
    camera.setAspectY(canvas.height);
    camera.zoomedFocus = [0, 0, 0];
    camera.zoomedFTarget = camera.zoomedFocus;

    // Configure Lighting
    gl.useProgram(this.shdr_prog);
    gl.uniform3f(this.shdr_unif_lPos, 0.0, 4.0, 0.0);
    gl.uniform3f(this.shdr_unif_lDir, 0.57735, 0.57735, -0.57735);

    ball.texUnit = 0; // gl.TEXTURE0;
    ball.texture = this.loadTextureBase64String(ballTex, ball.texUnit);
    this.initObj(ball);

    floor.texUnit = ball.texUnit;
    floor.texture = ball.texture;
    this.initObj(floor);
  }
};
