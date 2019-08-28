<template>
  <div>
    <!--SelectScene-->
    <div v-if="!selectScene" class="select" v-on:click="selectScene=true">切换场景</div>
    <div v-if="selectScene" id="selectPanel">
      <div
        v-for="item in getSceneNames()"
        :key="item"
        class="selectTag"
        v-on:click="jumpTo({detail:{dest:item}});selectScene=false"
      >{{item}}</div>
    </div>
    <div v-if="selectScene" class="select" v-on:click="selectScene=false">取消</div>
    <div v-if="editorAddIcon" class="editorPanel">
      <!-- ADD ICON-->
      <button v-on:click="edAddIcon()">确认</button>
      <button v-on:click="edIconMode=''; edIconContent=''; editorAddIcon=false">取消</button>
      <br />
      <select v-model="edIconMode">
        <option disabled value>选择图标类型</option>
        <option>jump</option>
        <option>audio</option>
        <option>text</option>
      </select>
      <br />
      <select v-if="edIconMode=='jump'" v-model="edIconContent" user-scalable="no">
        <option disabled value>选择场景</option>
        <option v-for="item in getSceneNames()" :key="item">{{item}}</option>
      </select>
      <input v-if="edIconMode=='audio'" v-model="edIconContent" placeholder="请输入音频链接" />
      <textarea v-if="edIconMode=='text'" v-model="edIconContent" placeholder="请输入文字介绍" />
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
    <!--TextDesc-->
    <div v-if="textDesc" id="textdesc">
      <br />
      {{textDescContent}}
      <div v-on:click="textDesc=false" id="textdescbtn">关闭</div>
    </div>
    <!--Scene-->
    <div id="sceneContainer" width="100%" height="100%">
      <button id="modebutton" v-if="touchMode" v-on:click="touchMode=false">切换至重力感应</button>
      <button id="modebutton2" v-else v-on:click="touchMode=true">恢复手动控制</button>
      <button class="edit" v-if="!editMode&&mode=='edit'" v-on:click="editModeOn()">开启编辑模式</button>
      <button class="edit" v-if="editMode" v-on:click="editModeOff()">关闭编辑模式</button>
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
      bigGeom: new THREE.PlaneGeometry(2, 2, 10, 10),
      smallGeom: new THREE.PlaneGeometry(1, 1, 10, 10),
      jumpTex: null,
      textTex: null,
      audioTex: null,
      jumpMat: null,
      textMat: null,
      audioMat: null,
      mode: "",
      token: "",
      editMode: false,
      selectScene: false,
      editCenter: {},
      editorAddIcon: false,
      editorAddScene: false,
      editorDelScene: false,
      edSceneName: "",
      edIconContent: "",
      edIconMode: "",
      textDesc: false,
      textDescContent: "",
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
      skyBoxMesh: 0,
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
      let ret = [];
      for (let name of this.sceneMap.keys()) {
        ret.push({
          key: name,
          value: this.sceneMap.get(name).stringify()
        });
      }
      let retstr = JSON.stringify({ scenes: ret, mode: this.mode });
      let retblob = new Blob([retstr], { type: "text/plain" });
      let file = new File([retblob], "vrconfig.txt");
      this.$axios.post(
        `https://dmsh.bupt.edu.cn/file_admin/api/resources/XTCVR/${file.name}?override=true`,
        file.slice(),
        {
          headers: { "X-Auth": this.token, "Content-Type": "text/html" }
        }
      );
      this.editMode = false;
      this.scene.remove(this.editCenter);
    },
    getSceneNames: function() {
      let ret = [];
      for (let name of this.sceneMap.keys()) {
        if (name == this.currentScene) continue;
        ret.push(name);
      }
      return ret;
    },
    edAddIcon: function() {
      let pos = {
        theta: THREE.Math.degToRad(this.eularAngle.x),
        row: 10,
        h: this.editCenter.position.y
      };
      if (this.edIconMode == "jump") {
        let cur = this.sceneMap.get(this.currentScene);
        let obj = cur.addJumpObj(
          this.getButton("jump"),
          this.edIconContent,
          pos
        );
        this.scene.add(obj);
      } else {
        let cur = this.sceneMap.get(this.currentScene);
        let obj = cur.addDescObj(
          this.getButton(this.edIconMode),
          this.edIconContent,
          this.edIconMode,
          pos
        );
        this.scene.add(obj);
      }
      this.edIconMode = "";
      this.edIconContent = "";
      this.editorAddIcon = false;
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
      if (!file || this.edSceneName.length == 0) {
        alert("输入无效，场景添加失败");
        return;
      }
      let img = await new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
          resolve(e.target.result);
        };
      });
      let compressedimg = await this.compressMap(img);
      let cutimg = await this.cutMap(img);
      let mini = await new Promise((resolve, reject) => {
        this.$axios
          .post(
            `https://dmsh.bupt.edu.cn/file_admin/api/resources/XTCVR/${compressedimg.name}?override=true`,
            compressedimg.slice(),
            {
              headers: { "X-Auth": this.token, "Content-Type": "text/html" }
            }
          )
          .then(
            resolve(
              `https://dmsh.bupt.edu.cn/files/XTCVR/${compressedimg.name}`
            )
          );
      });
      let partial = [];
      for (let cimg of cutimg) {
        let pt = await new Promise((resolve, reject) => {
          this.$axios
            .post(
              `https://dmsh.bupt.edu.cn/file_admin/api/resources/XTCVR/${cimg.name}?override=true`,
              cimg.slice(),
              {
                headers: { "X-Auth": this.token, "Content-Type": "text/html" }
              }
            )
            .then(resolve(`https://dmsh.bupt.edu.cn/files/XTCVR/${cimg.name}`));
        });
        partial.push(pt);
        //console.log(pt);
      }
      let sc = new sceneObj(this.edSceneName, mini, partial);
      this.sceneMap.set(sc.name, sc);
      this.edSceneName = "";
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
          let ret = new File([retblob], this.edSceneName + ".jpg");
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
            ret.push(new File([retblob], i + this.edSceneName + ".jpg"));
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
    sceneObjInit: function(objs) {
      console.log(objs);
      this.sceneMap = new Map();
      for (let obj of objs) {
        let sc = new sceneObj();
        sc.unstringify(obj.value, this.getButton.bind(this));
        //sc.jumpObj = [];
        //sc.descObj = [];
        /*if (obj.key == "校门口") {
          this.currentScene = sc;
        }*/
        this.currentScene = "校门口";
        this.sceneMap.set(obj.key, sc);
      }
      this.loadScene(this.currentScene);
      this.scene.rotation.set(0, 0, 0);
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
      window.addEventListener("textDesc", e => {
        this.textDesc = true;
        this.textDescContent = e.detail.text;
      });
    },

    onMouseDown: function(e) {
      if (this.textDesc || this.selectScene) return;
      //event.preventDefault();
      let ry = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(ry, this.camera);
      let intersections = this.raycaster.intersectObjects(this.scene.children);
      for (let obj of intersections) {
        if (!(obj.object.callbk === undefined)) {
          obj.object.callbk();
        }
      }
      if (!this.touchMode) return;
      this.mouseDown = true;
      this.pre.x = e.clientX;
      this.pre.y = e.clientY;
    },

    onMouseMove: function(e) {
      if (this.textDesc || this.selectScene) return;
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
      if (this.textDesc || this.selectScene) return;
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
      if (!this.selectScene) event.preventDefault();
      if (this.textDesc || this.selectScene) return;
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
      if (!this.sceneMap.has(e.detail.dest)) return;
      this.unloadScene(this.currentScene);
      //this.currentScene = null;
      this.currentScene = e.detail.dest; //this.sceneMap.get(e.detail.dest);
      this.loadScene(this.currentScene);
    },
    getButton: function(typ) {
      let arr = "";
      let geom;
      let mat;
      if (typ == "jump") {
        geom = this.bigGeom; //new THREE.PlaneGeometry(2, 2, 10, 10);
        mat = this.jumpMat; //arr = "https://dmsh.bupt.edu.cn/files/VR/arr.png";
      } else if (typ == "audio") {
        geom = this.smallGeom; //new THREE.PlaneGeometry(1, 1, 10, 10);
        mat = this.audioMat; //arr = "https://dmsh.bupt.edu.cn/files/VR/audio.png";
      } else {
        geom = this.smallGeom; //new THREE.PlaneGeometry(1, 1, 10, 10);
        mat = this.textMat; //arr = "https://dmsh.bupt.edu.cn/files/VR/text.png";
      }
      //let tex = new THREE.TextureLoader().load(arr);
      //tex.magFilter = THREE.NearestFilter;
      /*
      tex.generateMipmaps = false;
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;*/
      let planeObj = new THREE.Mesh(
        geom,
        mat /*
        new THREE.MeshBasicMaterial({
          map: tex,
          alphaTest: 0.5,
          side: THREE.DoubleSide
        })*/
      );
      return planeObj;
    },
    loadScene: function(sc) {
      let cur = this.sceneMap.get(sc);
      this.loadBgImg(cur.bgSrc);

      for (let obj of cur.jumpObj) {
        this.scene.add(obj);
      }

      for (let obj of cur.descObj) {
        this.scene.add(obj);
      }
      for (let obj of cur.normalObj) {
        this.scene.add(obj);
      }
    },
    unloadScene: function(sc) {
      let cur = this.sceneMap.get(sc);
      this.unloadBgImg();
      for (let obj of cur.jumpObj) {
        this.scene.remove(obj);
      }
      for (let obj of cur.descObj) {
        this.scene.remove(obj);
      }
      for (let obj of cur.normalObj) {
        this.scene.remove(obj);
      }
    },
    loadBgImg: function(src) {
      this.skyboxReady = false;
      this.skyBoxTexture = new THREE.TextureLoader().load(src, () => {
        this.skyboxReady = true;
        this.skyBoxTexture.generateMipmaps = false;
        this.skyBoxTexture.magFilter = THREE.LinearFilter;
        this.skyBoxTexture.minFilter =
          THREE.LinearFilter; /*
        if (!(JSON.stringify(this.skyBoxMesh) === "{}")) {
          this.scene.remove(this.skyBoxMesh);
          this.skyBoxMesh = null;
        }*/
        /*this.skyBoxMat.map  = new THREE.MeshBasicMaterial({
          map: this.skyBoxTexture
        });*/

        if (this.skyBoxMesh == 0) {
          this.skyBoxMat = new THREE.MeshBasicMaterial({
            map: this.skyBoxTexture
          });
          this.skyBoxMesh = new THREE.Mesh(this.skyBoxGeom, this.skyBoxMat);
          this.scene.add(this.skyBoxMesh);
        } else {
          this.skyBoxMat.map = this.skyBoxTexture;
        }

        //this.skyBoxMesh = new THREE.Mesh(this.skyBoxGeom, this.skyBoxMat);
        //this.scene.add(this.skyBoxMesh);
      });
    },
    unloadBgImg: function() {
      this.skyBoxMat.map.dispose();
      this.skyBoxMat.map = null;

      /*this.skyBoxMat.dispose();*/
      this.skyBoxTexture.dispose();
      this.skyBoxTexture = null;
      //this.skyBoxMat = null;
      this.skyBoxPartialOK = [false, false, false, false];
    },
    partialLoadBgImg: function(id) {
      this.skyBoxPartialOK[id] = true;
      let nowname = this.currentScene;
      let src = this.sceneMap.get(this.currentScene).partialSrc[id];
      let tm = window.setTimeout(() => {
        let tex = new THREE.TextureLoader().load(
          src,
          /*this.sceneMap.get(this.currentScene).partialSrc[id],*/
          () => {
            if (this.currentScene != nowname) {
              tex.dispose();
              tex = null;
              return;
            }
            tex.generateMipmaps = false;
            tex.magFilter = THREE.LinearFilter;
            tex.minFilter = THREE.LinearFilter;
            this.renderer.copyTextureToTexture(
              { x: id * 1024, y: 0 },
              tex,
              this.skyBoxTexture
            );
            tex.dispose();
            tex = null;
          }
        );
        window.clearTimeout(tm);
      }, 100);
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

      if (!this.skyboxReady) return;
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
    this.jumpTex = new THREE.TextureLoader().load(
      "https://dmsh.bupt.edu.cn/files/VR/arr.png"
    );
    this.textTex = new THREE.TextureLoader().load(
      "https://dmsh.bupt.edu.cn/files/VR/text.png"
    );
    this.audioTex = new THREE.TextureLoader().load(
      "https://dmsh.bupt.edu.cn/files/VR/audio.png"
    );
    this.jumpMat = new THREE.MeshBasicMaterial({
      map: this.jumpTex,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });
    this.audioMat = new THREE.MeshBasicMaterial({
      map: this.audioTex,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });
    this.textMat = new THREE.MeshBasicMaterial({
      map: this.textTex,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });
    let bk = "https://dmsh.bupt.edu.cn/file_admin/api/login";
    this.$axios
      .post(bk, null, {
        headers: { "Content-Type": "text/plain" }
      })
      .then(res => {
        this.token = res.data;
      });
    this.$axios
      .get("https://dmsh.bupt.edu.cn/files/XTCVR/vrconfig.txt")
      .then(res => {
        this.mode = res.data.mode;
        this.sceneObjInit(res.data.scenes);
        this.animate();
      });
    this.rendererInit();
    this.initEventListener();
    //this.animate();
  }
};
</script>
<style>
#textdesc {
  position: absolute;
  top: 10%;
  margin-left: -125px;
  left: 50%;
  height: 400px;
  width: 210px;
  border: none;
  border-radius: 0px;
  background-color: #ffffff;
  padding-left: 20px;
  padding-right: 20px;
  text-align: left;
  color: #303030;
  font-size: 18px;
  line-height: 30px;
  box-shadow: 3px 4px 10px #3a3a3a;
  z-index: 5;
}
#textdescbtn {
  position: absolute;
  top: 360px;
  margin-left: -125px;
  left: 50%;
  height: 40px;
  width: 250px;
  border: none;
  background-color: #ffffff;
  box-shadow: 0px -2px 2px #d1d1d1;
  font-weight: bold;
  font-size: 20px;
  line-height: 40px;
  text-align: center;
  vertical-align: middle;
  color: #303030;
}
body {
  margin: 0;
}
.select {
  position: absolute;
  top: 5%;
  left: 60%;
  height: 20px;
  width: 90px;
  border: none;
  border-radius: 5px;
  background-color: #ffffff;
  color: #0363b1;
  z-index: 4;
}
#selectPanel {
  position: absolute;
  top: 10%;
  margin-left: -125px;
  left: 50%;
  height: 400px;
  width: 250px;
  border: none;
  border-radius: 0px;
  background-color: #ffffff;
  text-align: left;
  color: #303030;
  font-size: 18px;
  line-height: 30px;
  box-shadow: 3px 4px 10px #3a3a3a;
  z-index: 10;
  overflow-x: hidden;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
}
#selectPanel::-webkit-scrollbar {
  display: none;
}
.selectTag {
  margin-left: 5px;
  left: 50%;
  margin-top: 4px;
  height: 50px;
  width: 200px;
  background-color: #ffffff;
  padding-left: 20px;
  padding-right: 20px;
  text-align: center;
  color: #303030;
  font-size: 18px;
  line-height: 50px;
  border-bottom: 1px solid #d3d3d3;
  z-index: 10;
}
#modebutton {
  position: absolute;
  top: 90%;
  left: 60%;
  height: 30px;
  border: none;
  border-radius: 5px;
  background-color: #616161;
  opacity: 0.7;
  color: #ffffff;
}
#modebutton2 {
  position: absolute;
  top: 90%;
  left: 60%;
  height: 30px;
  border: none;
  border-radius: 5px;
  background-color: #616161;
  opacity: 0.7;
  color: #ffffff;
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