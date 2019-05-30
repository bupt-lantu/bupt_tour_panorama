import * as THREE from 'three'

export default class sceneObj{
    constructor(id,src,scene){
        this.id = id;
        this.active = false;
        this.scene = scene;
        this.jumpObj = [];
        this.descObj = [];
        this.setBgSrc(src);
    }
    addJumpObj(obj, dest){
        obj.callbk = ()=>{
            let e = new CustomEvent(
                'jumpTo',
                {
                    detail: {dest: dest},
                    bubbles: false
                }
            )
            dispatchEvent(e);
        };
        this.jumpObj.push(obj);
    }
    addDescObj(obj, src){
        obj.callbk = ()=>{
            console.log("this is a description");
            console.log(src);
            let audio = new Audio();
            audio.src = src;
            audio.autoplay = true;
            document.body.appendChild(audio);
        };
        this.descObj.push(obj);
    }
    setBgSrc(src){
        this.bgSrc = src;
        this.setBgMesh();
    }
    setBgMesh(){
        let geom = new THREE.SphereGeometry(100,100,100);
        geom.scale(1,1,-1);
        let texture = new THREE.TextureLoader().load(this.bgSrc);
        let mat = new THREE.MeshBasicMaterial({map:texture});
        this.bgMesh = new THREE.Mesh(geom,mat);
    }
    load(){
        this.active = true;
        this.scene.add(this.bgMesh);
        for(let obj of this.jumpObj){
            this.scene.add(obj);
        }
        for(let obj of this.descObj){
            this.scene.add(obj);
        }
    }
    unload(){
        this.scene.remove(this.bgMesh);
        for(let obj of this.jumpObj){
            this.scene.remove(obj);
        }
        for(let obj of this.descObj){
            this.scene.remove(obj);
        }
        this.active = false;
    }
}