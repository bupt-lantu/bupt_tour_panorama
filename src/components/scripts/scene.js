import { format } from "path";

//import * as THREE from "three";

export default class sceneObj {
  constructor(name, src, presrc = "") {
    this.name = name;
    this.active = false;
    this.jumpObj = [];
    this.descObj = [];
    this.normalObj = [];
    this.bgSrc = src;
    this.bgPreSrc = presrc;
  }
  addNormalObj(obj) {
    this.normalObj.push(obj);
  }
  addJumpObj(obj, dest, position) {
    this.calcObjPos(obj, position);
    obj.positionInfo = position;
    obj.dest = dest;
    obj.callbk = () => {
      //alert("OK!");
      let e = new CustomEvent("jumpTo", {
        detail: { from: this.name, dest: dest },
        bubbles: false
      });
      dispatchEvent(e);
    };
    this.jumpObj.push(obj);
  }
  addDescObj(obj, src, tp, position) {
    this.calcObjPos(obj, position);
    obj.positionInfo = position;
    obj.tp = tp;
    obj.descSrc = src;
    if (tp == "audio") {
      obj.callbk = () => {
        let audio = document.getElementById("desc");
        audio.src = src;
        audio.play();
      };
    } else {
      obj.callbk = () => {
        let e = new CustomEvent("textDesc", {
          detail: { text: src },
          bubbles: false
        });
        dispatchEvent(e);
      };
    }
    this.descObj.push(obj);
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
        position: obj.positionInfo
      });
    }
    let descobj = [];
    for (let obj of this.descObj) {
      descobj.push({
        src: obj.descSrc,
        tp: obj.tp,
        position: obj.positionInfo
      });
    }
    let retobj = {
      name: this.name,
      bgSrc: this.bgSrc,
      bgPreSrc: this.bgPreSrc,
      jumpobj: jumpobj,
      descobj: descobj
    };
    console.log(retobj);
    console.log(JSON.stringify(retobj));
    return JSON.stringify(retobj);
  }
  unstringify(str, jumpObjCreator) {
    let sceneobj = JSON.parse(str);
    this.name = sceneobj.name;
    this.active = false;
    this.bgSrc = sceneobj.bgSrc;
    this.bgPreSrc = sceneobj.bgPreSrc;
    for (let o of sceneobj.jumpobj) {
      let obj = jumpObjCreator();
      this.addJumpObj(obj, o.dest, o.position);
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
