<template>
<div>
  <div id="sceneContainer" width="100%" height="100%">
    <button v-on:click="setBG()">应用更改</button>
    {{this.eularAngle.x}}
    {{this.eularAngle.y}}
    <button v-if="touchMode" v-on:click = "touchMode=false"> 切换至重力感应 </button>
    <button v-else v-on:click = "touchMode=true"> 恢复手动控制 </button>
  </div>
</div>
</template> 

<script>
import * as THREE from 'three'
import { Matrix4 } from 'three';
import  orientHandler  from './scripts/orienter.js'
export default {
  name: 'HelloWorld',
  data(){
    return {
      img1: "https://i.loli.net/2019/05/20/5ce24006dcc9389408.jpg",
      img2: "https://i.loli.net/2019/05/20/5ce24006dcf7e51423.jpg",
      mat: {},
      texture: {},
      geom: {},
      touchMode: true,
      skyboxReady: false,
      camera: null,
      scene: null,
      renderer: null,
      raycaster: null,
      mesh: null,
      mouseDown:false,
      touchDown:false,
      mouseSpeed: 0.1,
      touchSpeed:0.1,
      pre:{x: 0, y: 0},
      eularAngle:{x:0,y:0},
      deviceOrientationData: {
        alpha: 0,
        beta: 0,
        gamma: 0
      },
      currentScreenOrientation: 0,
      orientH: null
    }

  },
  props: {
    msg: String
  },
  methods: {

    rendererInit: function(){
      this.scene = new THREE.Scene();
      this.scene.updateMatrixWorld(true);
      this.camera = new THREE.PerspectiveCamera(72,window.innerWidth/window.innerHeight,0.01,1000);
      this.camera.target = new THREE.Vector3(0,0,0);
      this.raycaster = new THREE.Raycaster();
      this.orientH = new orientHandler();
      this.geom = new THREE.SphereGeometry(100,100,100);
      this.geom.scale(1,1,-1);
      this.texture = new THREE.TextureLoader().load(
        //"https://i.loli.net/2019/04/29/5cc6f0512a9cd.jpg",
        //"https://i.loli.net/2019/05/19/5ce11f893fe1125722.jpg",
        //"https://i.loli.net/2019/05/19/5ce121f482da993578.jpg",
        this.img1
        );//
        this.mat = new THREE.MeshBasicMaterial({map: this.texture});
        this.mesh = new THREE.Mesh(this.geom,this.mat);
        this.scene.add(this.mesh);
        this.scene.rotation.set(0,0,0);
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        document.getElementById("sceneContainer").appendChild(this.renderer.domElement);
        this.initEventListener();
        this.animate();
        let cubeobj = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        cubeobj.position.x = cubeobj.position.y = 3;
        cubeobj.callbk = ()=>{
          this.setBGImg(this.img2);
        }
        this.scene.add(cubeobj);
    },
    block(){
      while(!this.skyboxReady);
    },

    initEventListener: function(){
      window.addEventListener( 'mousedown', this.onMouseDown.bind(this));
      window.addEventListener( 'mousemove', this.onMouseMove.bind(this));
      window.addEventListener( 'mouseup', this.onMouseUp.bind(this));
      window.addEventListener( 'touchstart', this.onTouchStart.bind(this));
      window.addEventListener( 'touchmove', this.onTouchMove.bind(this), { passive: false });
      window.addEventListener( 'touchend', this.onTouchEnd.bind(this));
      window.addEventListener( 'resize',()=>{
        this.camera.aspect = window.innerWidth/window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth,window.innerHeight);
      });
      window.addEventListener( 'deviceorientation', this.onDeviceOrientation.bind(this));
      window.addEventListener( 'orientationchange', this.onOrientationChange.bind(this));
    },

    onMouseDown: function(e){
      event.preventDefault();
      let ry = new THREE.Vector2(
         (e.clientX / window.innerWidth)*2-1,
        -(e.clientY / window.innerHeight)*2+1
      )
      this.raycaster.setFromCamera(ry,this.camera);
      let intersections = this.raycaster.intersectObjects(this.scene.children);
      for(let obj of intersections){
        if(!(obj.object.callbk===undefined)) obj.object.callbk()
      }
      if(!this.touchMode) return;
      this.mouseDown = true;
      this.pre.x = e.clientX;
      this.pre.y = e.clientY;
    },

    onMouseMove: function(e){
      if(this.mouseDown){
        this.eularAngle.x += (this.pre.x-e.clientX)*this.mouseSpeed;
        this.eularAngle.y += (e.clientY-this.pre.y)*this.mouseSpeed;
        this.pre.x = e.clientX;
        this.pre.y = e.clientY;
      }
    },

    onMouseUp: function(e){
      this.mouseDown = false;
    },

    onTouchStart: function(e){
      event.preventDefault();
      let ry = new THREE.Vector2(
         (e.touches[0].clientX / window.innerWidth)*2-1,
        -(e.touches[0].clientY / window.innerHeight)*2+1
      )
      this.raycaster.setFromCamera(ry,this.camera);
      let intersections = this.raycaster.intersectObjects(this.scene.children);
      for(let obj of intersections){
        if(!(obj.object.callbk===undefined)) obj.object.callbk()
      }
      if(!this.touchMode) return;
      this.touchDown = true;
      this.pre.x = e.touches[0].clientX;
      this.pre.y = e.touches[0].clientY;
    },

    onTouchMove: function(e){
      event.preventDefault();
      if(this.touchDown){
        this.eularAngle.x += (this.pre.x-e.touches[0].clientX)*this.touchSpeed;
        this.eularAngle.y -= (this.pre.y-e.touches[0].clientY)*this.touchSpeed;
        //console.log(this.eularAngle.x,this.eularAngle.y);
        this.pre.x = e.touches[0].clientX;
        this.pre.y = e.touches[0].clientY;
      }
    },

    onTouchEnd: function(e){
      this.touchDown = false;
    },

    onDeviceOrientation: function(e){
      this.deviceOrientationData = e;
      if(this.touchMode) return;
      let ret = this.orientH.handleOrient(this.currentScreenOrientation,e);
      this.eularAngle.y = ret.lat;
      this.eularAngle.x = ret.lon;
    },

    onOrientationChange: function(e){
      this.currentScreenOrientation = window.orientation;
    },
    setBGImg: function(src){
      console.log(src);
      this.mat.dispose();
      this.texture.dispose();
      this.sktboxReady = false;
      this.texture = new THREE.TextureLoader().load(
        //"https://i.loli.net/2019/05/03/5ccc5d21e7a05.jpg",
        src,
        ()=>{this.skyboxReady = true;}
      );
      //this.block();//CALLBACK FUCK OFF
      this.scene.remove(this.mesh);
      this.mat = new THREE.MeshBasicMaterial({map:this.texture});
      this.mesh = new THREE.Mesh(this.geom,this.mat);
      this.scene.add(this.mesh);
    },
    setBG: function(e){
      this.setBGImg(this.img1);
    },
    Update(){
      if(this.eularAngle.y>85) {this.eularAngle.y = 85;}
      else if(this.eularAngle.y<-85){this.eularAngle.y = -85;}
      if(this.eularAngle.x>=360){this.eularAngle.x %= 360;}
      else if(this.eularAngle.x<0){this.eularAngle.x = (this.eularAngle.x%360)+360;}
      let eularRadX = THREE.Math.degToRad(this.eularAngle.x);
      let eularRadY = THREE.Math.degToRad(90-this.eularAngle.y);
      this.camera.target.x = 500*Math.sin(eularRadY)*Math.cos(eularRadX);
      this.camera.target.y = 500*Math.cos(eularRadY);
      this.camera.target.z = 500*Math.sin(eularRadX)*Math.sin(eularRadY);
      this.camera.lookAt(this.camera.target);
      this.renderer.render(this.scene,this.camera);
    },

    animate: function(){
      requestAnimationFrame(this.animate);
      this.Update();
    },

  },
  mounted(){
    this.rendererInit();
    //this.animate();
  }
}
</script>
<style>
  body {margin: 0;}
</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->
