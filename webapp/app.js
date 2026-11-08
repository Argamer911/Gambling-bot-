import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();
document.body.style.height = "100dvh";

const root = document.getElementById("game-root");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9aa9b8);
scene.fog = new THREE.Fog(0x9aa9b8, 18, 58);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 5.5, 9);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
root.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x46372c, 2.1));
const sun = new THREE.DirectionalLight(0xffe0bd, 2.3);
sun.position.set(-7, 13, 8); sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024); scene.add(sun);

const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const groundMat=mat(0x52604b), stoneMat=mat(0x59616a), darkMat=mat(0x171923), clothMat=mat(0x252a36), orangeMat=mat(0xc94d1c), skinMat=mat(0xb97855), metalMat=mat(0x9ca7b2,.35,.65), eyeMat=mat(0xe32624,.3);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),groundMat); ground.rotation.x=-Math.PI/2; ground.position.y=-.06; ground.receiveShadow=true; scene.add(ground);
const arena=new THREE.Mesh(new THREE.CylinderGeometry(9,10,.35,12),stoneMat); arena.position.y=.1; arena.receiveShadow=true; arena.castShadow=true; scene.add(arena);
const ring=new THREE.Mesh(new THREE.TorusGeometry(8.2,.08,8,64),mat(0xc18b52)); ring.rotation.x=Math.PI/2; ring.position.y=.29; scene.add(ring);
function rock(x,z,s=1){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),stoneMat);m.position.set(x,s*.45,z);m.scale.y=.7;m.castShadow=true;m.receiveShadow=true;scene.add(m)}
for(let i=0;i<18;i++){const a=i/18*Math.PI*2;rock(Math.cos(a)*11,Math.sin(a)*11,.7+Math.random()*.9)}
function tree(x,z,h){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.25,h*.42,6),mat(0x49362b));trunk.position.set(x,h*.21,z);trunk.castShadow=true;scene.add(trunk);for(let j=0;j<3;j++){const crown=new THREE.Mesh(new THREE.ConeGeometry(h*(.24-j*.035),h*.42,7),mat(j===0?0x253f35:0x304d3b));crown.position.set(x,h*.48+j*h*.19,z);crown.castShadow=true;scene.add(crown)}}
for(let i=0;i<22;i++){const a=i/22*Math.PI*2;tree(Math.cos(a)*15,Math.sin(a)*15,4+Math.random()*3)}

function makeNinja(isPlayer=true){
 const g=new THREE.Group();
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.43,.78,4,8),clothMat);torso.position.y=1.25;torso.castShadow=true;g.add(torso);
 const belt=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.13,10),orangeMat);belt.position.y=.93;g.add(belt);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.37,12,10),skinMat);head.position.y=2.12;head.castShadow=true;g.add(head);
 const mask=new THREE.Mesh(new THREE.SphereGeometry(.385,16,12,0,Math.PI*2,0,Math.PI*.72),orangeMat);mask.position.set(0,2.13,.05);mask.scale.set(1,1,.92);g.add(mask);
 const face=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.08),darkMat);face.position.set(0,2.09,.37);g.add(face);
 const eye1=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),eyeMat),eye2=eye1.clone();eye1.position.set(-.105,2.1,.42);eye2.position.set(.105,2.1,.42);g.add(eye1,eye2);
 const spiral=new THREE.Mesh(new THREE.TorusGeometry(.105,.025,6,24),mat(0x44231c));spiral.position.set(0,2.16,.405);g.add(spiral);
 const limbs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.55,3,7),clothMat);arm.position.set(side*.57,1.35,0);arm.rotation.z=side*-.22;arm.castShadow=true;g.add(arm);limbs.push(arm);
  const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.55,3,7),darkMat);leg.position.set(side*.23,.48,0);leg.castShadow=true;g.add(leg);limbs.push(leg);
  const glove=new THREE.Mesh(new THREE.SphereGeometry(.17,8,8),orangeMat);glove.position.set(side*.6,1.03,0);g.add(glove);
 }
 const scarf=new THREE.Mesh(new THREE.BoxGeometry(.12,.72,.16),orangeMat);scarf.position.set(-.25,1.45,-.48);scarf.rotation.z=-.45;g.add(scarf);
 g.userData={limbs,isPlayer,baseY:0,attack:0,hitFlash:0};
 return g;
}
const player=makeNinja(true);player.position.set(-2,0,1.5);scene.add(player);
const enemy=makeNinja(false);enemy.position.set(2,0,-1.4);enemy.rotation.y=Math.PI;scene.add(enemy);
const fighters=[player,enemy];
let hp=100, enemyHp=100, chakra=100, block=false, moveX=0,moveY=0,attackCooldown=0,skillCooldown=0,gameOver=false;
const keys={};
const $=id=>document.getElementById(id);
function hud(){ $("player-health").style.width=hp+"%";$("enemy-health").style.width=enemyHp+"%";$("health-label").textContent="HP "+Math.ceil(hp);$("chakra-label").textContent="CHAKRA "+Math.ceil(chakra)}
function say(t){$("message").textContent=t}
function hit(target,amount){if(target===enemy){enemyHp=Math.max(0,enemyHp-amount);enemy.userData.hitFlash=.18;if(enemyHp<=0){gameOver=true;say("VICTORY! TAP ATTACK TO RESET")}}else{hp=Math.max(0,hp-amount);player.userData.hitFlash=.18;if(hp<=0){gameOver=true;say("DEFEATED · TAP ATTACK TO RETRY")}}hud()}
function reset(){hp=100;enemyHp=100;chakra=100;gameOver=false;player.position.set(-2,0,1.5);enemy.position.set(2,0,-1.4);hud();say("FIGHT!")}
function attack(){if(gameOver){reset();return}if(attackCooldown>0)return;attackCooldown=.55;player.userData.attack=.25;const d=player.position.distanceTo(enemy.position);if(d<2.45){hit(enemy,10+Math.random()*5);say("HIT!")}else say("TOO FAR!")}
function skill(type){if(gameOver||skillCooldown>0)return;if(chakra<25){say("NOT ENOUGH CHAKRA");return}chakra-=25;skillCooldown=1.5;hud();if(type==="kamui"){say("KAMUI!");const dir=new THREE.Vector3(0,0,-1).applyQuaternion(player.quaternion);player.position.addScaledVector(dir,2.2);if(player.position.distanceTo(enemy.position)<3.5)hit(enemy,25)}else{say("FIRE STYLE!");if(player.position.distanceTo(enemy.position)<5)hit(enemy,22);const fire=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),new THREE.MeshBasicMaterial({color:0xff6b16}));fire.position.copy(player.position).add(new THREE.Vector3(0,1,-1.3).applyQuaternion(player.quaternion));scene.add(fire);setTimeout(()=>scene.remove(fire),350)}}
function doAction(a){if(a==="attack")attack();if(a==="kamui")skill("kamui");if(a==="fire")skill("fire");if(a==="jump"&&!gameOver)player.userData.jump=7;if(a==="block")block=true}
document.querySelectorAll("[data-action]").forEach(b=>{const a=b.dataset.action;b.addEventListener("pointerdown",e=>{e.preventDefault();doAction(a)});if(a==="block"){b.addEventListener("pointerup",()=>block=false);b.addEventListener("pointerleave",()=>block=false);b.addEventListener("pointercancel",()=>block=false)}});
window.addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key===" "){e.preventDefault();attack()}if(e.key.toLowerCase()==="q")skill("kamui");if(e.key.toLowerCase()==="e")skill("fire")});
window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

const joy=$("joystick"),stick=$("stick");let joyId=null,joyRect=null;
joy.addEventListener("pointerdown",e=>{joyId=e.pointerId;joyRect=joy.getBoundingClientRect();joy.setPointerCapture(joyId);moveJoy(e)});
joy.addEventListener("pointermove",e=>{if(e.pointerId===joyId)moveJoy(e)});
function moveJoy(e){const cx=joyRect.left+joyRect.width/2,cy=joyRect.top+joyRect.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=35,len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max}stick.style.transform=`translate(${dx}px,${dy}px)`;moveX=dx/max;moveY=dy/max}
function releaseJoy(){joyId=null;moveX=moveY=0;stick.style.transform="translate(0,0)"}
joy.addEventListener("pointerup",releaseJoy);joy.addEventListener("pointercancel",releaseJoy);

const clock=new THREE.Clock();
function update(dt){
 if(gameOver)return;
 attackCooldown=Math.max(0,attackCooldown-dt);skillCooldown=Math.max(0,skillCooldown-dt);chakra=Math.min(100,chakra+dt*3.5);
 const ix=moveX+(keys.d?1:0)-(keys.a?1:0),iz=moveY+(keys.s?1:0)-(keys.w?1:0);
 const forward=new THREE.Vector3(ix,0,iz);if(forward.length()>1)forward.normalize();
 player.position.x+=forward.x*dt*4;player.position.z+=forward.z*4;
 player.position.x=THREE.MathUtils.clamp(player.position.x,-7,7);player.position.z=THREE.MathUtils.clamp(player.position.z,-7,7);
 if(forward.lengthSq()>.01){player.rotation.y=Math.atan2(forward.x,forward.z)+Math.PI}
 if(player.userData.jump){player.position.y+=player.userData.jump*dt;player.userData.jump-=18*dt;if(player.position.y<0){player.position.y=0;player.userData.jump=0}}
 const toPlayer=player.position.clone().sub(enemy.position);const dist=toPlayer.length();
 if(dist>1.45){toPlayer.normalize();enemy.position.addScaledVector(toPlayer,dt*1.35);enemy.rotation.y=Math.atan2(-toPlayer.x,-toPlayer.z)+Math.PI}
 else if(Math.random()<dt*.65){if(block){say("BLOCKED!")}else{hit(player,4);say("ENEMY STRIKE")}}
 if(player.userData.attack>0){player.userData.attack-=dt;player.userData.limbs[0].rotation.x=-.9}
 else player.userData.limbs[0].rotation.x=0;
 if(enemy.userData.hitFlash>0){enemy.userData.hitFlash-=dt;enemy.scale.setScalar(1.04)}else enemy.scale.setScalar(1);
 if(player.userData.hitFlash>0){player.userData.hitFlash-=dt;player.scale.setScalar(1.03)}else player.scale.setScalar(1);
 camera.position.lerp(new THREE.Vector3(player.position.x,5.3,player.position.z+8.5),1-Math.pow(.001,dt));
 camera.lookAt(player.position.x,1,player.position.z-.6);
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);update(dt);renderer.render(scene,camera)}
animate();hud();$("loading").style.display="none";
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6))});
