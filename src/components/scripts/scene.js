//import * as THREE from "three";

export default class sceneObj {
  constructor(name, src) {
    this.name = name;
    this.active = false;
    this.jumpObj = [];
    this.descObj = [];
    this.normalObj = [];
    this.bgSrc = src;
    this.texture = {};
  }
  addNormalObj(obj) {
    this.normalObj.push(obj);
  }
  addJumpObj(obj, dest) {
    obj.callbk = () => {
      let e = new CustomEvent("jumpTo", {
        detail: { from: this.name, dest: dest },
        bubbles: false
      });
      dispatchEvent(e);
    };
    this.jumpObj.push(obj);
  }
  addDescObj(obj, src) {
    obj.callbk = () => {
      console.log("this is a description");
      console.log(src);
      let audio = document.getElementById("desc");
      audio.src = src;
      audio.play();
    };
    this.descObj.push(obj);
  }
}
