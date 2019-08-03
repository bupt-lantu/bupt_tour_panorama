<template>
  <div>
    <div v-if="editorAddIcon" class="editorPanel">
      <!-- ADD ICON-->
      <button v-on:click="edAddIcon()">确认</button>
      <button v-on:click="edIconContent=''; editorAddIcon=false">取消</button>
      <br />
      <select v-model="edIconMode">
        <option disabled value>选择图标类型</option>
        <option>jump</option>
        <option>audio</option>
        <option>text</option>
      </select>
      <br />
      <select v-if="edIconMode=='jump'" v-model="edIconContent">
        <option disabled value>选择场景</option>
        <option v-for="item in getSceneNames()" :key="item">{{item}}</option>
      </select>
      <input
        v-if="edIconMode=='audio'||edIconMode=='text'"
        v-model="edIconContent"
        placeholder="请输入音频链接/文字介绍"
      />
      <div>
        位置
        <br />
        X{{editCenter.position.x}}
        <br />
        Y{{editCenter.position.y}}
        <br />
        Z{{editCenter.position.z}}
      </div>
    </div>
    <!-- ADD SCENE-->
    <div v-if="editorAddScene" class="editorPanel">
      <button v-on:click="edAddScene()">确认</button>
      <button v-on:click="edSceneName=''; editorAddScene=false">取消</button>
      <br />
      <input v-model="edSceneName" placeholder="请输入场景名称" />
      <input type="file" id="upload" />
    </div>
    <!--Delete Scene-->
    <div v-if="editorDelScene" class="editorPanel">
      <button v-on:click="edDelScene()">确认</button>
      <button v-on:click="edSceneName=''; editorDelScene=false">取消</button>
      <br />
      <select v-model="edSceneName">
        <option disabled value>选择场景</option>
        <option v-for="item in getSceneNames()" :key="item">{{item}}</option>
      </select>
    </div>
    <!--Scene-->
    <div id="sceneContainer" width="100%" height="100%">
      <button id="modebutton" v-if="touchMode" v-on:click="touchMode=false">切换至重力感应</button>
      <button id="modebutton2" v-else v-on:click="touchMode=true">恢复手动控制</button>
      <button class="edit" v-if="!editMode" v-on:click="editModeOn()">开启编辑模式</button>
      <button class="edit" v-else v-on:click="editModeOff()">关闭编辑模式</button>
      <div id="editbar" v-if="editMode">
        <button v-on:click="editorAddIcon=true">添加图标</button>
        <button v-on:click="edDelIcon()">删除图标</button>
        <button v-on:click="editorAddScene=true">添加场景</button>
        <button v-on:click="editorDelScene=true">删除场景</button>
      </div>
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
import { Promise, reject } from "q";
export default {
  name: "HelloWorld",
  data() {
    return {
      editMode: false,
      editCenter: {},
      editorAddIcon: false,
      editorAddScene: false,
      editorDelScene: false,
      edSceneName: "",
      edIconContent: "",
      edIconMode: "",
      sceneMap: {},
      currentScene: "",
      skyBoxPartialOK: [false, false, false, false],
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
    editModeOn: function() {
      this.editMode = true;
      this.scene.add(this.editCenter);
    },
    editModeOff: function() {
      this.editMode = false;
      this.scene.remove(this.editCenter);
    },
    getSceneNames: function() {
      let ret = [];
      for (let name of this.sceneMap.keys()) {
        if (name == this.currentScene.name) continue;
        ret.push(name);
      }
      return ret;
    },
    edAddIcon: function() {
      if (this.edIconMode == "jump") {
        let obj = this.currentScene.addJumpObj(
          this.getJumpButton(),
          this.edIconContent,
          {
            theta: THREE.Math.degToRad(this.eularAngle.x),
            row: 10,
            h: this.editCenter.position.y
          }
        );
        this.scene.add(obj);
        this.editorAddIcon = false;
      } else {
      }
      this.currentScene;
    },
    edDelIcon: function() {
      event.preventDefault();
      let ry = new THREE.Vector2(0, 0);
      this.raycaster.setFromCamera(ry, this.camera);
      let intersections = this.raycaster.intersectObjects(this.scene.children);
      for (let obj of intersections) {
        if (!(obj.object.callbk === undefined))
          obj.object.callbk(this.scene, true);
      }
    },
    edAddScene: async function() {
      this.editorAddScene = false;
      let file = document.getElementById("upload").files[0];
      if (!file || this.edSceneName.length == 0) return;
      let img = await new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
          resolve(e.target.result);
        };
      });
      let compressedimg = await this.compressMap(img);
      let cutimg = await this.cutMap(img);
      let formdata = new FormData();
      formdata.append("file", compressedimg);
      let mini = await new Promise((resolve, reject) => {
        this.$axios
          .post("http://localhost:3000/api/upload", formdata)
          .then(res => {
            resolve(res);
          });
      });
      //console.log(mini);
      let partial = [];
      for (let cimg of cutimg) {
        formdata = new FormData();
        formdata.append("file", cimg);
        let pt = await new Promise((resolve, reject) => {
          this.$axios
            .post("http://localhost:3000/api/upload", formdata)
            .then(res => {
              resolve(res);
            });
        });
        partial.push(pt.data.url);
        //console.log(pt);
      }
      let sc = new sceneObj(this.edSceneName, mini.data.url, partial);
      this.sceneMap.set(sc.name, sc);
    },
    edDelScene: function() {
      this.sceneMap.delete(this.edSceneName);
      this.edSceneName = "";
      //console.log(this.edSceneName, this.sceneMap);
      this.editorDelScene = false;
    },
    compressMap: function(src) {
      return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = src;
        img.onload = () => {
          let canvast = document.createElement("canvas");
          let ctx = canvast.getContext("2d");
          //(img.width = 4096), (img.height = 2048);
          (canvast.width = 4096), (canvast.height = 2048);
          ctx.drawImage(img, 0, 0, 4096, 2048);
          let retblob = this.dataURLtoBlob(
            canvast.toDataURL("image/jpeg", 0.2)
          );
          let ret = new File([retblob], "test.jpg");
          resolve(ret);
        };
      });
    },
    cutMap: function(src) {
      return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = src;
        img.onload = () => {
          let canvast = document.createElement("canvas");
          let ctx = canvast.getContext("2d");
          //(img.width = 4096), (img.height = 2048);
          (canvast.width = 1024), (canvast.height = 2048);
          let ret = [];
          for (let i = 0; i < 4; i++) {
            ctx.drawImage(img, -i * 1024, 0, 4096, 2048);
            let retblob = this.dataURLtoBlob(
              canvast.toDataURL("image/jpeg", 0.95)
            );
            ret.push(new File([retblob], "test.jpg"));
          }
          resolve(ret);
        };
      });
    },
    dataURLtoBlob: function(dataurl) {
      var arr = dataurl.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    },
    sceneObjInit: function() {
      let img0 = "http://localhost:3000/97de0ac023ea3f62ea1a0c6467e5bc6b.png";
      let img00 = "http://localhost:3000/900aabf7c3d7a339848019734187001a.png";
      let img01 = "http://localhost:3000/16e1531871201e40617bdc1420872bd8.png";
      let img02 = "http://localhost:3000/2ea4e4769f475d265bac7be1383feb05.png";
      let img03 = "http://localhost:3000/6f8b841c636b924d652bbde9881c5e19.png";
      let scene0 = new sceneObj("校门口", img0, [img00, img01, img02, img03]);
      this.currentScene = scene0;
      this.sceneMap = new Map();
      this.sceneMap.set(scene0.name, scene0);
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
      this.editCenter = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      this.editCenter.position.x = 10;
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
      //event.preventDefault();
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
      //event.preventDefault();
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
      this.currentScene = this.sceneMap.get(e.detail.dest);
      this.loadScene(this.currentScene);
    },
    getJumpButton: function() {
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
      return planeObj;
    },
    loadScene: function(sc) {
      this.loadBgImg(sc.bgSrc);
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
      this.skyBoxPartialOK = [false, false, false, false];
    },
    partialLoadBgImg: function(id) {
      this.skyBoxPartialOK[id] = true;
      let nowname = this.currentScene.name;
      let tex = new THREE.TextureLoader().load(
        this.currentScene.partialSrc[id],
        () => {
          if (this.currentScene.name != nowname) return;
          tex.generateMipmaps = false;
          tex.magFilter = THREE.LinearFilter;
          tex.minFilter = THREE.LinearFilter;
          this.renderer.copyTextureToTexture(
            { x: id * 1024, y: 0 },
            tex,
            this.skyBoxTexture
          );
          console.log("PL OK", id);
        }
      );
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
      this.editCenter.position.x =
        10 * Math.sin(eularRadY) * Math.cos(eularRadX);
      this.editCenter.position.y = 10 * Math.cos(eularRadY);
      this.editCenter.position.z =
        10 * Math.sin(eularRadX) * Math.sin(eularRadY);
      if (270 <= this.eularAngle.x || this.eularAngle.x < 90) {
        if (!this.skyBoxPartialOK[1]) {
          this.partialLoadBgImg(1);
        }
        if (!this.skyBoxPartialOK[2]) {
          this.partialLoadBgImg(2);
        }
      } else {
        if (!this.skyBoxPartialOK[3]) {
          this.partialLoadBgImg(3);
        }
        if (!this.skyBoxPartialOK[0]) {
          this.partialLoadBgImg(0);
        }
      }
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
#modebutton {
  position: absolute;
  top: 90%;
  left: 60%;
  height: 20px;
  border: none;
  border-radius: 10px;
  background-color: #616161;
  opacity: 0.7;
  color: #000000;
}
#modebutton2 {
  position: absolute;
  top: 90%;
  left: 60%;
  height: 20px;
  border: none;
  border-radius: 10px;
  background-color: #616161;
  opacity: 0.7;
  color: #000000;
}
.edit {
  position: absolute;
  top: 10%;
  margin-left: -150px;
  left: 50%;
  height: 30px;
  width: 300px;
  border: none;
  border-radius: 10px;
  background-color: #616161;
  opacity: 0.7;
  color: #000000;
}
#editbar {
  position: absolute;
  top: 5%;
  left: 50%;
  margin-left: -150px;
  width: 300px;
  background-color: #616161;
  opacity: 0.7;
  color: #000000;
}
.editorPanel {
  position: absolute;
  top: 25%;
  margin-left: -150px;
  left: 50%;
  height: 160px;
  width: 300px;
  border: none;
  border-radius: 10px;
  background-color: #616161;
  opacity: 0.7;
  color: #000000;
}
</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->