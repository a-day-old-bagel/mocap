var floor = {
  mat_model: [mat4()],
  tex_split: vec2(1.0, 1.0),
  tex_which: [0.0],
  isActive: [true],
  vertices: [
   20,   0,  20,    20,   0,   0,     0,   0,   0,
   20,   0,  20,     0,   0,   0,     0,   0,  20,

   20,   0, -20,     0,   0,   0,    20,   0,   0,
   20,   0, -20,     0,   0, -20,     0,   0,   0,

  -20,   0, -20,   -20,   0,   0,     0,   0,   0,
  -20,   0, -20,     0,   0,   0,     0,   0, -20,

  -20,   0,  20,     0,   0,   0,   -20,   0,   0,
  -20,   0,  20,     0,   0,  20,     0,   0,   0  ],
  uvs: [
   1,    0,      1,  0.5,    0.5,  0.5,
   1,    0,    0.5,  0.5,    0.5,    0,

   1,    1,    0.5,  0.5,      1,  0.5,
   1,    1,    0.5,    1,    0.5,  0.5,

   1,    0,      1,  0.5,    0.5,  0.5,
   1,    0,    0.5,  0.5,    0.5,    0,

   1,    1,    0.5,  0.5,      1,  0.5,
   1,    1,    0.5,    1,    0.5,  0.5  ],
  normals: [
  0, 1, 0,  0, 1, 0,  0, 1, 0,
  0, 1, 0,  0, 1, 0,  0, 1, 0,

  0, 1, 0,  0, 1, 0,  0, 1, 0,
  0, 1, 0,  0, 1, 0,  0, 1, 0,

  0, 1, 0,  0, 1, 0,  0, 1, 0,
  0, 1, 0,  0, 1, 0,  0, 1, 0,

  0, 1, 0,  0, 1, 0,  0, 1, 0,
  0, 1, 0,  0, 1, 0,  0, 1, 0  ],
};

