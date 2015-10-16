var camera = {
  prop_fovY: 50,
  prop_near: 0.1,
  prop_far: 100,
  prop_aspectY: 1,
  prop_aspectX: 1,
  vec_eye: vec3(),
  vec_focus: vec3(),
  vec_up: vec3(0, 1, 0),
  mat_proj: mat4(),
  mat_proj_inv: mat4(),
  mat_view: mat4(),
  mat_vp: mat4(),
  ang_theta: 0,
  ang_theta_target: 0,
  ang_theta_speed: 0.004,
  ang_phi: 0,
  ang_phi_target: 0,
  ang_phi_speed: 0.004,
  ang_phi_max: 1.15, // -0.15
  ang_phi_min: -1.3,
  zoom_dist: 5,
  zoom_dist_max: 60.0, // 4.5
  zoom_dist_min: 0.5, //0.2
  zoom_target: 5,
  zoom_speed: 0.004,
  phys_last_dt: 1.0,
  state_oldVPMat: true,
  state_oldVPInv: true,
  state_oldProjMat: true,
  state_oldProjInv: true,
  state_oldViewMat: true,
  state_oldViewInv: true,
  zoomedFocus: undefined,
  zoomedFTarget: undefined,
  zoomedFOld: undefined,
  zoomedFSpeed: 0.004,
  is_movingZoomedF: false,

  calcCamVectors: function() {
    // focus resides somewhere between cue ball and table center
    var farThresh = this.zoom_dist_max - this.zoom_dist_min;
    var zoomDist = this.zoom_dist - this.zoom_dist_min;
    // so we're going to interpolate along a cosine curve
    var interp = Math.cos((zoomDist / farThresh) * Math.PI) * 0.5 + 0.5;
    this.vec_focus = vec3(this.zoomedFocus[0] * interp,
                     this.zoomedFocus[1] * interp,
                     this.zoomedFocus[2] * interp);
    // now decide where the eye is...
    var x = 0.0;
    var y = 0.0;
    var z = this.zoom_dist;
    var yP = y * Math.cos(this.ang_phi) - z * Math.sin(this.ang_phi);
    var zP = y * Math.sin(this.ang_phi) + z * Math.cos(this.ang_phi);
    var xPP = x * Math.cos(this.ang_theta) + zP * Math.sin(this.ang_theta);
    var zPP = -x * Math.sin(this.ang_theta) + zP * Math.cos(this.ang_theta);
    this.vec_eye = vec3(xPP + this.vec_focus[0], yP + this.vec_focus[1], zPP +
      this.vec_focus[2]);
  },
  calcZoomedFocus: function(dt) {
    if (this.is_movingZoomedF) {
      var currentShmoozeLength = length(subtract(this.zoomedFTarget,
        this.zoomedFocus));
      var interp = Math.pow((1.0 - (currentShmoozeLength /
        this.zoomedFShmoozeLength) * 2), 2) * -1 + 1.001;
      this.zoomedFocus = add(this.zoomedFocus,
        scale(interp * this.zoomedFSpeed * dt, this.zoomedFShmoozeVector));
      if (currentShmoozeLength < 0.001) {
        this.zoomedFocus = this.zoomedFTarget;
        this.is_movingZoomedF = false;
      }
      return true;
    } else {
      return false;
    }
  },
  changeZoomFocus: function(vec) {
    this.zoomedFTarget = vec;
    this.zoomedFOld = this.zoomedFocus;
    this.zoomedFShmoozeVector = subtract(this.zoomedFTarget, this.zoomedFOld);
    this.zoomedFShmoozeLength = length(this.zoomedFShmoozeVector);
    if (this.zoomedFShmoozeLength > 0) {
      this.is_movingZoomedF = true;
    }
  },
  updateVPMat: function() {
    if (this.state_oldProjMat) {
      this.mat_proj = perspective(
        this.prop_fovY, this.prop_aspectX / this.prop_aspectY,
        this.prop_near, this.prop_far);
      this.state_oldProjMat = false;
      this.state_oldProjInv = true;
      this.state_oldVPMat = true;
    }
    if (this.state_oldViewMat) {
      this.calcCamVectors();
      this.mat_view = lookAt(this.vec_eye, this.vec_focus, this.vec_up);
      this.state_oldViewMat = false;
      this.state_oldViewInv = true;
      this.state_oldVPMat = true;
    }
    if (this.state_oldVPMat) {
      this.mat_vp = mult(this.mat_proj, this.mat_view);
      this.state_oldVPMat = false;
      this.state_oldVPInv = true;
    }
  },
  getVP_inverse: function() {
    if (this.state_oldVPInv) {
      this.mat_vp_inv = inverse4(this.mat_vp);
      this.state_oldVPInv = false;
    }
    return this.mat_vp_inv;
  },
  getProj_inverse: function() {
    if (this.state_oldProjInv) {
      this.mat_proj_inv = inverse4(this.mat_proj);
      this.state_oldProjInv = false;
    }
    return this.mat_proj_inv;
  },
  getView_inverse: function() {
    if (this.state_oldViewInv) {
      this.mat_view_inv = inverse4(this.mat_view);
      this.state_oldViewInv = false;
    }
    return this.mat_view_inv;
  },
  getRotMat: function() {
    var cosX = Math.cos(this.ang_phi);
    var sinX = Math.sin(this.ang_phi);
    var cosY = Math.cos(-this.ang_theta);
    var sinY = Math.sin(-this.ang_theta);
    return mat4(
       cosY,        0,    -sinY,        0,
      -sinX * sinY, cosX, -sinX * cosY, 0,
       cosX * sinY, sinX,  cosX * cosY, 0,
       0,           0,     0,           1
    );
  },
  tickShmooze: function(dt) {
    if (Math.abs(this.zoom_dist - this.zoom_target) > this.zoom_speed *
      this.phys_last_dt * 0.2) {
      if (this.zoom_dist > this.zoom_target) {
        this.zoom_dist -= this.zoom_speed * dt * (this.zoom_dist -
          this.zoom_target);
      } else {
        this.zoom_dist += this.zoom_speed * dt * (this.zoom_target -
          this.zoom_dist);
      }
      this.state_oldViewMat = true;
    }

    if (Math.abs(this.ang_theta - this.ang_theta_target) >
      this.ang_theta_speed * this.phys_last_dt * 0.2 ||
        Math.abs(this.ang_phi - this.ang_phi_target) >
          this.ang_phi_speed * this.phys_last_dt * 0.2) {
      if (this.ang_theta > this.ang_theta_target) {
        this.ang_theta -= this.ang_theta_speed * dt * (this.ang_theta -
          this.ang_theta_target);
      } else {
        this.ang_theta += this.ang_theta_speed * dt * (this.ang_theta_target -
          this.ang_theta);
      }
      if (this.ang_phi > this.ang_phi_target) {
        this.ang_phi -= this.ang_phi_speed * dt * (this.ang_phi -
          this.ang_phi_target);
      } else {
        this.ang_phi += this.ang_phi_speed * dt * (this.ang_phi_target -
          this.ang_phi);
      }
      this.state_oldViewMat = true;
    }

    if (this.calcZoomedFocus(dt)) {
      this.state_oldViewMat = true;
    }

    this.phys_last_dt = dt;
  },
  applyZoom: function(zoom) {
    this.zoom_target += zoom;
    if (this.zoom_target > this.zoom_dist_max) {
      this.zoom_target = this.zoom_dist_max;
    } else if (this.zoom_target < this.zoom_dist_min) {
      this.zoom_target = this.zoom_dist_min;
    }
  },
  rotateTheta: function(angle) {
    this.ang_theta_target += angle;
  },
  rotatePhi: function(angle) {
    this.ang_phi_target += angle;
    if (this.ang_phi_target > this.ang_phi_max) {
      this.ang_phi_target = this.ang_phi_max;
    } else if (this.ang_phi_target < this.ang_phi_min) {
      this.ang_phi_target = this.ang_phi_min;
    }
  },
  setUpDirection: function(x, y, z) {
    this.vec_up = vec3(x, y, z);
    this.state_oldViewMat = true;
  },
  setFovY: function(fovY) {
    this.prop_fovY = fovY;
    this.state_oldProjMat = true;
  },
  setNearPlane: function(near) {
    this.prop_near = near;
    this.state_oldProjMat = true;
  },
  setFarPlane: function(far) {
    this.prop_far = far;
    this.state_oldProjMat = true;
  },
  setAspectX: function(x) {
    this.prop_aspectX = x;
    this.state_oldProjMat = true;
  },
  setAspectY: function(y) {
    this.prop_aspectY = y;
    this.state_oldProjMat = true;
  }
};
