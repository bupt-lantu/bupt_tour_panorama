import { format } from "path";

//import * as THREE from "three";

export default class sceneObj {
  constructor(name, src, partialSrc) {
    this.name = name;
    this.active = false;
    this.jumpObj = [];
    this.descObj = [];
    this.normalObj = [];
    this.bgSrc = src;
    this.partialSrc = partialSrc;
  }
  addNormalObj(obj) {
    this.normalObj.push(obj);
  }
  addJumpObj(obj, dest, position, id = "") {
    this.calcObjPos(obj, position);
    obj.positionInfo = position;
    obj.dest = dest;
    obj.uniqueId = id.length == 0 ? JSON.stringify(new Date().getTime()) : id;
    obj.callbk = (scene = {}, del = false) => {
      if (del) {
        this.jumpObj = this.jumpObj.filter(item => {
          return item.uniqueId != obj.uniqueId;
        });
        scene.remove(obj);
        this.deleteMode = false;
        return;
      }
      let e = new CustomEvent("jumpTo", {
        detail: { from: this.name, dest: dest },
        bubbles: false
      });
      dispatchEvent(e);
    };
    this.jumpObj.push(obj);
    return obj;
  }
  addDescObj(obj, src, tp, position, id = "") {
    this.calcObjPos(obj, position);
    obj.positionInfo = position;
    obj.tp = tp;
    obj.uniqueId = id.length == 0 ? JSON.stringify(new Date().getTime()) : id;
    obj.descSrc = src;
    if (tp == "audio") {
      obj.callbk = (scene = {}, del = false) => {
        if (del) {
          this.descObj = this.descObj.filter(item => {
            return item.uniqueId != obj.uniqueId;
          });
          scene.remove(obj);
          this.deleteMode = false;
          return;
        }
        let audio = document.getElementById("desc");
        audio.src = src;
        audio.play();
      };
    } else {
      obj.callbk = (scene = {}, del = false) => {
        if (del) {
          this.descObj = this.descObj.filter(item => {
            return item.uniqueId != obj.uniqueId;
          });
          scene.remove(obj);
          this.deleteMode = false;
          return;
        }
        let e = new CustomEvent("textDesc", {
          detail: { text: src },
          bubbles: false
        });
        dispatchEvent(e);
      };
    }
    this.descObj.push(obj);
    return obj;
  }
  calcObjPos(obj, position) {
    let row = position.row;
    let theta = position.theta;
    let h = position.h;
    obj.position.x = row * Math.cos(theta);
    obj.position.y = h;
    obj.position.z = row * Math.sin(theta);
    obj.rotation.y = Math.PI / 2;
    obj.rotation.y = Math.PI / 2 - theta;
  }
  stringify() {
    let jumpobj = [];
    for (let obj of this.jumpObj) {
      jumpobj.push({
        dest: obj.dest,
        position: obj.positionInfo,
        uniqueId: obj.uniqueId
      });
    }
    let descobj = [];
    for (let obj of this.descObj) {
      descobj.push({
        src: obj.descSrc,
        tp: obj.tp,
        position: obj.positionInfo,
        uniqueId: obj.uniqueId
      });
    }
    let retobj = {
      name: this.name,
      bgSrc: this.bgSrc,
      partialSrc: this.partialSrc,
      //bgPreSrc: this.bgPreSrc,
      jumpobj: jumpobj,
      descobj: descobj
    };
    return JSON.stringify(retobj);
  }
  unstringify(str, ObjCreator) {
    let sceneobj = JSON.parse(str);
    this.name = sceneobj.name;
    this.active = false;
    this.bgSrc = sceneobj.bgSrc;
    this.partialSrc = sceneobj.partialSrc;
    //this.bgPreSrc = sceneobj.bgPreSrc;
    for (let o of sceneobj.jumpobj) {
      let obj = ObjCreator("jump");
      this.addJumpObj(obj, o.dest, o.position, o.uniqueId);
    }
    for (let o of sceneobj.descobj) {
      let obj = ObjCreator(o.tp);
      this.addDescObj(obj, o.src, o.tp, o.position, o.uniqueId);
    }
  }
}
/*
{
  "name":"图书馆和教学楼间",
  "bgSrc":"https://i.loli.net/2019/07/07/5d21fc2e85ed526354.jpg",
  "bgPreSrc":"https://i.loli.net/2019/07/07/5d22104ea845884854.jpg",
  "jumpobj":[
    {"dest":"靠近图书馆","position":{"theta":1.5707963267948966,"row":10,"h":1}},
    {"dest":"教室地下","position":{"theta":-1.5707963267948966,"row":10,"h":1}}],
  "descobj":[]
}*/
