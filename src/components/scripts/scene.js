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
    this.texture = {};
  }
  addNormalObj(obj) {
    this.normalObj.push(obj);
  }
  addJumpObj(obj, dest) {
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
  addDescObj(obj, src) {
    obj.callbk = () => {
      let audio = document.getElementById("desc");
      audio.src = src;
      audio.play();
    };
    this.descObj.push(obj);
  }
}
