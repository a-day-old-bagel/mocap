function multVec4ByMat4x4(vec, mat) {
  var returnVec = vec4();
  returnVec[0] = mat[0][0] * vec[0] +
                 mat[0][1] * vec[1] +
                 mat[0][2] * vec[2] +
                 mat[0][3] * vec[3];
  returnVec[1] = mat[1][0] * vec[0] +
                 mat[1][1] * vec[1] +
                 mat[1][2] * vec[2] +
                 mat[1][3] * vec[3];
  returnVec[2] = mat[2][0] * vec[0] +
                 mat[2][1] * vec[1] +
                 mat[2][2] * vec[2] +
                 mat[2][3] * vec[3];
  returnVec[3] = mat[3][0] * vec[0] +
                 mat[3][1] * vec[1] +
                 mat[3][2] * vec[2] +
                 mat[3][3] * vec[3];
  return returnVec;
}
function rayCastPlaneY(clickCoordX, clickCoordY) {
  var xzCoord = vec2();
  var x_ndc = (2 * clickCoordX) / graphics.width - 1;
  var y_ndc = 1 - (2 * clickCoordY) / graphics.height;
  var ray_clip = multVec4ByMat4x4(vec4(x_ndc, y_ndc, -1.0, 1.0),
    camera.getProj_inverse());
  var ray = multVec4ByMat4x4(vec4(ray_clip[0], ray_clip[1], -1.0, 0.0),
    camera.getView_inverse());

  if (ray[1] < 0) {
    ray = normalize(ray, true);
    if (ray[0] != 0) {
      var slopeX = ray[1] / ray[0];
      xzCoord[0] = (-camera.vec_eye[1] / slopeX) + camera.vec_eye[0];
    } else {
      xzCoord[0] = camera.vec_eye[0];
    }
    if (ray[2] != 0) {
      var slopeZ = ray[1] / ray[2];
      xzCoord[1] = (-camera.vec_eye[1] / slopeZ) + camera.vec_eye[2];
    } else {
      xzCoord[1] = camera.vec_eye[2];
    }
    return xzCoord;
  } else {
    return null;
  }
}
