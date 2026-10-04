/**
 * Self-contained 3D aircraft scene on the editorial obsidian field.
 *
 * Reproduced from the Stitch export, which embeds this document as an
 * `iframe srcdoc` so the deck's own document is never polluted by the global
 * `THREE` namespace. three.js r128 is pulled from the same cdnjs URL the export
 * uses. Camera orbit responds to pointer drag; the bank and hover motion are
 * driven by the original clock loop.
 */
export const THREE_SCENE_SRCDOC = `<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<style>
  body{margin:0;overflow:hidden;background:#0a0a0a;}
  canvas{display:block;width:100vw;height:100vh;}
</style>
<script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'></script>
</head>
<body>
<script>
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0a0a0a,0.015);
const camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
camera.position.set(0,18,36);
camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio));
document.body.appendChild(renderer.domElement);
const ambLight=new THREE.AmbientLight(0xffeedb,1.2);
scene.add(ambLight);
const dirLight=new THREE.DirectionalLight(0xcbb079,1.6);
dirLight.position.set(20,40,25);
scene.add(dirLight);
// Rim is warm platinum, never cool: a blue-dominant rim reads as cyberpunk on metal.
const rimLight=new THREE.DirectionalLight(0xe8e2d6,1.1);
rimLight.position.set(-20,-10,-20);
scene.add(rimLight);
const jetGroup=new THREE.Group();
const fuselageMat=new THREE.MeshStandardMaterial({color:0x1d1b18,roughness:0.25,metalness:0.85});
const goldMat=new THREE.MeshStandardMaterial({color:0xcbb079,roughness:0.3,metalness:0.8,emissive:0x3a2f18,emissiveIntensity:0.18});
const exhaustMat=new THREE.MeshStandardMaterial({color:0xe0cca0,roughness:0.4,metalness:0.5,emissive:0x2a2010,emissiveIntensity:0.3});
const glassMat=new THREE.MeshStandardMaterial({color:0x221e17,roughness:0.16,metalness:0.6,transparent:true,opacity:0.9});
const fuseGeo=new THREE.CylinderGeometry(1.0,0.5,14,32);
const fuse=new THREE.Mesh(fuseGeo,fuselageMat);
fuse.rotation.x=Math.PI/2;
jetGroup.add(fuse);
const noseGeo=new THREE.ConeGeometry(1.0,4,32);
const nose=new THREE.Mesh(noseGeo,fuselageMat);
nose.position.z=8.5;
nose.rotation.x=Math.PI/2;
jetGroup.add(nose);
const canopyGeo=new THREE.SphereGeometry(0.85,16,16,0,Math.PI*2,0,Math.PI/2.4);
const canopy=new THREE.Mesh(canopyGeo,glassMat);
canopy.position.set(0,0.6,5.2);
canopy.scale.set(0.8,0.7,2.2);
jetGroup.add(canopy);
const wingShape=new THREE.Shape();
wingShape.moveTo(0,0);
wingShape.lineTo(13,-7);
wingShape.lineTo(13,-8.2);
wingShape.lineTo(1,-3.5);
wingShape.lineTo(-1,-3.5);
wingShape.lineTo(-13,-8.2);
wingShape.lineTo(-13,-7);
wingShape.closePath();
const wingGeo=new THREE.ExtrudeGeometry(wingShape,{depth:0.15,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:0.06,bevelThickness:0.06});
const wings=new THREE.Mesh(wingGeo,fuselageMat);
wings.rotation.x=Math.PI/2;
wings.position.set(0,0.1,1.5);
jetGroup.add(wings);
const wingletGeo=new THREE.BoxGeometry(0.18,1.4,1.8);
const leftWinglet=new THREE.Mesh(wingletGeo,goldMat);
leftWinglet.position.set(13,0.7,-6.2);
leftWinglet.rotation.z=-0.3;
jetGroup.add(leftWinglet);
const rightWinglet=new THREE.Mesh(wingletGeo,goldMat);
rightWinglet.position.set(-13,0.7,-6.2);
rightWinglet.rotation.z=0.3;
jetGroup.add(rightWinglet);
const tailShape=new THREE.Shape();
tailShape.moveTo(0,0);
tailShape.lineTo(0,4);
tailShape.lineTo(-1.8,4.2);
tailShape.lineTo(-3,0);
tailShape.closePath();
const tailGeo=new THREE.ExtrudeGeometry(tailShape,{depth:0.15,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:0.04,bevelThickness:0.04});
const vertTail=new THREE.Mesh(tailGeo,fuselageMat);
vertTail.rotation.y=Math.PI/2;
vertTail.position.set(-0.075,0.7,-4);
jetGroup.add(vertTail);
const hTailShape=new THREE.Shape();
hTailShape.moveTo(0,0);
hTailShape.lineTo(4.5,-2.2);
hTailShape.lineTo(4.5,-2.7);
hTailShape.lineTo(0,-1.2);
hTailShape.lineTo(-4.5,-2.7);
hTailShape.lineTo(-4.5,-2.2);
hTailShape.closePath();
const hTailGeo=new THREE.ExtrudeGeometry(hTailShape,{depth:0.12,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:0.03,bevelThickness:0.03});
const hTail=new THREE.Mesh(hTailGeo,fuselageMat);
hTail.rotation.x=Math.PI/2;
hTail.position.set(0,4.4,-6.5);
jetGroup.add(hTail);
const engGeo=new THREE.CylinderGeometry(0.55,0.48,3.6,24);
const engL=new THREE.Mesh(engGeo,goldMat);
engL.rotation.x=Math.PI/2;
engL.position.set(1.4,0.7,-3.6);
jetGroup.add(engL);
const engR=new THREE.Mesh(engGeo,goldMat);
engR.rotation.x=Math.PI/2;
engR.position.set(-1.4,0.7,-3.6);
jetGroup.add(engR);
const exGeo=new THREE.CylinderGeometry(0.35,0.4,0.4,16);
const exL=new THREE.Mesh(exGeo,exhaustMat);
exL.rotation.x=Math.PI/2;
exL.position.set(1.4,0.7,-5.5);
jetGroup.add(exL);
const exR=new THREE.Mesh(exGeo,exhaustMat);
exR.rotation.x=Math.PI/2;
exR.position.set(-1.4,0.7,-5.5);
jetGroup.add(exR);
scene.add(jetGroup);
const ringsGroup=new THREE.Group();
const ring1Geo=new THREE.RingGeometry(18,18.08,64);
const ringMat1=new THREE.MeshBasicMaterial({color:0x4d4636,side:THREE.DoubleSide,transparent:true,opacity:0.22});
const ring1=new THREE.Mesh(ring1Geo,ringMat1);
ring1.rotation.x=Math.PI/2;
ringsGroup.add(ring1);
const ring2Geo=new THREE.RingGeometry(10,10.08,48);
const ringMat2=new THREE.MeshBasicMaterial({color:0xcbb079,side:THREE.DoubleSide,transparent:true,opacity:0.12});
const ring2=new THREE.Mesh(ring2Geo,ringMat2);
ring2.rotation.x=Math.PI/2;
ringsGroup.add(ring2);
scene.add(ringsGroup);
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let clock=new THREE.Clock();
let isDragging=false,prevX=0,prevY=0;
window.addEventListener('mousedown',(e)=>{
isDragging=true;
prevX=e.clientX;
prevY=e.clientY;
});
window.addEventListener('mouseup',()=>isDragging=false);
window.addEventListener('mousemove',(e)=>{
if(!isDragging)return;
const dx=e.clientX-prevX;
const dy=e.clientY-prevY;
jetGroup.rotation.y+=dx*0.008;
jetGroup.rotation.x+=dy*0.006;
prevX=e.clientX;
prevY=e.clientY;
});
function renderFrame(){
renderer.render(scene,camera);
}
function animate(){
requestAnimationFrame(animate);
const t=clock.getElapsedTime();
if(!isDragging){
jetGroup.rotation.y=Math.sin(t*0.45)*0.25;
jetGroup.rotation.z=Math.cos(t*0.5)*0.08;
jetGroup.position.y=Math.sin(t*1.2)*0.45;
}
renderFrame();
}
if(reduceMotion){
jetGroup.rotation.y=0.25;
renderFrame();
}else{
animate();
}
window.addEventListener('resize',()=>{
camera.aspect=window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth,window.innerHeight);
});
</script>
</body>
</html>`;
