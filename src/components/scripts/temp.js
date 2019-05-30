let sphereobj = new THREE.Mesh(new THREE.SphereGeometry(0.5,10,10),new THREE.MeshBasicMaterial({color: 0xffffff}));
sphereobj.position.x = 10 ,sphereobj.position.y = 2.5; sphereobj.position.z = -10
scene1.addJumpObj(cubeobj1,0);
scene1.addDescObj(sphereobj,'https://langdu.cdn.bjadks.com/DataFile/Upload/User/Audio/20190528143945_45556.mp3');
obj.callbk = ()=>{
    console.log("this is a description");
    console.log(src);
    let audio = new Audio();
    audio.src = src;
    audio.autoplay = true;
    document.body.appendChild(audio);
};