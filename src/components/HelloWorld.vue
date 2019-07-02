<template>
  <div>
    <div id="sceneContainer" width="100%" height="100%">
      {{this.eularAngle.x}}
      {{this.eularAngle.y}}
      <button
        v-if="touchMode"
        v-on:click="touchMode=false"
      >切换至重力感应</button>
      <button v-else v-on:click="touchMode=true">恢复手动控制</button>
      <audio id="desc" />
    </div>
  </div>
</template> 

<script>
import * as THREE from "three";
import { Matrix4 } from "three";
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
      skyBoxTexture: {},
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
      touchSpeed: 0.1,
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
      let img1 = "https://i.loli.net/2019/05/20/5ce24006dcc9389408.jpg";
      let img2 = "https://i.loli.net/2019/05/20/5ce24006dcf7e51423.jpg";
      let aud =
        "https://langdu.cdn.bjadks.com/DataFile/Upload/User/Audio/20190528143945_45556.mp3";
      let scene1 = new sceneObj("cross", img1);
      let scene2 = new sceneObj("library", img2);
      let cubeobj = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      cubeobj.position.x = cubeobj.position.y = 3;
      scene1.addJumpObj(cubeobj, "library");
      let sphereobj = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      sphereobj.position.x = 10;
      sphereobj.position.y = 2.5;
      sphereobj.position.z = -10;
      let sphereobj2 = new THREE.Mesh(
        new THREE.SphereGeometry(4, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          opacity: 0,
          transparent: true
        })
      );
      sphereobj2.position.x = 10;
      sphereobj2.position.y = 2.5;
      sphereobj2.position.z = -10;
      scene2.addNormalObj(sphereobj);
      scene2.addDescObj(sphereobj2, aud);
      this.currentScene = scene1;
      this.sceneMap = new Map();
      this.sceneMap[scene1.name] = scene1;
      this.sceneMap[scene2.name] = scene2;
      console.log("scenes inited success");
    },
    rendererInit: function() {
      this.scene = new THREE.Scene();
      this.scene.updateMatrixWorld(true);
      this.camera = new THREE.PerspectiveCamera(
        72,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      this.camera.target = new THREE.Vector3(0, 0, 0);
      this.raycaster = new THREE.Raycaster();
      this.orientH = new orientHandler();
      this.skyBoxGeom = new THREE.SphereGeometry(100, 100, 100);
      this.skyBoxGeom.scale(1, 1, -1);
      console.log("SB1");
      this.loadScene(this.currentScene);
      this.scene.rotation.set(0, 0, 0);
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      document
        .getElementById("sceneContainer")
        .appendChild(this.renderer.domElement);
      console.log("RENDER INIT SUCCESS");
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
        () => {
          alert("deviceorientation");
        }
        //this.onDeviceOrientation.bind(this)
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
      console.log(e);
      this.unloadScene(this.currentScene);
      this.currentScene = this.sceneMap[e.detail.dest];
      this.loadScene(this.currentScene);
    },
    loadScene: function(sc) {
      this.loadBgImg(sc.bgSrc);
      for (let obj of sc.jumpObj) {
        this.scene.add(obj);
      }
      for (let obj of sc.descObj) {
        console.log(obj);
        this.scene.add(obj);
      }
      for (let obj of sc.normalObj) {
        console.log(obj);
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
    loadBgImg: function(src) {
      this.skyboxReady = false;
      this.skyBoxTexture = new THREE.TextureLoader().load(src, () => {
        console.log("LODOK");
        this.skyboxReady = true;
        if (!(JSON.stringify(this.skyBoxMesh) === "{}")) {
          this.scene.remove(this.skyBoxMesh);
        }
        this.skyBoxMat = new THREE.MeshBasicMaterial({
          map: this.skyBoxTexture
        });
        this.skyBoxMesh = new THREE.Mesh(this.skyBoxGeom, this.skyBoxMat);
        this.scene.add(this.skyBoxMesh);
        console.log("LOAD SUCCESS");
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
    console.log("EVENY LISTENER INIT SUCCESS");
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