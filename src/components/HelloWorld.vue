<template>
  <div>
    <div id="sceneContainer" width="100%" height="100%">
      <button id="modebutton" v-if="touchMode" v-on:click="touchMode=false">切换至重力感应</button>
      <button v-else v-on:click="touchMode=true">恢复手动控制</button>
      <audio id="desc" />
    </div>
  </div>
</template> 

<script>
import * as THREE from "three";
import { Matrix4, PlaneGeometry } from "three";
import orientHandler from "./scripts/orienter.js";
import sceneObj from "./scripts/scene";
import { log } from "util";
export default {
  name: "HelloWorld",
  data() {
    return {
      sceneMap: {},
      currentScene: "",
      skyBoxMat: {},
      preSkyBoxMat: null,
      skyBoxTexture: {},
      preSkyBoxTexture: null,
      skyBoxGeom: {},
      touchMode: true,
      skyboxReady: false,
      camera: null,
      scene: null,
      renderer: null,
      raycaster: null,
      skyBoxMesh: null,
      mouseDown: false,
      touchDown: false,
      mouseSpeed: 0.1,
      touchSpeed: 0.3,
      pre: { x: 0, y: 0 },
      eularAngle: { x: 0, y: 0 },
      deviceOrientationData: {
        alpha: 0,
        beta: 0,
        gamma: 0
      },
      currentScreenOrientation: 0,
      orientH: null
    };
  },
  props: {
    msg: String
  },
  methods: {
    sceneObjInit: function() {
      let img1 = "https://i.loli.net/2019/07/07/5d21fc2e85ed526354.jpg"; //图书馆和教学楼间//"https://i.loli.net/2019/05/20/5ce24006dcc9389408.jpg";
      let img2 = "https://i.loli.net/2019/07/07/5d21fc2e85f6c39262.jpg"; //靠近图书馆"https://i.loli.net/2019/05/20/5ce24006dcf7e51423.jpg";
      let img3 = "https://i.loli.net/2019/07/07/5d21fc2e85e0554551.jpg"; //教室地下
      let img4 = "https://i.loli.net/2019/07/07/5d21fc2e85f8953320.jpg"; //食堂连廊
      let img5 = "https://i.loli.net/2019/07/07/5d21fc2e85c4d50768.jpg"; //食堂路口
      let img1p = "https://i.loli.net/2019/07/07/5d22104ea845884854.jpg"; //图书馆和教学楼间
      let img2p = "https://i.loli.net/2019/07/07/5d22104ec7b3415917.jpg"; //靠近图书馆 "https://i.loli.net/2019/07/07/5d21fef1c332f75397.jpg"; //
      let img3p = "https://i.loli.net/2019/07/07/5d22104ebdcf286019.jpg"; //教室地下
      let img4p = "https://i.loli.net/2019/07/07/5d22104eb37e563108.jpg"; //食堂连廊
      let img5p = "https://i.loli.net/2019/07/07/5d22104e964f185346.jpg"; //食堂路口
      //let aud =
      //  "https://langdu.cdn.bjadks.com/DataFile/Upload/User/Audio/20190528143945_45556.mp3";
      let pi = Math.PI;
      let scene1 = new sceneObj("图书馆和教学楼间", img1, img1p);
      scene1.addJumpObj(this.getJumpButton(pi / 2, 10, 1), "靠近图书馆");
      scene1.addJumpObj(this.getJumpButton(-pi / 2, 10, 1), "教室地下");
      let scene2 = new sceneObj("靠近图书馆", img2, img2p);
      scene2.addJumpObj(this.getJumpButton(-pi / 2, 10, 1), "图书馆和教学楼间");
      scene2.addJumpObj(this.getJumpButton(pi / 2, 10, 1), "食堂连廊");
      let scene3 = new sceneObj("教室地下", img3, img3p);
      scene3.addJumpObj(this.getJumpButton(-pi / 2, 10, 1), "图书馆和教学楼间");
      let scene4 = new sceneObj("食堂连廊", img4, img4p);
      scene4.addJumpObj(this.getJumpButton(0, 10, 1), "靠近图书馆");
      scene4.addJumpObj(this.getJumpButton(pi, 10, 1), "食堂路口");
      let scene5 = new sceneObj("食堂路口", img5, img5p);
      scene5.addJumpObj(this.getJumpButton((6 * pi) / 5, 10, 1), "食堂连廊");
      this.currentScene = scene2;
      this.sceneMap = new Map();
      this.sceneMap[scene1.name] = scene1;
      this.sceneMap[scene2.name] = scene2;
      this.sceneMap[scene3.name] = scene3;
      this.sceneMap[scene4.name] = scene4;
      this.sceneMap[scene5.name] = scene5;
    },
    rendererInit: function() {
      this.scene = new THREE.Scene();
      this.scene.updateMatrixWorld(true);
      this.camera = new THREE.PerspectiveCamera(
        100,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      this.camera.target = new THREE.Vector3(0, 0, 0);
      this.raycaster = new THREE.Raycaster();
      this.orientH = new orientHandler();
      this.skyBoxGeom = new THREE.SphereGeometry(100, 100, 100);
      this.skyBoxGeom.scale(1, 1, -1);
      this.loadScene(this.currentScene);
      this.scene.rotation.set(0, 0, 0);
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        precision: "highp"
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      document
        .getElementById("sceneContainer")
        .appendChild(this.renderer.domElement);
    },
    block() {
      while (!this.skyboxReady);
    },

    initEventListener: function() {
      window.addEventListener("mousedown", this.onMouseDown.bind(this));
      window.addEventListener("mousemove", this.onMouseMove.bind(this));
      window.addEventListener("mouseup", this.onMouseUp.bind(this));
      window.addEventListener("touchstart", this.onTouchStart.bind(this));
      window.addEventListener("touchmove", this.onTouchMove.bind(this), {
        passive: false
      });
      window.addEventListener("touchend", this.onTouchEnd.bind(this));
      window.addEventListener("resize", () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });
      window.addEventListener(
        "deviceorientation",
        this.onDeviceOrientation.bind(this)
      );
      window.addEventListener(
        "orientationchange",
        this.onOrientationChange.bind(this)
      );
      window.addEventListener("jumpTo", this.jumpTo.bind(this));
    },

    onMouseDown: function(e) {
      event.preventDefault();
      let ry = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(ry, this.camera);
      let intersections = this.raycaster.intersectObjects(this.scene.children);
      for (let obj of intersections) {
        if (!(obj.object.callbk === undefined)) obj.object.callbk();
      }
      if (!this.touchMode) return;
      this.mouseDown = true;
      this.pre.x = e.clientX;
      this.pre.y = e.clientY;
    },

    onMouseMove: function(e) {
      if (this.mouseDown) {
        this.eularAngle.x += (this.pre.x - e.clientX) * this.mouseSpeed;
        this.eularAngle.y += (e.clientY - this.pre.y) * this.mouseSpeed;
        this.pre.x = e.clientX;
        this.pre.y = e.clientY;
      }
    },

    onMouseUp: function(e) {
      this.mouseDown = false;
    },

    onTouchStart: function(e) {
      event.preventDefault();
      let ry = new THREE.Vector2(
        (e.touches[0].clientX / window.innerWidth) * 2 - 1,
        -(e.touches[0].clientY / window.innerHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(ry, this.camera);
      let intersections = this.raycaster.intersectObjects(this.scene.children);
      for (let obj of intersections) {
        if (!(obj.object.callbk === undefined)) obj.object.callbk();
      }
      if (!this.touchMode) return;
      this.touchDown = true;
      this.pre.x = e.touches[0].clientX;
      this.pre.y = e.touches[0].clientY;
    },

    onTouchMove: function(e) {
      event.preventDefault();
      if (this.touchDown) {
        this.eularAngle.x +=
          (this.pre.x - e.touches[0].clientX) * this.touchSpeed;
        this.eularAngle.y -=
          (this.pre.y - e.touches[0].clientY) * this.touchSpeed;
        //console.log(this.eularAngle.x,this.eularAngle.y);
        this.pre.x = e.touches[0].clientX;
        this.pre.y = e.touches[0].clientY;
      }
    },

    onTouchEnd: function(e) {
      this.touchDown = false;
    },

    onDeviceOrientation: function(e) {
      this.deviceOrientationData = e;
      if (this.touchMode) return;
      let ret = this.orientH.handleOrient(this.currentScreenOrientation, e);
      this.eularAngle.y = ret.lat;
      this.eularAngle.x = -ret.lon;
    },

    onOrientationChange: function(e) {
      this.currentScreenOrientation = window.orientation;
    },
    jumpTo: function(e) {
      this.unloadScene(this.currentScene);
      this.currentScene = this.sceneMap[e.detail.dest];
      this.loadScene(this.currentScene);
    },
    getJumpButton: function(theta, row, h) {
      let arr = "https://i.loli.net/2019/07/07/5d20d7e3486ca89261.png"; //"https://i.loli.net/2019/07/02/5d1b51a6c0c4a70528.png";
      let tex = new THREE.TextureLoader().load(arr);
      tex.magFilter = THREE.NearestFilter;
      let planeObj = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2, 10, 10),
        new THREE.MeshBasicMaterial({
          map: tex,
          alphaTest: 0.5,
          side: THREE.DoubleSide
        })
      );
      planeObj.position.x = row * Math.cos(theta);
      planeObj.position.y = h;
      planeObj.position.z = row * Math.sin(theta);
      planeObj.rotation.y = Math.PI / 2;
      planeObj.rotation.y = Math.PI / 2 - theta;
      return planeObj;
    },
    loadScene: function(sc) {
      if (sc.bgPreSrc.length > 0) {
        this.preLodaBgImg(sc.bgPreSrc);
      } else {
        this.loadBgImg(sc.bgSrc);
      }
      for (let obj of sc.jumpObj) {
        this.scene.add(obj);
      }
      for (let obj of sc.descObj) {
        this.scene.add(obj);
      }
      for (let obj of sc.normalObj) {
        this.scene.add(obj);
      }
    },
    unloadScene: function(sc) {
      for (let obj of sc.jumpObj) {
        this.scene.remove(obj);
      }
      for (let obj of sc.descObj) {
        this.scene.remove(obj);
      }
      for (let obj of sc.normalObj) {
        this.scene.remove(obj);
      }
      this.unloadBgImg();
    },
    preLodaBgImg: function(src) {
      console.log("PRELOAD", src);
      this.preSkyBoxTexture = new THREE.TextureLoader().load(src, () => {
        this.preSkyBoxTexture.generateMipmaps = false;
        this.preSkyBoxTexture.magFilter = THREE.LinearFilter;
        this.preSkyBoxTexture.minFilter = THREE.LinearFilter;
        if (!(JSON.stringify(this.skyBoxMesh) === "{}")) {
          this.scene.remove(this.skyBoxMesh);
        }
        this.preSkyBoxMat = new THREE.MeshBasicMaterial({
          map: this.preSkyBoxTexture
        });
        this.skyBoxMesh = new THREE.Mesh(this.skyBoxGeom, this.preSkyBoxMat);
        this.scene.add(this.skyBoxMesh);
        this.loadBgImg(this.currentScene.bgSrc);
      });
    },
    loadBgImg: function(src) {
      console.log("LOAD", src);
      this.skyboxReady = false;
      this.skyBoxTexture = new THREE.TextureLoader().load(src, () => {
        this.skyboxReady = true;
        this.skyBoxTexture.generateMipmaps = false;
        this.skyBoxTexture.magFilter = THREE.LinearFilter;
        this.skyBoxTexture.minFilter = THREE.LinearFilter;
        if (!(JSON.stringify(this.skyBoxMesh) === "{}")) {
          this.scene.remove(this.skyBoxMesh);
        }
        if (!(this.preSkyBoxTexture === null)) {
          this.preSkyBoxMat.dispose();
          this.preSkyBoxTexture.dispose();
        }
        this.skyBoxMat = new THREE.MeshBasicMaterial({
          map: this.skyBoxTexture
        });
        this.skyBoxMesh = new THREE.Mesh(this.skyBoxGeom, this.skyBoxMat);
        this.scene.add(this.skyBoxMesh);
      });
    },
    unloadBgImg: function() {
      this.skyBoxMat.dispose();
      this.skyBoxTexture.dispose();
    },
    Update() {
      if (this.eularAngle.y > 85) {
        this.eularAngle.y = 85;
      } else if (this.eularAngle.y < -85) {
        this.eularAngle.y = -85;
      }
      if (this.eularAngle.x >= 360) {
        this.eularAngle.x %= 360;
      } else if (this.eularAngle.x < 0) {
        this.eularAngle.x = (this.eularAngle.x % 360) + 360;
      }
      let eularRadX = THREE.Math.degToRad(this.eularAngle.x);
      let eularRadY = THREE.Math.degToRad(90 - this.eularAngle.y);
      this.camera.target.x = 500 * Math.sin(eularRadY) * Math.cos(eularRadX);
      this.camera.target.y = 500 * Math.cos(eularRadY);
      this.camera.target.z = 500 * Math.sin(eularRadX) * Math.sin(eularRadY);
      this.camera.lookAt(this.camera.target);
      this.renderer.render(this.scene, this.camera);
      //this.planeObj.position.z += 0.01;
      //if (this.planeObj.position.z > Math.PI * 2) this.planeObj.position.z = 0;
      //console.log(this.planeObj.rotation.x);
    },

    animate: function() {
      requestAnimationFrame(this.animate);
      this.Update();
    }
  },
  mounted() {
    this.sceneObjInit();
    this.rendererInit();
    this.initEventListener();
    this.animate();
    //this.animate();
  }
};
</script>
<style>
body {
  margin: 0;
}
</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->