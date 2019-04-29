<template>
  <div id="sceneContainer"></div>
</template>

<script>

import * as THREE from 'three'

export default {
  name: 'HelloWorld',
  data(){
    return {
      camera: null,
      scene: null,
      renderer: null,
      mesh: null,
      mouseDown:false,
      touchDown:false,
      mouseSpeed: 0.1,
      touchSpeed:0.1,
      pre:{x: 0, y: 0},
      eularAngle:{x:0,y:0}
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
      let geom = new THREE.SphereGeometry(1,32,16);
      geom.scale(1,1,-1);
      let mat;
      let texture = new THREE.TextureLoader().load(
        "https://i.loli.net/2019/04/29/5cc6f0512a9cd.jpg",
        (tex)=>{
          mat = new THREE.MeshBasicMaterial({map: tex});
          console.log(tex);
          this.mesh = new THREE.Mesh(geom,mat);
          this.scene.add(this.mesh);
          this.scene.rotation.set(0,0,0);
          this.renderer = new THREE.WebGLRenderer({antialias: true});
          this.renderer.setSize(window.innerWidth,window.innerHeight);
          document.getElementById("sceneContainer").appendChild(this.renderer.domElement);
          this.initEventListener();
          this.animate();
          }
        );//
      //console.log(texture);
    },
    Update(){
      let eularRadX = THREE.Math.degToRad(this.eularAngle.x);
      let eularRadY = THREE.Math.degToRad(90-this.eularAngle.y);
      //console.log(eularRadX,eularRadY);
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

    initEventListener: function(){
      window.addEventListener( 'mousedown', this.onMouseDown.bind(this));
      window.addEventListener( 'mousemove', this.onMouseMove.bind(this));
      window.addEventListener( 'mouseup', this.onMouseUp.bind(this));
      window.addEventListener( 'touchstart', this.onTouchStart.bind(this));
      window.addEventListener( 'touchmove', this.onTouchMove.bind(this));
      window.addEventListener( 'touchend', this.onTouchEnd.bind(this));
      window.addEventListener('resize',()=>{
        this.camera.aspect = window.innerWidth/window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth,window.innerHeight);
      })
    },

    onMouseDown: function(e){
      event.preventDefault();
      this.mouseDown = true;
      this.pre.x = e.clientX;
      this.pre.y = e.clientY;
      //console.log(this.eularAngle.x,this.eularAngle.y);
    },

    onMouseMove: function(e){
      if(this.mouseDown){
        this.eularAngle.x += (this.pre.x-e.clientX)*this.mouseSpeed;
        this.eularAngle.y += (e.clientY-this.pre.y)*this.mouseSpeed;
        //console.log(this.eularAngle.x,this.eularAngle.y);
        this.pre.x = e.clientX;
        this.pre.y = e.clientY;
      }
    },

    onMouseUp: function(e){
      this.mouseDown = false;
    },

    onTouchStart: function(e){
      event.preventDefault();
      this.touchDown = true;
      this.pre.x = e.touches[0].clientX;
      this.pre.y = e.touches[0].clientY;
    },

    onTouchMove: function(e){
      if(this.touchDown){
        this.eularAngle.x += (this.pre.x-e.touches[0].clientX)*this.touchSpeed;
        this.eularAngle.y += (e.touches[0].clientY-this.pre.y)*this.touchSpeed;
        //console.log(this.eularAngle.x,this.eularAngle.y);
        this.pre.x = e.touches[0].clientX;
        this.pre.y = e.touches[0].clientY;
      }
    },

    onTouchEnd: function(e){
      this.touchDown = false;
    }

  },
  mounted(){
    this.rendererInit();
    //this.animate();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
