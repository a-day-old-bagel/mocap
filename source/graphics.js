var graphics = {

  gl: undefined,
  vao_ext: undefined,
  shdr_Prog: undefined,
  shdr_unif_matVP: undefined,
  shdr_unif_matM: undefined,
  shdr_unif_tex: undefined,
  shdr_unif_split: undefined,
  shdr_unif_cPos: undefined,
  shdr_unif_lPos: undefined,
  width: undefined,
  height: undefined,

  render: function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    camera.updateVPMat();
    gl.uniform3f(shdr_unif_cPos, camera.vec_eye[0],
      camera.vec_eye[1], camera.vec_eye[2]);
    gl.uniformMatrix4fv(shdr_unif_matVP, gl.FALSE, flatten(camera.mat_vp));
    if (cue.isVisible) {
      this.drawObj(cue);
    }
    ball.updateMats();
    this.drawObj(ball);
    if (arrow.isDragging) {
      this.drawObj(arrow);
    }
    this.drawObj(table);
    //this.drawObj(texTest);
  },

  drawObj: function(obj) {
    gl.activeTexture(gl.TEXTURE0 + obj.texUnit);
    gl.bindTexture(gl.TEXTURE_2D, obj.texture);
    gl.uniform1i(shdr_unif_tex, obj.texUnit);
    vao_ext.bindVertexArrayOES(obj.vao);
    for (i = 0; i < obj.mat_model.length; ++i) {
      if (obj.isActive[i]) {
        gl.uniformMatrix4fv(shdr_unif_matM, gl.FALSE,
          flatten(obj.mat_model[i]));
        gl.uniform3f(shdr_unif_split, obj.tex_split[0],
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
    shdr_prog = initShaders(gl, 'monolithic.vert', 'monolithic.frag');
    if (shdr_prog != -1) {
      shdr_unif_matVP = gl.getUniformLocation(shdr_prog, 'viewProjMat');
      shdr_unif_matM = gl.getUniformLocation(shdr_prog, 'modelMat');
      shdr_unif_tex = gl.getUniformLocation(shdr_prog, 'texture');
      shdr_unif_split = gl.getUniformLocation(shdr_prog, 'texSplitter');
      shdr_unif_cPos = gl.getUniformLocation(shdr_prog, 'cameraPos');
      shdr_unif_lPos = gl.getUniformLocation(shdr_prog, 'lightPos');
      gl.useProgram(shdr_prog);
      console.log('Shaders Initialized.');
    }

    // Configure Camera
    camera.setAspectX(canvas.width);
    camera.setAspectY(canvas.height);
    camera.zoomedFocus = vec3(ball.position[0][0],
                         ball.yPlane + 0.14,
                         ball.position[0][1]);
    camera.zoomedFTarget = camera.zoomedFocus;

    // Configure Lighting
    gl.uniform3f(shdr_unif_lPos, 0.0, 4.0, 0.0);

    // Load Textures
    ball.texUnit = 0; // gl.TEXTURE0;
    cue.texUnit = 1; // gl.TEXTURE1;
    table.texUnit = 2; // gl.TEXTURE2;
    arrow.texUnit = ball.texUnit;

    table.texture = this.loadTextureBase64String(tableTex, table.texUnit);
    cue.texture = this.loadTextureBase64String(cueTex, cue.texUnit);
    ball.texture = this.loadTextureBase64String(ballTex, ball.texUnit);
    arrow.texture = ball.texture;

    // Initialize Objects (including buffers)
    this.initObj(ball);
    this.initObj(cue);
    this.initObj(table);
    this.initObj(arrow);
  },

  destroy: function() {
    console.log('Graphics Destructor');
  }
};
