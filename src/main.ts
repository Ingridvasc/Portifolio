// @ts-nocheck
// The Portfolio Quest 3D: the whole game lives in this file.
// Type checking is switched off here on purpose (the code was written fast, in plain style).
// To tighten it later, remove the line above and fix the errors one by one.
import * as THREE from 'three';
import './style.css';

(function(){
var cv=document.getElementById('c');
var VW=320,VH=180,T=16,MW=40,MH=26,WW=MW*T,WH=MH*T,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var seed=11;function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}

/* ---------- world ---------- */
var sol=new Uint8Array(MW*MH),kind=new Uint8Array(MW*MH); // kind: 0 grass 1 path 2 water
function ix(x,y){return y*MW+x}
for(var y=0;y<MH;y++)for(var x=0;x<MW;x++){
  if((x===19||x===20)&&y>=4&&y<=22)kind[ix(x,y)]=1;
  if((y===15||y===16)&&x>=8&&x<=31)kind[ix(x,y)]=1;
  if(Math.pow((x-12)/3,2)+Math.pow((y-11)/2,2)<1){kind[ix(x,y)]=2;sol[ix(x,y)]=1}
  if(Math.pow((x-12)/3.5,2)+Math.pow((y-11)/2.5,2)<1)sol[ix(x,y)]=1;
  if(x>=18&&x<=22&&y<=3)sol[ix(x,y)]=1;
}
var RL=[
 {id:'eng',kind:'gem',n:'ENGINEERING GEM',tx:16,ty:12,c:'#ffa23a'},
 {id:'lit',kind:'book',n:'THE LIBRARIAN’S BOOK',tx:32,ty:6,c:'#7dffa8'},
 {id:'cosmos',kind:'portal',n:'COSMOS PORTAL',tx:8,ty:6,c:'#b48cff'}
];
RL.forEach(function(r){r.x=r.tx*T+8;r.y=r.ty*T+8;r.armed=true});
var BR={armed:true,met:0},SPR={x:200,y:164,armed:true,met:0},LIB={x:496,y:101,armed:true,met:0},DOOR={x:328,y:74,armed:true},START={x:20*T+8,y:22*T};
var PS=[[23,4]];
PS.forEach(function(q){sol[ix(q[0],q[1])]=1});
var keep=RL.map(function(r){return [r.tx,r.ty]}).concat([[20,4],[20,22],[22,4],[23,4],[9,11],[15,11],[16,11],[16,13],[12,11],[15,10],[15,12],[20,6],[30,6],[31,6],[8,7],[9,6],[24,9],[26,9]]);
var trees=[];
for(var y=0;y<MH;y++)for(var x=0;x<MW;x++){
  var i=ix(x,y);if(sol[i]||kind[i])continue;
  var edge=x<2||y<2||x>=MW-2||y>=MH-2,near=keep.some(function(k){return Math.abs(k[0]-x)<3&&Math.abs(k[1]-y)<3});
  if(near)continue;
  if((edge&&rnd()<.85)||(!edge&&rnd()<.07)){sol[i]=1;trees.push({x:x*T+8,y:y*T+15})}
}
function solidAt(x,y){if(bridgeOK&&x>=144&&x<=256&&y>=170&&y<=198)return false;var tx=Math.floor(x/T),ty=Math.floor(y/T);return tx<0||ty<0||tx>=MW||ty>=MH||sol[ty*MW+tx]===1}
function blocked(x,y){return solidAt(x-4,y)||solidAt(x+4,y)||solidAt(x-4,y-4)||solidAt(x+4,y-4)}

var ground=document.createElement('canvas');ground.width=WW;ground.height=WH;
(function(){var g=ground.getContext('2d');function r(x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h)}
  var gc=['#3f7d3a','#3a7436','#448540'];
  for(var y=0;y<MH;y++)for(var x=0;x<MW;x++){var k=kind[ix(x,y)],px=x*T,py=y*T;
    if(k===0){r(px,py,T,T,gc[Math.floor(rnd()*3)]);
      for(var n=0;n<3;n++)r(px+Math.floor(rnd()*14),py+Math.floor(rnd()*13),1,2,'#2f6a2f');
      if(rnd()<.12)r(px+Math.floor(rnd()*13),py+Math.floor(rnd()*13),2,2,rnd()<.5?'#f2e96b':'#f28bb0');}
    else if(k===1){r(px,py,T,T,'#c9a96b');for(var n=0;n<4;n++)r(px+Math.floor(rnd()*14),py+Math.floor(rnd()*14),2,1,'#b8955a')}
    else{r(px,py,T,T,'#2f6fb3');r(px+2+Math.floor(rnd()*6),py+4+Math.floor(rnd()*6),5,1,'#5aa0e0')}
  }})();

/* ---------- entities ---------- */
var P={x:START.x,y:START.y,dir:'down',moving:false,step:0,cd:0,slash:0,dest:null};
var bugs=[],parts=[],floats=[],flies=[],xp=0,killed=0,found={},st='title',keys={},cam={x:0,y:0};
for(var b=0;b<6;b++){var bx,by;do{bx=(3+rnd()*34)*T;by=(4+rnd()*20)*T}while(blocked(bx,by)||Math.hypot(bx-START.x,by-START.y)<70);
  bugs.push({x:bx,y:by,hp:2,a:rnd()*6.28,t:rnd()*2,fl:0})}
for(var f=0;f<26;f++)flies.push({x:rnd()*WW,y:rnd()*WH,a:rnd()*6.28,s:6+rnd()*8});

/* ---------- dialogs ---------- */
var A='<a class="btn" href="';
var D={
about:['ENGINEERING RESTORED: WHERE I BEGAN','<p>I’m a full-stack developer studying Civil Engineering at UFPE, with a specialization in Data Science and a special focus on cybersecurity.</p><p>I build complete systems, from secure APIs to the interfaces people use.</p>'],
skills:['PHYSICS RESTORED: MY SKILL TREE','<div class="row"><b>Languages</b><span>Python, TypeScript, JavaScript, Java, R, PHP, Ruby, Rust, C#, C++</span></div><div class="row"><b>Front-end</b><span>React, Next.js, Flutter, Material-UI</span></div><div class="row"><b>Back-end</b><span>Node.js, Express, Django, FastAPI, Rails, Laravel, Kafka</span></div><div class="row"><b>Data</b><span>PostgreSQL, MySQL, MongoDB, Redis, ETL, advanced SQL</span></div><div class="row"><b>Security</b><span>OWASP Top 10, JWT/OAuth2, AES/RSA, API hardening</span></div><div class="row"><b>DevOps</b><span>Docker, Kubernetes, AWS, CI/CD, GitHub Actions</span></div>'],
exp: [
  'LITERATURE RESTORED: MY STORY SO FAR',
  [
    '<div class="q"><small>Aug–Dec 2024</small><br>Backend Specialist Developer · MixWare. REST APIs with Django/FastAPI and PostgreSQL, encryption, JWT and automated CI/CD.</div>',
    '<div class="q"><small>Feb–Sep 2024</small><br>FullStack Developer · CollegePur. React, Node.js, MongoDB, Flutter. Query performance up 300% with a composite index, plus role-based access control.</div>',
    '<div class="q"><small>Apr–Jun 2024</small><br>Data Analyst · SpareProvider.com. ETL with Airflow, Power BI dashboard, predictive models with Scikit-learn.</div>',
    '<div class="q"><small>Nov 2024–Feb 2025</small><br>Prompt Engineering Research Intern · Rochester Institute of Technology. Applied research on generative AI.</div>',
    '<div class="q"><small>Mar–May 2025</small><br>Data Analyst · Saint Louis University. Data visualization, visual perception principles, and actionable insights from complex data.</div>',
    '<div class="q"><small>Jan–Apr 2025</small><br>Researcher · INCBAC (UNIGOU Remote). 2D Monte Carlo Simulation of Vortex Points with Scalable Background Noise.</div>',
    '<div class="q"><small>Dec 2024–Mar 2025</small><br>Business Development Intern · Grant Thornton China. Outreach consulting, stakeholder mapping, and client retention strategies.</div>',
    '<div class="q"><small>2015–present</small><br>Freelance full-stack developer. Web apps, microservices, third-party and payment integrations.</div>'
  ].join('')
],
proj: [
  [
  'ASTRONOMY RESTORED: MY PROJECTS',
  '<div class="q"><small>R</small> Pettitt test analysis: 43 years of rainfall (1980–2023) in the Agreste of Pernambuco, Brazil, and the shifts the test found. <a href="https://github.com/Ingridvasc/Test-of-Pettitt" style="color:#7dffa8">code</a></div>',
  '<div class="q"><small>BACKEND</small> Order Management System: Backend system for laboratory order management. <a href="https://github.com/Ingridvasc/order-management-system" style="color:#7dffa8">code</a></div>',
  '<div class="q"><small>FRONTEND</small> WeatherWise - Intelligent Weather Companion: A visually stunning weather experience blending hyperlocal forecasts with personal weather memories. <a href="https://github.com/Ingridvasc/WeatherWise-App" style="color:#7dffa8">code</a></div>',
  '<div class="q"><small>SECURITY</small> Sistema de Detecção de Risco de Evasão com Fairness. <a href="https://github.com/Ingridvasc/Sistema-de-Deteccao-de-Risco-de-Evasao-com-Fairness" style="color:#7dffa8">code</a></div>',
  '<div class="q"><small>DEVOPS</small> Financial Market Analysis with Machine Learning: Advanced ML techniques to analyze historical data and generate buy/sell signals. <a href="https://github.com/Ingridvasc/Financial-market-analysis-with-machine-learning" style="color:#7dffa8">code</a></div>',
  '<div class="q"><small>QUANTUM</small> Quantum Option Pricing using Quantum Random Walk: Implementing a quantum random walk approach for financial option pricing using the Black-Scholes model. <a href="https://github.com/Ingridvasc/Qiskit-Fall-Fest-Quandela-1" style="color:#7dffa8">code</a></div>'
  ].join('')
],
spiritBridge:['THE POND SPIRIT: ON THE BRIDGE','<p>You mended it. I felt every plank come home.</p><p>Few builders remember what truly holds a bridge: not the beams, but the trust that someone will cross. That is why Ingrid builds: to be crossed.</p><p>Take my thanks, and remember this when the Thinker asks you what a bridge connects.</p>'],spirit:['THE POND SPIRIT','<p>Ah... footsteps. I have watched this valley since the first bridge was laid.</p><p>Five sciences held it together: engineering, physics, astronomy, literature and philosophy. Then the bugs came, and everything went quiet.</p><p>Only a Builder who loves exact sciences can wake them: Ingrid. Light three gems: the broken bridge on the east shore of my pond, the library in the north-east, and the portal in the north-west that leads to the Cosmos. Then the Thinker will open the door of the Guild Hall.</p>'],librarian:['THE LIBRARIAN','<p>Shh... the words in this room are alive.</p><p>Every sentence here once told Ingrid’s story, until the bugs scrambled them. Touch the floating book and put the words back in order.</p>'],hint:['',''],intro:['THE FIVE SILENCES','<p>Once, five sciences held this world together: engineering, physics, astronomy, literature and philosophy. Then a swarm of bugs crept in, and the machines fell silent.</p><p>Guide Ingrid, the Builder, who loves exact sciences, to each glowing pillar and play its challenge. Every realm you restore tells a part of her story. The Thinker waits at the end.</p>'],locked:['THE THINKER IS SILENT','<p>The Thinker will only speak when the three gems shine: the bridge, the library and the Cosmos portal. Ask the pond spirit if you are lost.</p>'],
contact:['PHILOSOPHY RESTORED: KNOW THYSELF','<p>Quest complete: you found Ingrid. She’s open to opportunities roles.</p><div class="acts">'+A+'mailto:ingridvasconcelos.dev@gmail.com">PRESS START: EMAIL</a>'+A+'https://github.com/Ingridvasc" class="btn alt">GITHUB</a>'+A+'https://www.linkedin.com/in/ingrid-vasconcelos-18635a230/" class="btn alt">LINKEDIN</a></div>']
};
var dlg=document.getElementById('dlg');
function open(id){
  var d=D[id];st='dialog';P.dest=null;
  dlg.innerHTML='<h2>'+d[0]+'</h2>'+d[1]+'<div class="acts"><button class="btn alt" id="dc">CONTINUE ▶</button></div>';
  dlg.hidden=false;document.getElementById('dc').onclick=close;document.getElementById('dc').focus();
}
function close(){dlg.hidden=true;st=inCosmos?'cosmos':'play';if(exitAfter){exitAfter=0;exitCosmos()}}
function gain(n){xp+=n;hud()}
function count(){return Object.keys(found).length}
function hud(){document.getElementById('lv').textContent=1+Math.floor(xp/4);document.getElementById('xp').style.width=(xp%4)*25+'%';
  document.getElementById('qs').innerHTML='GEMS '+['eng','lit','cosmos'].filter(function(k){return found[k]}).length+'/3<br>BUGS '+killed+(killed<6?'/6':' ★')}
function touch(id){found[id]=1;gain(3);open(id)}

var W=1/8;
var renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;
var scene=new THREE.Scene();scene.background=new THREE.Color(0x0b0d2a);scene.fog=new THREE.FogExp2(0x131842,.016);
var camera=new THREE.PerspectiveCamera(48,1,.1,400);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
scene.add(new THREE.HemisphereLight(0x93a4ff,0x1f3a24,.85));
var moonL=new THREE.DirectionalLight(0xc3ceff,.95);moonL.castShadow=true;moonL.shadow.mapSize.set(1024,1024);
var sc=moonL.shadow.camera;sc.left=-34;sc.right=34;sc.top=34;sc.bottom=-34;sc.near=1;sc.far=120;scene.add(moonL,moonL.target);

/* ground (the 2D tile map becomes a pixel-art texture), pond, trees */
var gt=new THREE.CanvasTexture(ground);gt.magFilter=THREE.NearestFilter;gt.minFilter=THREE.LinearFilter;gt.generateMipmaps=false;
var gm=new THREE.Mesh(new THREE.PlaneGeometry(WW*W,WH*W),new THREE.MeshLambertMaterial({map:gt}));
gm.rotation.x=-Math.PI/2;gm.position.set(WW*W/2,0,WH*W/2);gm.receiveShadow=true;scene.add(gm);
var pond=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshStandardMaterial({color:0x1d5fa8,emissive:0x1d5fa8,emissiveIntensity:.5,roughness:.2,transparent:true,opacity:.92}));
pond.rotation.x=-Math.PI/2;pond.scale.set(6.2,4.2,1);pond.position.set(25,.06,23);scene.add(pond);
var dm=new THREE.Object3D(),NT=trees.length;
var trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.35,1.6,6),new THREE.MeshLambertMaterial({color:0x5b3a1e}),NT);
var c1=new THREE.InstancedMesh(new THREE.ConeGeometry(1.5,3,7),new THREE.MeshLambertMaterial({color:0xffffff}),NT);
var c2=new THREE.InstancedMesh(new THREE.ConeGeometry(1.1,2.4,7),new THREE.MeshLambertMaterial({color:0xffffff}),NT);
trees.forEach(function(t,i){var s=.9+rnd()*.7,x=t.x*W,z=(t.y-8)*W,col=new THREE.Color().setHSL(.33+rnd()*.04,.5,.2+rnd()*.07);
  [[trunk,.8],[c1,2.9],[c2,4.4]].forEach(function(m){dm.position.set(x,m[1]*s,z);dm.scale.setScalar(s);dm.rotation.y=rnd()*6;dm.updateMatrix();m[0].setMatrixAt(i,dm.matrix)});
  c1.setColorAt(i,col);c2.setColorAt(i,col.clone().offsetHSL(0,0,.04))});
[trunk,c1,c2].forEach(function(m){m.castShadow=true;scene.add(m)});

/* sky: stars and moon follow the player */
var sky=new THREE.Group(),sp=new Float32Array(900*3);
for(var q=0;q<900;q++){var d=new THREE.Vector3(Math.random()-.5,Math.random()*.7+.1,Math.random()-.5).normalize().multiplyScalar(170);sp[q*3]=d.x;sp[q*3+1]=d.y;sp[q*3+2]=d.z}
var sgm=new THREE.BufferGeometry();sgm.setAttribute('position',new THREE.BufferAttribute(sp,3));
sky.add(new THREE.Points(sgm,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,color:0xcfd6ff,fog:false})));
var moon=new THREE.Mesh(new THREE.SphereGeometry(7,24,24),new THREE.MeshBasicMaterial({color:0xf4f1d6,fog:false}));moon.position.set(40,70,-120);sky.add(moon);scene.add(sky);

/* Ingrid: voxel character (light skin, straight dark-brown hair) */
var SK=0xf3d9c9,HR=0x3b2417,TP=0x25306a,PT=0x15161c;
var av=new THREE.Group(),bd=new THREE.Group();av.add(bd);av.scale.setScalar(.55);scene.add(av);
function box(w,h,d,c,x,y,z,p){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c}));m.position.set(x,y,z);m.castShadow=true;p.add(m);return m}
function pivot(x,y,z,p){var g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g}
var legL=pivot(-.3,1.7,0,bd),legR=pivot(.3,1.7,0,bd);
[legL,legR].forEach(function(l){box(.5,1.5,.5,PT,0,-.75,0,l);box(.62,.78,.66,0x0e0e12,0,-1.11,.03,l);box(.66,.12,.7,0xffffff,0,-.74,.03,l);box(.66,.12,.9,0xffffff,0,-1.52,.12,l);box(.42,.22,.12,0xffffff,0,-1.32,.4,l);box(.06,.5,.04,0xffffff,0,-1.0,.36,l)});
box(1.3,1.5,.7,0xf4f2ff,0,2.45,0,bd);
box(.2,1.5,.78,TP,-.55,2.45,0,bd);box(.2,1.5,.78,TP,.55,2.45,0,bd);box(1.34,1.5,.1,TP,0,2.45,-.4,bd);box(1.42,.2,.8,TP,0,3.25,0,bd);
box(1.36,.2,.8,0x3a2414,0,1.85,0,bd);box(.24,.2,.04,0xffd36b,0,1.85,.41,bd);
var shT=tex(128,112,function(x){x.fillStyle='#f4f2ff';x.fillRect(0,0,128,112);x.fillStyle='#25306a';x.textAlign='center';x.font='bold 34px Arial';x.fillText('I LOVE',64,40);x.font='bold 25px Arial';x.fillText('SCIENCE',64,76);x.fillStyle='#ff7a3a';x.fillRect(16,84,96,4);x.fillStyle='#25306a';x.font='bold 14px Arial';x.fillText('E = mc²',64,104)},true);
var shirt=new THREE.Mesh(new THREE.PlaneGeometry(.9,.8),new THREE.MeshLambertMaterial({map:shT}));shirt.position.set(0,2.55,.362);bd.add(shirt);
var shB=tex(128,112,function(x){x.fillStyle='#25306a';x.fillRect(0,0,128,112);x.fillStyle='#ffffff';x.textAlign='center';x.font='bold 34px Arial';x.fillText('I LOVE',64,44);x.font='bold 25px Arial';x.fillText('SCIENCE',64,82);x.fillStyle='#ff7a3a';x.fillRect(16,92,96,4)},true);
var shirtB=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.96),new THREE.MeshLambertMaterial({map:shB}));shirtB.position.set(0,2.5,-.455);shirtB.rotation.y=Math.PI;bd.add(shirtB);
var armL=pivot(-.85,3.1,0,bd),armR=pivot(.85,3.1,0,bd);
[armL,armR].forEach(function(a){box(.4,.8,.4,TP,0,-.4,0,a);box(.36,.6,.36,SK,0,-1.1,0,a)});
box(1.1,1.1,1.1,SK,0,3.75,0,bd);box(.14,.2,.06,0x1a1a1a,-.27,3.8,.56,bd);box(.14,.2,.06,0x1a1a1a,.27,3.8,.56,bd);box(.3,.07,.06,0xd9777f,0,3.4,.56,bd);
var hairP=pivot(0,4.3,-.6,bd);box(1.3,1.3,.35,HR,0,-.55,0,hairP);
box(1.25,.3,1.25,HR,0,4.4,0,bd);box(.18,1.2,.9,HR,-.62,3.65,-.1,bd);box(.18,1.2,.9,HR,.62,3.65,-.1,bd);box(1.15,.3,.2,HR,0,4.12,.6,bd);
var swd=new THREE.Group();swd.position.set(0,-1.15,.05);swd.rotation.x=Math.PI/2.3;armR.add(swd);
box(.12,.5,.12,0x6b4a2e,0,0,0,swd);box(.55,.1,.18,0xffd36b,0,.3,0,swd);box(.15,1.9,.06,0xdfeaff,0,1.3,0,swd).material.emissive.setHex(0x3a5a88);box(.2,.2,.2,0xffd36b,0,-.3,0,swd);
var bowG=new THREE.Group();bd.add(bowG);bowG.position.set(0,2.7,-.5);bowG.rotation.y=Math.PI/2;
var bowM=new THREE.Mesh(new THREE.TorusGeometry(1.1,.06,6,16,Math.PI),new THREE.MeshLambertMaterial({color:0x8a5a2b}));bowM.rotation.z=-Math.PI/2;bowM.castShadow=true;bowG.add(bowM);
box(.02,2.2,.02,0xf5e6b8,0,0,0,bowG);
var quiver=box(.36,1.2,.36,0x5b3a1e,.3,3.0,-.5,bd);quiver.rotation.z=.25;box(.08,.4,.08,0xe8d9a8,.45,3.8,-.5,bd);box(.08,.4,.08,0xff6b6b,.3,3.85,-.5,bd);
var slashFx=new THREE.Mesh(new THREE.RingGeometry(.9,1.9,20,1,-1.1,2.2),new THREE.MeshBasicMaterial({color:0xffe28a,transparent:true,opacity:0,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
slashFx.rotation.x=-Math.PI/2;scene.add(slashFx);

/* ---------- the valley: bridge, spirit, library nook, portal, Guild Hall ---------- */
var props=new THREE.Group(),anim=[],gdt=.016,hallOpen=false,bridgeT=-1;scene.add(props);
function tex(w,h,draw,pix){var c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));var t=new THREE.CanvasTexture(c);if(pix)t.magFilter=THREE.NearestFilter;return t}
function M(p,geo,col,x,y,z,em){var m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col,roughness:.65,emissive:em||0x000000}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function BX(w,h,d){return new THREE.BoxGeometry(w,h,d)}function CY(a,b,hh,s){return new THREE.CylinderGeometry(a,b,hh,s||12)}function SP(r){return new THREE.SphereGeometry(r,16,12)}
function G(x,z){var g=new THREE.Group();g.position.set(x,0,z);props.add(g);return g}
function mkEx(ch,col){var s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex(32,32,function(x){x.fillStyle=col;x.font='bold 30px Arial';x.textAlign='center';x.fillText(ch,16,28)}),depthTest:false}));s.scale.set(.9,.9,1);s.position.set(0,1.9,0);s.visible=false;return s}
function glowMat(c,o){return new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})}

/* the broken bridge over the pond: the engineering gem repairs it, and then you can walk across it */
var brg=G(25,23),secs=[],bridgeOK=false,stubs=new THREE.Group();brg.add(stubs);
M(stubs,BX(.9,.1,.5),0x9a6a38,-5.4,.95,.2).rotation.z=.25;M(stubs,BX(.8,.1,.5),0x9a6a38,5.3,.8,-.3).rotation.z=-.5;M(stubs,BX(.14,.8,.14),0x5b3a1e,-5.6,1.3,1.5);M(stubs,BX(.14,.6,.14),0x5b3a1e,5.7,1.2,-1.5);
var rampL=M(brg,BX(2.1,.14,3.6),0x9a6a38,-5.95,.48,0),rampR=M(brg,BX(2.1,.14,3.6),0x9a6a38,5.95,.48,0);
rampL.rotation.z=.447;rampR.rotation.z=-.447;rampL.visible=false;rampR.visible=false;
for(var bi=0;bi<5;bi++){var sg=new THREE.Group();sg.position.set(-4+bi*2,.9,0);sg.visible=false;brg.add(sg);
  [-1.4,-.7,0,.7,1.4].forEach(function(z){M(sg,BX(1.9,.12,.62),0x9a6a38,0,0,z)});
  [-1,1].forEach(function(z){M(sg,BX(.14,.9,.14),0x5b3a1e,-.9,.5,z*1.75);M(sg,BX(2,.1,.1),0x5b3a1e,0,.95,z*1.75);M(sg,BX(2,.08,.08),0x5b3a1e,0,.5,z*1.75);M(sg,BX(1.9,.12,.14),0x5b3a1e,0,-.1,z*1.5)});
  secs.push(sg)}
function repairBridge(){bridgeT=0;bridgeOK=true;stubs.visible=false;sfx.door()}
function bridgeH(x,y){if(!bridgeOK||y<168||y>200||x<144||x>256)return 0;if(x<160)return .96*(x-144)/16;if(x>240)return .96*(256-x)/16;return .96}
anim.push(function(t){if(bridgeT>=0){bridgeT+=gdt;var on=bridgeT>.15;rampL.visible=on;rampR.visible=on;secs.forEach(function(s,i){var k=Math.min(1,Math.max(0,(bridgeT-i*.35)/.5));s.visible=k>0;s.scale.y=Math.max(.001,k);s.position.y=.9+(1-k)*3})}});

/* the pond spirit */
var spG=G(25,20.5),spM=new THREE.MeshBasicMaterial({color:0xbfe9ff,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false});
var spB=new THREE.Mesh(SP(.9),spM);spB.scale.y=1.25;spG.add(spB);
var spT=new THREE.Mesh(new THREE.ConeGeometry(.75,2,10),spM);spT.rotation.x=Math.PI;spT.position.y=-1.5;spG.add(spT);
[-.28,.28].forEach(function(x){var e=new THREE.Mesh(BX(.16,.3,.1),new THREE.MeshBasicMaterial({color:0x0b1830}));e.position.set(x,.2,.8);spG.add(e)});
var spL=new THREE.PointLight(0x9ad8ff,1.8,14,2);spG.add(spL);
var rip=[0,1].map(function(i){var r=new THREE.Mesh(new THREE.RingGeometry(.9,1.05,40),glowMat(0x9ad8ff,.5));r.rotation.x=-Math.PI/2;r.position.set(25,.12,20.5);props.add(r);return r});
anim.push(function(t){spG.position.y=2.7+Math.sin(t*1.6)*.35;spG.rotation.y=Math.atan2(camera.position.x-25,camera.position.z-20.5);
  rip.forEach(function(r,i){var k=((t*.5+i*.5)%1);r.scale.setScalar(1+k*3.2);r.material.opacity=.5*(1-k)})});

/* the library nook: a mystic librarian, orbiting books, runes */
var lbn=G(62,12.6);lbn.rotation.y=1.3;
M(lbn,new THREE.ConeGeometry(.9,2.5,10),0x2a2670,0,1.25,0);M(lbn,SP(.48),0x2a2670,0,2.7,0);M(lbn,SP(.3),0x0c0b1e,0,2.66,.25);
[-.13,.13].forEach(function(x){M(lbn,BX(.1,.06,.05),0x7dffa8,x,2.7,.5,0x7dffa8)});
M(lbn,CY(.05,.05,3.2,6),0x6b4a2e,1,1.6,.2);M(lbn,SP(.2),0x7dffa8,1,3.3,.2,0x7dffa8);
var lbL=new THREE.PointLight(0x7dffa8,1.6,12,2);lbL.position.set(1,3.3,.2);lbn.add(lbL);
var obk=[];for(var q=0;q<6;q++){obk.push(M(props,BX(.45,.09,.33),new THREE.Color().setHSL(.3+q*.1,.5,.5).getHex(),0,0,0))}
var runes=[[3.6,3.9],[2.1,2.3]].map(function(r){var m=new THREE.Mesh(new THREE.RingGeometry(r[0],r[1],48),glowMat(0x7dffa8,.45));m.rotation.x=-Math.PI/2;m.position.set(65,.08,13);props.add(m);return m});
anim.push(function(t){obk.forEach(function(b,i){var a=t*.7+i*1.047;b.position.set(62+Math.cos(a)*1.9,2.3+Math.sin(t*1.3+i)*.25,12.6+Math.sin(a)*1.9);b.rotation.set(t+i,t*.8,.3)});
  runes[0].rotation.z=t*.15;runes[1].rotation.z=-t*.25});

/* the Guild Hall: timber-framed house with a gable roof, chimney, lanterns and a working door */
var hall=G(41,4);
function HB(p,w,h,d,c,x,y,z,em){return M(p,BX(w,h,d),c,x,y,z,em)}
HB(hall,10.6,.8,8.6,0x7d7f88,0,.4,0);HB(hall,10,4.4,8,0xe6d6b0,0,3,0);
[-5,5].forEach(function(x){[-4,4].forEach(function(z){HB(hall,.4,4.6,.4,0x4a3320,x,3,z)})});
[.9,2.9,5.1].forEach(function(y){HB(hall,10.1,.25,.25,0x4a3320,0,y,4.02);HB(hall,10.1,.25,.25,0x4a3320,0,y,-4.02);[-5.02,5.02].forEach(function(x){HB(hall,.25,.25,8.1,0x4a3320,x,y,0)})});
[-2.6,2.6].forEach(function(x){HB(hall,.22,4.2,.22,0x4a3320,x,3,4.05)});
[-1,1].forEach(function(s){var r=HB(hall,6.9,.3,9.4,0x9b3a2e,s*2.8,6.72,0);r.rotation.z=-s*Math.PI/6;
  for(var t=-2.8;t<=2.9;t+=1.4){var q2=HB(hall,.14,.1,9.2,0x7a2c22,s*2.8-s*t*.866,6.72+t*.5+.2,0);q2.rotation.z=-s*Math.PI/6}
  HB(hall,.25,.25,9.6,0x4a3320,s*5.55,4.95,0)});
HB(hall,.5,.3,9.6,0x6e2a22,0,8.33,0);
var shp=new THREE.Shape();shp.moveTo(-5,0);shp.lineTo(5,0);shp.lineTo(0,2.89);shp.lineTo(-5,0);
var gGeo=new THREE.ExtrudeGeometry(shp,{depth:.3,bevelEnabled:false});
[3.85,-4.15].forEach(function(z){var gm2=new THREE.Mesh(gGeo,new THREE.MeshStandardMaterial({color:0xe6d6b0,roughness:.9}));gm2.position.set(0,5.2,z);gm2.castShadow=true;hall.add(gm2)});
HB(hall,.22,2.9,.22,0x4a3320,0,6.65,4.2);
var aw=new THREE.Mesh(new THREE.CircleGeometry(.55,20),new THREE.MeshBasicMaterial({color:0x35384f}));aw.position.set(0,6.1,4.2);hall.add(aw);
HB(hall,1.1,3.4,1.1,0x7a6a58,3.2,7.3,-1.8);HB(hall,1.4,.2,1.4,0x5a4a3a,3.2,9.05,-1.8);
var smoke=[0,1,2,3].map(function(i){var m=new THREE.Mesh(SP(.4),new THREE.MeshBasicMaterial({color:0xcfd3dc,transparent:true,opacity:0,depthWrite:false}));hall.add(m);return m});
var dp=new THREE.Group();dp.position.set(-1,0,4.05);hall.add(dp);
HB(dp,2,3.2,.18,0x5b3a1e,1,2.45,0);[.5,1,1.5].forEach(function(x){HB(dp,.06,3.1,.2,0x3a2414,x,2.45,.01)});HB(dp,2,.08,.2,0x3a2414,1,2.0,.01);M(dp,SP(.1),0xffd36b,1.7,2.4,.15,0x553300);
HB(hall,.3,3.7,.3,0x4a3320,-1.15,2.65,4.12);HB(hall,.3,3.7,.3,0x4a3320,1.15,2.65,4.12);HB(hall,2.8,.3,.3,0x4a3320,0,4.4,4.12);HB(hall,.5,.45,.3,0x7d7f88,0,4.4,4.14);
HB(hall,3.8,.35,1.4,0x8a8d96,0,.18,4.9);HB(hall,3.2,.35,.9,0x9a9da6,0,.52,4.55);
var hGlow=new THREE.Mesh(new THREE.PlaneGeometry(2,3.2),new THREE.MeshBasicMaterial({color:0x180f08}));hGlow.position.set(0,2.45,4.01);hall.add(hGlow);
var wins=[];
[-3.4,3.4].forEach(function(x){HB(hall,1.7,1.5,.16,0x4a3320,x,3.4,4.02);
  var gl=new THREE.Mesh(new THREE.PlaneGeometry(1.35,1.15),new THREE.MeshBasicMaterial({color:0x35384f}));gl.position.set(x,3.4,4.12);hall.add(gl);wins.push(gl);
  HB(hall,.07,1.15,.06,0x4a3320,x,3.4,4.14);HB(hall,1.35,.07,.06,0x4a3320,x,3.4,4.14);
  HB(hall,.5,1.5,.1,0x2f6f5e,x-1.15,3.4,4.12);HB(hall,.5,1.5,.1,0x2f6f5e,x+1.15,3.4,4.12);
  HB(hall,1.9,.35,.5,0x5b3a1e,x,2.5,4.35);
  for(var k=0;k<5;k++){M(hall,SP(.12),[0xff5a8a,0xffd36b,0xff8a5a][k%3],x-.7+k*.35,2.78,4.4);M(hall,SP(.1),0x3f8a3a,x-.7+k*.35,2.7,4.5)}});
var lants=[],lLights=[];
[-2.1,2.1].forEach(function(x){HB(hall,.34,.5,.34,0x333333,x,3.3,4.3);var lm=new THREE.Mesh(BX(.22,.34,.22),new THREE.MeshBasicMaterial({color:0x3a3a44}));lm.position.set(x,3.3,4.3);hall.add(lm);lants.push(lm);
  var li=new THREE.PointLight(0xffc66b,0,11,2);li.position.set(x,3.3,5);hall.add(li);lLights.push(li)});
HB(hall,3.4,.7,.12,0x4a3320,0,5.0,4.14);
var plq2=new THREE.Mesh(new THREE.PlaneGeometry(3.1,.55),new THREE.MeshBasicMaterial({map:tex(248,44,function(x){x.fillStyle='#2a1c10';x.fillRect(0,0,248,44);x.fillStyle='#ffd36b';x.font='bold 26px Georgia';x.textAlign='center';x.fillText('GUILD HALL',124,32)})}));plq2.position.set(0,5.0,4.21);hall.add(plq2);
anim.push(function(t){var o=hallOpen;dp.rotation.y+=((o?1.7:0)-dp.rotation.y)*Math.min(1,gdt*3);
  hGlow.material.color.setHex(o?0xffb85a:0x180f08);wins.forEach(function(w){w.material.color.setHex(o?0xffd36b:0x35384f)});lants.forEach(function(l){l.material.color.setHex(o?0xffe08a:0x3a3a44)});
  lLights.forEach(function(l){l.intensity+=((o?1.6:0)-l.intensity)*Math.min(1,gdt*3)});
  smoke.forEach(function(s,i){var k=((t*.35+i*.25)%1);s.position.set(3.2+Math.sin(t+i)*.3*k,9.3+k*3,-1.8);s.scale.setScalar(.5+k*1.2);s.material.opacity=o?.4*(1-k):0})});
/* the Thinker guards the door */
var tk=G(47,9.2);M(tk,BX(1.5,.9,1.5),0xb9b2a0,0,.45,0);M(tk,BX(.8,.9,.55),0xc9c2b0,0,1.35,0).rotation.x=.35;M(tk,SP(.28),0xc9c2b0,0,2.1,.2);
M(tk,BX(.3,.3,.9),0xc9c2b0,-.2,1.1,.6);M(tk,BX(.3,.3,.9),0xc9c2b0,.2,1.1,.6);M(tk,BX(.25,.7,.25),0xc9c2b0,-.1,1.65,.45).rotation.x=.9;tk.rotation.y=-.5;

/* gems: each one holds a challenge */
RL.forEach(function(r){
  var g=G(r.x*W,r.y*W);r.g=g;
  r.ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.5,28),glowMat(r.c,.55));r.ring.rotation.x=-Math.PI/2;r.ring.position.y=.1;g.add(r.ring);
  r.l=new THREE.PointLight(r.c,2.4,15,2);r.l.position.y=2.2;g.add(r.l);
  var u;
  if(r.kind==='gem'){var m=new THREE.Mesh(new THREE.OctahedronGeometry(.9,0),new THREE.MeshStandardMaterial({color:r.c,emissive:r.c,emissiveIntensity:1.2,roughness:.3,flatShading:true}));m.scale.set(1,1.5,1);m.castShadow=true;g.add(m);
    u=function(t,f){m.position.y=2+Math.sin(t*2)*.25;m.rotation.y=t*(f?.6:1.4);m.material.emissiveIntensity=f?.35:1.2+Math.sin(t*3)*.3}}
  else if(r.kind==='book'){M(g,CY(.35,.55,1.4,10),0x6b7280,0,.7,0);var bk=new THREE.Group();g.add(bk);
    M(bk,BX(1.5,.1,1.1),0x1f6b4a,0,0,0);[-1,1].forEach(function(s){var pg=M(bk,BX(.7,.06,1),0xf6edd0,s*.38,.1,0,0x6a5a30);pg.rotation.z=s*.18});
    u=function(t,f){bk.position.y=2.2+Math.sin(t*2)*.25;bk.rotation.y=t*.6;bk.rotation.x=-.5+Math.sin(t)*.1}}
  else{M(g,CY(1.6,2,.5,16),0x6b7280,0,.25,0);[-2.1,2.1].forEach(function(x){M(g,CY(.28,.34,3.6,8),0x8a8d96,x,2.1,0)});
    var pr=new THREE.Mesh(new THREE.TorusGeometry(1.9,.16,10,40),new THREE.MeshBasicMaterial({color:0xb48cff}));pr.position.y=2.9;g.add(pr);
    var sw=new THREE.Mesh(new THREE.CircleGeometry(1.8,32),new THREE.MeshBasicMaterial({map:tex(128,128,function(x){var gr=x.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'#ffffff');gr.addColorStop(.4,'#7a5cff');gr.addColorStop(1,'rgba(20,10,60,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);x.strokeStyle='#d9c9ff';x.lineWidth=3;for(var a=0;a<5;a++){x.beginPath();for(var k=0;k<60;k++){var an=k*.18+a*1.26,rr=k*1.05;x.lineTo(64+Math.cos(an)*rr,64+Math.sin(an)*rr)}x.stroke()}}),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    sw.position.y=2.9;g.add(sw);u=function(t,f){sw.rotation.z=-t*1.2;pr.rotation.z=t*.4}}
  r.upd=function(t,f){u(t,f);r.l.intensity=f?.8:2.4;r.ring.scale.setScalar(1+Math.sin(t*2+r.ty)*.12);r.ring.material.opacity=f?.18:.55};
});

/* bugs */
function mkBug(ty){var g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:ty?0x4aa8ff:0x6bbf59});
  var body=new THREE.Mesh(new THREE.BoxGeometry(.9,.55,1.1),m);body.position.y=.55;body.castShadow=true;g.add(body);
  var hd=new THREE.Mesh(new THREE.BoxGeometry(.55,.4,.4),m);hd.position.set(0,.55,.7);g.add(hd);
  var eyeM=new THREE.MeshBasicMaterial({color:0xe23b3b});
  [-.15,.15].forEach(function(x){var e=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.08),eyeM);e.position.set(x,.62,.92);g.add(e);
    var a=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.5),new THREE.MeshLambertMaterial({color:0x244a1e}));a.position.set(x,.8,1);g.add(a)});
  g.legs=[];[-.3,0,.3].forEach(function(z){[-1,1].forEach(function(s){var l=new THREE.Mesh(new THREE.BoxGeometry(.4,.1,.1),new THREE.MeshLambertMaterial({color:0x244a1e}));l.position.set(s*.6,.25,z);g.add(l);g.legs.push(l)})});
  g.body=m;g.scale.setScalar(ty?.8:1);g.ex=mkEx('!','#ff4040');g.qm=mkEx('?','#5bc0ff');g.add(g.ex,g.qm);scene.add(g);return g}
bugs.forEach(function(b,i){b.type=i%3===2?1:0;b.hp=b.type?1:2;b.sq=0;b.g=mkBug(b.type);b.yaw=0});

/* fireflies */
var fp=new Float32Array(flies.length*3),fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(fp,3));
scene.add(new THREE.Points(fg,new THREE.PointsMaterial({size:.5,color:0xffe678,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})));
var bits=[];

/* ---------- sound: an original chiptune loop made with the Web Audio API ---------- */
var AC=null,master=null,dly=null,hatBuf=null,muted=false,stepN=0,nextT=0;
function mf(m){return 440*Math.pow(2,(m-69)/12)}
function tone(f,t,d,type,v,out){var o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(out||master);o.start(t);o.stop(t+d+.05)}
function hat(t){var s=AC.createBufferSource(),g=AC.createGain(),h=AC.createBiquadFilter();s.buffer=hatBuf;h.type='highpass';h.frequency.value=7000;g.gain.value=.05;s.connect(h);h.connect(g);g.connect(master);s.start(t)}
var CH=[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],BS=[45,41,48,43];
var ML=[76,0,0,72,74,0,72,0, 69,0,72,0,77,0,76,72, 72,0,76,0,79,0,76,0, 74,0,71,0,67,0,71,74];
function sched(){if(!AC)return;while(nextT<AC.currentTime+.4){
  var s=stepN%32,bar=Math.floor(s/8),k=s%8,c=CH[bar],t=nextT;
  if(k===0)c.forEach(function(m){tone(mf(m),t,2.6,'sine',.05)});
  if(k===0||k===4)tone(mf(BS[bar]),t,.5,'triangle',.17);
  var ar=[c[0],c[1],c[2],c[1]+12,c[2]+12,c[1]+12,c[2],c[1]][k];tone(mf(ar+12),t,.28,'square',.022,dly);
  if(ML[s])tone(mf(ML[s]),t,.55,'triangle',.12,dly);
  if(k%2===1)hat(t);
  nextT+=.357;stepN++}}
function startMusic(){
  AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.25;master.connect(AC.destination);
  dly=AC.createDelay(.6);dly.delayTime.value=.357*.75;var fb=AC.createGain();fb.gain.value=.32;dly.connect(fb);fb.connect(dly);dly.connect(master);
  hatBuf=AC.createBuffer(1,2200,AC.sampleRate);var dta=hatBuf.getChannelData(0);for(var i=0;i<2200;i++)dta[i]=(Math.random()*2-1)*(1-i/2200);
  nextT=AC.currentTime+.1;setInterval(sched,100)}
function seq(n,gap,type,v){if(!AC||muted)return;n.forEach(function(m,i){tone(mf(m),AC.currentTime+i*gap,.3,type,v)})}
var sfx={chime:function(){seq([76,79,83,88],.08,'triangle',.13)},slash:function(){seq([84,72],.04,'square',.05)},pop:function(){seq([60,67,72],.04,'square',.07)},door:function(){seq([60,64,67,72,76],.1,'triangle',.13)}};
var mu=document.getElementById('mu');
function toggleMute(){muted=!muted;mu.textContent=muted?'♪ OFF':'♪ ON';if(master)master.gain.setTargetAtTime(muted?0:.25,AC.currentTime,.05)}
mu.onclick=toggleMute;
document.addEventListener('visibilitychange',function(){if(AC){if(document.hidden)AC.suspend();else AC.resume()}});

/* ---------- input ---------- */
addEventListener('keydown',function(e){var k=e.key.toLowerCase();
  if(k==='m'){toggleMute();return}
  if(k==='z'&&st==='play'){zoomT=zoomT===1?.6:(zoomT===.6?1.5:1);return}
  if(st==='cosmos'){if(k==='escape')exitCosmos();return}
  if(st==='game'&&MG){if(k===' '||k==='enter'){e.preventDefault();if(MG.act)MG.act()}if(k==='escape')MG.end();return}
  if(st==='dialog'){if(k===' '||k==='enter'||k==='escape'){e.preventDefault();close()}return}
  if(st!=='play')return;
  keys[k]=1;P.dest=null;if(k===' '){e.preventDefault();slash()}if(k==='f')shoot();
  if(['arrowup','arrowdown','arrowleft','arrowright'].indexOf(k)>-1)e.preventDefault()});
addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=0});
var ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),mv=new THREE.Vector2(),hit=new THREE.Vector3();
cv.addEventListener('pointerdown',function(e){if(st!=='play')return;
  mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(mv,camera);
  if(ray.ray.intersectPlane(plane,hit)){var hx=hit.x/W,hy=hit.z/W,tb=null,bdist=26;
    bugs.forEach(function(b){var d=Math.hypot(b.x-hx,b.y-hy);if(d<bdist){bdist=d;tb=b}});
    if(tb){P.dest=null;shoot(Math.atan2(tb.x-P.x,tb.y-P.y))}else P.dest={x:hx,y:hy}}});
var goBtn=document.getElementById('go');
goBtn.onclick=function(){document.getElementById('title').hidden=true;st='play';startMusic();
  setTimeout(function(){document.getElementById('tip').style.opacity=0},10000)};
goBtn.focus();

/* ---------- effects ---------- */
var lab=document.getElementById('lab'),bursts=[],slashT=0;
function proj(x,y,z){var v=new THREE.Vector3(x,y,z).project(camera);return [(v.x*.5+.5)*innerWidth,(-v.y*.5+.5)*innerHeight]}
function floatText(x,y,z,txt){var p=proj(x,y,z),d=document.createElement('div');d.className='fl';d.textContent=txt;d.style.left=p[0]+'px';d.style.top=p[1]+'px';document.body.appendChild(d);setTimeout(function(){d.remove()},1300)}
function burst(x,z){for(var i=0;i<9;i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial({color:0xb6ff7a}));m.position.set(x,.8,z);scene.add(m);
  bursts.push({m:m,vx:(Math.random()-.5)*7,vy:Math.random()*5+2,vz:(Math.random()-.5)*7,t:.55})}}
var lastKill=-9,combo=0,spawnT=6,arrows=[],bowT=0,bowCd=0;
var flavor=['Bug fixed!','NullPointer!','404 not found','Segfault!','Merge conflict!','Works on my machine','Compiled!'];
function hurt(b,ax,ay){
  b.hp--;b.fl=.14;b.sq=.2;var an=Math.atan2(b.y-ay,b.x-ax);
  if(!blocked(b.x+Math.cos(an)*7,b.y+Math.sin(an)*7)){b.x+=Math.cos(an)*7;b.y+=Math.sin(an)*7}
  if(b.hp<=0&&!b.dead){b.dead=1;var now=performance.now()/1000;combo=now-lastKill<3?combo+1:1;lastKill=now;killed++;
    var xg=1+combo;gain(xg);sfx.pop();burst(b.x*W,b.y*W);floatText(b.x*W,2.2,b.y*W,'+'+xg+' XP');
    var bx=b.x*W,bz=b.y*W,cb=combo;setTimeout(function(){floatText(bx,3.6,bz,flavor[Math.floor(Math.random()*flavor.length)])},140);
    if(cb>1)setTimeout(function(){floatText(P.x*W,5,P.y*W,'COMBO x'+cb)},280);
    scene.remove(b.g);if(killed===6)setTimeout(function(){floatText(P.x*W,6,P.y*W,'BUG HUNTER!')},500)}}
function slash(){
  if(P.cd>0)return;P.cd=.5;P.slash=.18;slashT=.2;sfx.slash();
  bugs.forEach(function(b){if(Math.hypot(b.x-P.x,b.y-P.y)<26)hurt(b,P.x,P.y)});
  bugs=bugs.filter(function(b){return !b.dead});
}
function shoot(ang){
  if(st!=='play'||bowCd>0)return;bowCd=.55;bowT=.4;
  if(ang===undefined)ang=Math.atan2(P.fx,P.fy);
  P.fx=Math.sin(ang);P.fy=Math.cos(ang);seq([88,76],.03,'triangle',.07);
  var g=new THREE.Group();var sh=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,1.2),new THREE.MeshBasicMaterial({color:0xe8d9a8}));g.add(sh);
  var hd=new THREE.Mesh(new THREE.ConeGeometry(.12,.3,6),new THREE.MeshBasicMaterial({color:0xcfd8e6}));hd.rotation.x=Math.PI/2;hd.position.z=.7;g.add(hd);
  var fl=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,.25),new THREE.MeshBasicMaterial({color:0xff6b6b}));fl.position.z=-.55;g.add(fl);
  g.position.set(P.x*W,1.3,P.y*W);g.rotation.y=ang;scene.add(g);
  arrows.push({g:g,x:P.x,y:P.y,vx:Math.sin(ang)*270,vy:Math.cos(ang)*270,t:.9});
}
function spawnBug(){var bx,by,n=0;do{bx=(3+Math.random()*34)*T;by=(4+Math.random()*20)*T;n++}while((blocked(bx,by)||Math.hypot(bx-P.x,by-P.y)<110)&&n<40);
  var ty=Math.random()<.4?1:0,b={x:bx,y:by,hp:ty?1:2,a:0,t:1,fl:0,sq:0,type:ty,yaw:0};b.g=mkBug(ty);bugs.push(b);burst(bx*W,by*W)}

/* ---------- the game inside the game: one challenge per science ---------- */
var mgEl=document.getElementById('mg'),MG=null,GM={};
var MAPD={eng:'about',lit:'exp'};
var GN={
 eng:['ENGINEERING: BUILD THE BRIDGE','Press SPACE (or tap the picture) when the white marker is inside the green zone. Lock four steel segments to span the gap.'],
 phys:['PHYSICS: HIT THE TARGET','Projectile motion. Press SPACE to lock the angle, then SPACE again to lock the power. R = v²·sin(2θ) / g.'],
 astro:['ASTRONOMY: DRAW THE CONSTELLATION','Click the stars in order, from 1 to 6, to restore the constellation.'],
 lit:['LITERATURE: RESTORE THE SENTENCE','Click the words in the right order to rebuild the lost sentence.'],
 phil:['PHILOSOPHY: THE THINKER ASKS','Answer the Thinker. There are no wrong answers, only honest ones.']
};
function startGame(id){
  st='game';P.dest=null;keys={};
  mgEl.innerHTML='<div class="mgbox"><h2>'+GN[id][0]+'</h2><p>'+GN[id][1]+'</p><div id="mgb"></div><p id="mgs" class="mgs">&nbsp;</p><div class="acts"><button class="btn alt" id="mgx">SKIP ▶</button></div></div>';
  mgEl.hidden=false;
  var body=document.getElementById('mgb'),status=document.getElementById('mgs'),fin=false,me={act:null,raf:0};MG=me;
  function end(){if(fin)return;fin=true;cancelAnimationFrame(me.raf);mgEl.hidden=true;MG=null;st='play';finish(id)}
  me.end=end;
  var sk=document.getElementById('mgx');sk.onclick=end;sk.focus();
  GM[id](body,status,function(){setTimeout(end,900)},me);
}
function finish(id){
  if(id==='phil'){found.contact=1;gain(3);sfx.door();open('contact');return}
  found[id]=1;gain(3);sfx.chime();if(id==='eng')repairBridge();open(MAPD[id]);
}
function mkCanvas(body){var c=document.createElement('canvas');c.width=480;c.height=270;c.className='mgc';body.appendChild(c);return c}
function mgLoop(me,fn){var last=performance.now();(function loop(now){var dt=Math.min(.05,(now-last)/1000);last=now;if(MG!==me)return;fn(dt);me.raf=requestAnimationFrame(loop)})(last)}

GM.eng=function(body,status,win,me){
  var cv=mkCanvas(body),x=cv.getContext('2d'),seg=0,m=0,dir=1,sp=230,zone=240,hw=36,shake=0,done=false;
  function act(){if(done)return;if(Math.abs(m-zone)<hw){seg++;sfx.pop();status.textContent='Segment '+seg+'/4 locked in place.';sp+=70;zone=110+Math.random()*260;
    if(seg>=4){done=true;status.textContent='The bridge holds. Engineering restored!';win()}}else{shake=.3;status.textContent='Misaligned! Try again.'}}
  me.act=act;cv.onpointerdown=act;
  mgLoop(me,function(dt){
    if(!done){m+=dir*sp*dt;if(m>460){m=460;dir=-1}if(m<20){m=20;dir=1}}shake-=dt;
    var g=x.createLinearGradient(0,0,0,270);g.addColorStop(0,'#27346b');g.addColorStop(1,'#e58a5a');x.fillStyle=g;x.fillRect(0,0,480,270);
    x.fillStyle='#5a5560';x.fillRect(0,150,140,120);x.fillRect(340,150,140,120);x.fillStyle='#2d3f6b';x.fillRect(140,235,200,35);
    for(var i=0;i<seg;i++){var bx=140+i*50;x.fillStyle='#ffb23a';x.fillRect(bx,146,50,8);x.fillRect(bx,172,50,6);x.strokeStyle='#e0702a';x.lineWidth=3;x.beginPath();x.moveTo(bx,154);x.lineTo(bx+25,172);x.lineTo(bx+50,154);x.stroke()}
    x.fillStyle='#161a33';x.fillRect(20,50,440,18);x.fillStyle='#3ddc84';x.fillRect(zone-hw,50,hw*2,18);
    x.fillStyle='#fff';x.fillRect(m-3+(shake>0?Math.random()*4-2:0),42,6,34);x.font='12px monospace';x.fillText('LOAD TEST  '+seg*25+'%',20,36)});
};

GM.phys=function(body,status,win,me){
  var cv=mkCanvas(body),x=cv.getContext('2d'),ph=0,ang=45,pw=.5,tm=0,shot=null,trail=[],tgt=300+Math.random()*130,done=false,G=100;
  function act(){if(done||shot)return;
    if(ph===0){ph=1;status.textContent='Angle locked at '+Math.round(ang)+'°. Now the power.'}
    else{var v=(.35+.65*pw)*215,a=ang*Math.PI/180;shot={t:0,vx:v*Math.cos(a),vy:v*Math.sin(a)};trail=[];sfx.slash()}}
  me.act=act;cv.onpointerdown=act;
  mgLoop(me,function(dt){
    tm+=dt;if(!shot){if(ph===0)ang=45+30*Math.sin(tm*2.2);else pw=.5+.5*Math.sin(tm*3)}
    if(shot){shot.t+=dt;var px=40+shot.vx*shot.t,py=230-(shot.vy*shot.t-.5*G*shot.t*shot.t);trail.push([px,py]);
      if(py>=230&&shot.t>.05){var hit=Math.abs(px-tgt)<24;shot=null;
        if(hit){done=true;status.textContent='Direct hit! Physics restored!';win()}else{ph=0;status.textContent='Missed by '+Math.round(px-tgt)+' px. Adjust the angle and power.'}}}
    var g=x.createLinearGradient(0,0,0,270);g.addColorStop(0,'#0f1a3d');g.addColorStop(1,'#2a4a7a');x.fillStyle=g;x.fillRect(0,0,480,270);
    x.fillStyle='#3b6b3b';x.fillRect(0,230,480,40);
    x.fillStyle='#ff5a5a';x.fillRect(tgt-18,222,36,8);x.fillStyle='#fff';x.fillRect(tgt-8,214,16,8);
    x.fillStyle='#cfd8e6';trail.forEach(function(p){x.fillRect(p[0],p[1],3,3)});
    x.save();x.translate(40,230);x.rotate(-ang*Math.PI/180);x.fillStyle='#8a8f99';x.fillRect(0,-6,34,12);x.restore();x.fillStyle='#555a66';x.beginPath();x.arc(40,230,12,Math.PI,0);x.fill();
    x.fillStyle='#fff';x.font='12px monospace';x.fillText('θ = '+Math.round(ang)+'°',20,30);x.fillStyle='#222';x.fillRect(20,42,160,10);x.fillStyle=ph===1?'#ffd36b':'#666';x.fillRect(20,42,160*pw,10);x.fillStyle='#fff';x.fillText('power',190,51)});
};

GM.astro=function(body,status,win,me){
  var cv=mkCanvas(body),x=cv.getContext('2d'),S=[[70,200],[140,130],[215,165],[285,85],[355,140],[420,70]],n=0,flash=0,bg=[],tm=0;
  for(var i=0;i<90;i++)bg.push([Math.random()*480,Math.random()*270,Math.random()*6]);
  cv.onpointerdown=function(e){var r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*480/r.width,py=(e.clientY-r.top)*270/r.height,k=-1;
    S.forEach(function(s,j){if(Math.hypot(s[0]-px,s[1]-py)<24)k=j});
    if(k===n){n++;sfx.pop();status.textContent=n+'/6 stars connected.';if(n===6){status.textContent='The constellation shines. Astronomy restored!';win()}}
    else if(k>=0){flash=.3;status.textContent='Not that one. Follow the numbers.'}};
  mgLoop(me,function(dt){tm+=dt;flash-=dt;
    x.fillStyle='#070a1f';x.fillRect(0,0,480,270);bg.forEach(function(b){x.fillStyle='rgba(200,210,255,'+(.3+.4*Math.abs(Math.sin(tm+b[2])))+')';x.fillRect(b[0],b[1],2,2)});
    x.strokeStyle='#b48cff';x.lineWidth=2;x.beginPath();for(var i=0;i<n;i++){i?x.lineTo(S[i][0],S[i][1]):x.moveTo(S[i][0],S[i][1])}x.stroke();
    S.forEach(function(s,i){x.fillStyle=i<n?'#ffe9a0':(i===n&&flash>0?'#ff6b6b':'#8fa0ff');x.beginPath();x.arc(s[0],s[1],i<n?9:7,0,6.3);x.fill();x.fillStyle='#fff';x.font='12px monospace';x.fillText(i+1,s[0]+12,s[1]-10)})});
};

GM.lit=function(body,status,win,me){
  var words=['Bridging','physical','and','digital','worlds'],bag=words.slice().sort(function(){return Math.random()-.5}),n=0;
  body.innerHTML='<p class="mgline" id="ml">&nbsp;</p><div class="chips" id="cp"></div>';
  var ml=document.getElementById('ml'),cp=document.getElementById('cp');
  bag.forEach(function(w){var b=document.createElement('button');b.className='btn alt';b.textContent=w;
    b.onclick=function(){if(w===words[n]){n++;b.disabled=true;ml.textContent=words.slice(0,n).join(' ');sfx.pop();
      if(n===words.length){status.textContent='The sentence is whole. Literature restored!';win()}}else status.textContent='That word does not come next.'};
    cp.appendChild(b)});
};

GM.phil=function(body,status,win,me){
  var Q=[
   ['Traveler, what are you building?',['Systems that last.','Whatever the deadline asks for.','I haven’t decided.'],['Good. Foundations first.','Deadlines are weather, not purpose.','Then keep walking, and keep asking.']],
   ['And what drives the one who builds?',['Curiosity. I love exact sciences.','Fear of falling behind.','Silence.'],['Curiosity is the oldest engine.','Fear is a poor architect.','Even silence has structure.']],
   ['Then know thyself. Why should the guild hire you?',['Because I bridge physical and digital worlds.','Because I never sleep.','Ask the bugs.'],['A bridge is the honest answer.','Rest is also engineering.','The bugs already did, Ingrid.']]
  ],i=0;
  function show(){body.innerHTML='<p class="mgline">'+Q[i][0]+'</p><div class="chips" id="cp"></div>';var cp=document.getElementById('cp');
    Q[i][1].forEach(function(o,k){var b=document.createElement('button');b.className='btn alt';b.textContent=o;
      b.onclick=function(){[].forEach.call(cp.children,function(c){c.disabled=true});status.textContent=Q[i][2][k];sfx.pop();i++;
        if(i>=Q.length){body.innerHTML='<p class="mgline">“Gnothi seauton.” You know yourself.</p>';win()}else setTimeout(show,1200)};
      cp.appendChild(b)})}
  show();
};

/* ---------- the Cosmos: a second world behind the portal, six branches of physics linked by paths ---------- */
var scene2=new THREE.Scene(),inCosmos=0,exitAfter=0,cur=0,path=[],seg=0,segT=0,visited={},nl=[],adj=[[],[],[],[],[],[]];
scene2.background=new THREE.Color(0x03030c);scene2.add(new THREE.AmbientLight(0x9098d0,.9));
var dl2=new THREE.DirectionalLight(0xffffff,.9);dl2.position.set(5,10,8);scene2.add(dl2);
(function(){var a=new Float32Array(1400*3);for(var i=0;i<1400;i++){var d=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(60+Math.random()*60);a[i*3]=d.x;a[i*3+1]=d.y;a[i*3+2]=d.z}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));scene2.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,color:0xcfd6ff})))})();
[[-30,10,-40,0x5a3aff],[35,-12,-30,0xff3a8a],[0,25,-50,0x3affd0]].forEach(function(n){
  var s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex(128,128,function(x){var g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}),color:n[3],transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));
  s.position.set(n[0],n[1],n[2]);s.scale.set(70,70,1);scene2.add(s)});
var NODES=[
 {n:'MECHANICS',p:[-10,1,-2],c:0xff9a4a},{n:'THERMODYNAMICS',p:[-5,-5,-8],c:0xff4a3a},{n:'OPTICS',p:[2,5,-6],c:0x5af0ff},
 {n:'ELECTROMAGNETISM',p:[10,0,-1],c:0xffe45a},{n:'RELATIVITY',p:[4,-2,6],c:0x8a6aff},{n:'QUANTUM',p:[-4,3,6],c:0xc98aff}];
NODES.forEach(function(nd,i){
  var g=new THREE.Group();g.position.set(nd.p[0],nd.p[1],nd.p[2]);scene2.add(g);nd.g=g;nd.spin=[];var core;
  if(i===2)core=new THREE.Mesh(new THREE.OctahedronGeometry(1.25,0),new THREE.MeshStandardMaterial({color:nd.c,emissive:nd.c,emissiveIntensity:.8,flatShading:true}));
  else if(i===4){core=new THREE.Mesh(SP(1),new THREE.MeshBasicMaterial({color:0x000000}));var dk=new THREE.Mesh(new THREE.TorusGeometry(1.9,.25,8,48),new THREE.MeshBasicMaterial({color:0xffb86a}));dk.rotation.x=1.3;g.add(dk);nd.spin.push(dk)}
  else core=new THREE.Mesh(SP(1),new THREE.MeshStandardMaterial({color:nd.c,emissive:nd.c,emissiveIntensity:i===1?.9:.3,roughness:.6}));
  g.add(core);nd.core=core;
  if(i===0||i===3){var rg=new THREE.Mesh(new THREE.TorusGeometry(1.7,.06,8,40),new THREE.MeshBasicMaterial({color:i?0xfff2a0:0xffc080}));rg.rotation.x=1.1;g.add(rg);nd.spin.push(rg);
    if(i===3){var rg2=rg.clone();rg2.rotation.x=.3;rg2.rotation.z=1;g.add(rg2);nd.spin.push(rg2)}}
  if(i===5){var cl=new THREE.Group();g.add(cl);for(var k=0;k<14;k++){var o=new THREE.Mesh(SP(.14),new THREE.MeshBasicMaterial({color:0xe3c4ff})),a=Math.random()*6.28,b=Math.random()*3.14,rr=1.6+Math.random()*.7;o.position.set(Math.cos(a)*Math.sin(b)*rr,Math.cos(b)*rr,Math.sin(a)*Math.sin(b)*rr);cl.add(o)}nd.spin.push(cl)}
  var b=document.createElement('button');b.className='nl';b.textContent=nd.n;b.hidden=true;b.onclick=function(){travel(i)};document.body.appendChild(b);nl.push(b);
});
[[0,1],[1,4],[4,3],[3,2],[2,0],[0,5],[5,4],[5,2]].forEach(function(e){
  adj[e[0]].push(e[1]);adj[e[1]].push(e[0]);
  var a=new THREE.Vector3().fromArray(NODES[e[0]].p),b=new THREE.Vector3().fromArray(NODES[e[1]].p),len=a.distanceTo(b);
  var cy=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,len,6),glowMat(0x8fa0ff,.55));cy.position.copy(a).lerp(b,.5);cy.lookAt(b);cy.rotateX(Math.PI/2);scene2.add(cy)});
function nodePos(i){return NODES[i].g.position}
function route(a,b){var prev={};prev[a]=-1;var q=[a];while(q.length){var u=q.shift();if(u===b)break;adj[u].forEach(function(v){if(!(v in prev)){prev[v]=u;q.push(v)}})}var p=[],u2=b;while(u2!==-1&&u2!==undefined){p.unshift(u2);u2=prev[u2]}return p}
var CT=['MECHANICS: FORCES AND STRUCTURES','THERMODYNAMICS: ENERGY, CLIMATE AND DATA','OPTICS: HOW LIGHT BECOMES INTERFACE','ELECTROMAGNETISM: FIELDS AND SECURITY','RELATIVITY: TIME, SPACE AND SHIPPING','QUANTUM: MANY STATES AT ONCE'];
function row(a,b){return '<div class="row"><b>'+a+'</b><span>'+b+'</span></div>'}
var LK=' style="color:#7dffa8"';
var CARD=[
 '<p>Newton’s laws hold up bridges and backends alike: load, balance, flow.</p>'+row('Back-end','Node.js, Express, Django, FastAPI, Rails, Laravel, Kafka')+row('Project','Order Management System: Backend system for laboratory order management. <a href="https://github.com/Ingridvasc/order-management-system"'+LK+'>code</a>'),
 '<p>Entropy and rainfall: patterns hide inside the noise.</p>'+row('Data','PostgreSQL, MySQL, MongoDB, Redis, ETL, advanced SQL')+row('Project','Pettitt test analysis: 43 years of rainfall (1980–2023) in the Agreste of Pernambuco, Brazil, and the shifts the test found. <a href="https://github.com/Ingridvasc/Test-of-Pettitt"'+LK+'>code</a>'),
 '<p>Light, bent and shaped, becomes the screen you touch.</p>'+row('Front-end','React, Next.js, Flutter, Material-UI, HTML5, CSS3')+row('Project','WeatherWise - Intelligent Weather Companion: A visually stunning weather experience that blends hyperlocal forecasts with your personal weather memories. <a href="https://github.com/Ingridvasc/WeatherWise-App"'+LK+'>code</a>'),
 '<p>Fields, signals and keys: what moves must be protected.</p>'+row('Security','OWASP Top 10, JWT/OAuth2, AES/RSA encryption, API hardening')+row('Project','Sistema de Detecção de Risco de Evasão com Fairness. <a href="https://github.com/Ingridvasc/Sistema-de-Deteccao-de-Risco-de-Evasao-com-Fairness"'+LK+'>code</a>'),
 '<p>Time bends depending on where you stand, and so do environments. Ship them all.</p>'+row('DevOps','Docker, Kubernetes, AWS, CI/CD, Git, GitHub Actions')+row('Project','Financial Market Analysis with Machine Learning: This project uses advanced Machine Learning techniques to analyze historical financial market data and generate buy/sell signals. <a href="https://github.com/Ingridvasc/Financial-market-analysis-with-machine-learning"'+LK+'>code</a>'),
 '<p>Many states at once: many languages in the same head.</p>'+row('Languages','Python, TypeScript, JavaScript, Java, R, PHP, Ruby, Rust, C#, C++')+row('Project','Quantum Option Pricing using Quantum Random Walk: This project implements a quantum random walk approach for financial option pricing using the Black-Scholes model. <a href="https://github.com/Ingridvasc/Qiskit-Fall-Fest-Quandela-1"'+LK+'>code</a>'),
];
function arrive(i){
  var first=!visited[i];visited[i]=1;var n=Object.keys(visited).length,html=CARD[i];
  if(first)gain(1);
  if(n===6&&!found.cosmos){found.cosmos=1;gain(3);exitAfter=1;html+='<p style="color:#ffd36b">All six paths are connected. The Cosmos is awake!</p>'}
  else html+='<p style="color:#ffd36b">Worlds visited: '+n+'/6</p>';
  D.cx=[CT[i],html];sfx.chime();open('cx')}
function travel(i){if(st!=='cosmos'||path.length)return;if(i===cur){arrive(i);return}path=route(cur,i);seg=0;segT=0}
function enterCosmos(){inCosmos=1;st='cosmos';P.dest=null;keys={};lab.hidden=true;scene2.add(av);av.scale.setScalar(.22);cur=0;path=[];
  legL.rotation.x=legR.rotation.x=armL.rotation.x=armR.rotation.x=0;av.position.copy(nodePos(0));av.position.y+=1.2;
  nl.forEach(function(b){b.hidden=false});sfx.door()}
function exitCosmos(){inCosmos=0;st='play';scene.add(av);av.scale.setScalar(.55);nl.forEach(function(b){b.hidden=true})}
var fv=new THREE.Vector3(),tv=new THREE.Vector3();
function cosmosFrame(dt,t){
  var ca=t*.1;camera.position.set(Math.sin(ca)*27,8+Math.sin(t*.25)*2,Math.cos(ca)*27);camera.lookAt(0,0,0);
  NODES.forEach(function(nd,i){nd.core.rotation.y=t*.4;nd.spin.forEach(function(s,k){s.rotation.y=t*(.6+k*.3)});nd.g.scale.setScalar(1+(visited[i]?.15:0)+Math.sin(t*2+i)*.03)});
  if(path.length&&st==='cosmos'){fv.copy(nodePos(path[seg]));tv.copy(nodePos(path[seg+1]));var dur=fv.distanceTo(tv)/9;segT+=dt/dur;var k=Math.min(1,segT),e=k*k*(3-2*k);
    av.position.copy(fv).lerp(tv,e);av.position.y+=1.2+Math.sin(Math.PI*k)*1.4;bd.rotation.y=Math.atan2(tv.x-fv.x,tv.z-fv.z);
    if(segT>=1){seg++;segT=0;sfx.pop();if(seg>=path.length-1){cur=path[path.length-1];path=[];arrive(cur)}}}
  else{av.position.copy(nodePos(cur));av.position.y+=1.2+Math.sin(t*3)*.05;bd.rotation.y=Math.sin(t*.5)*.6}
  nl.forEach(function(b,i){var v=nodePos(i).clone();v.y+=2.1;v.project(camera);b.style.left=(v.x*.5+.5)*innerWidth+'px';b.style.top=(-v.y*.5+.5)*innerHeight+'px';b.style.display=v.z>1?'none':'';b.textContent=(visited[i]?'✔ ':'')+NODES[i].n});
}
function bridgeTalk(){
  if(!BR.met){BR.met=1;gain(2);sfx.chime();open('spiritBridge');return}
  var Q=['Every plank remembers a footstep.','Hold the rail, builder. The valley is listening.','A bridge is a promise made of wood.','Ask the Thinker what a bridge really connects.','From here you can see the whole valley wake up.'];
  D.hint=['THE POND SPIRIT','<p>'+Q[Math.floor(Math.random()*Q.length)]+'</p>'];open('hint')}
/* the pond spirit speaks */
function spiritTalk(){
  if(!SPR.met){SPR.met=1;open('spirit');return}
  var m=!found.eng?'The bridge east of my pond waits for a builder. Touch the orange gem.':!found.lit?'The librarian in the north-east whispers to the books. Wake the green book.':!found.cosmos?'The portal in the north-west leads to the Cosmos, where six sciences are linked by paths of stars.':'All three gems shine. Go to the Guild Hall and face the Thinker.';
  if(found.eng&&!BR.met)m='Walk onto the bridge you mended, builder. I want to talk to you up close.';
  if(found.contact)m='The valley is awake again, thanks to you. Stay as long as you like.';
  D.hint=['THE POND SPIRIT','<p>'+m+'</p>'];open('hint')}

/* ---------- update ---------- */
var amp=0;
function update(dt){
  if(st!=='play')return;
  var vx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),vy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  if(P.dest&&!vx&&!vy){var dx=P.dest.x-P.x,dy=P.dest.y-P.y,d=Math.hypot(dx,dy);if(d<3)P.dest=null;else{vx=dx/d;vy=dy/d}}
  var l=Math.hypot(vx,vy);P.moving=l>0;
  if(P.moving){vx/=l;vy/=l;var nx=P.x+vx*72*dt,ny=P.y+vy*72*dt;
    if(!blocked(nx,P.y))P.x=nx;else if(P.dest)P.dest=null;if(!blocked(P.x,ny))P.y=ny;else if(P.dest)P.dest=null;
    P.fx=vx;P.fy=vy;P.step+=dt*10}
  P.cd-=dt;P.slash-=dt;
  spawnT-=dt;bowCd-=dt;bowT-=dt;
  if(killed>=6&&bugs.length<4&&spawnT<=0){spawnBug();spawnT=7}
  bugs.forEach(function(b){var d=Math.hypot(P.x-b.x,P.y-b.y);b.t-=dt;b.fl-=dt;b.sq-=dt;
    if(b.t<=0){b.t=1+Math.random()*1.5;b.a=Math.random()*6.28}
    var sp,an,R_=b.type?95:75;
    if(d<R_){an=b.type?Math.atan2(b.y-P.y,b.x-P.x):Math.atan2(P.y-b.y,P.x-b.x);sp=b.type?42:32}else{an=b.a;sp=b.type?12:16}
    b.al=d<R_;
    var nx=b.x+Math.cos(an)*sp*dt,ny=b.y+Math.sin(an)*sp*dt;
    b.yaw=Math.atan2(Math.cos(an),Math.sin(an));
    if(!blocked(nx,b.y))b.x=nx;else{b.t=0;b.a+=2}if(!blocked(b.x,ny))b.y=ny;else{b.t=0;b.a+=2}
    if(d<20&&!b.type)slash()});
  RL.forEach(function(r){var d=Math.hypot(P.x-r.x,P.y-r.y);if(d<(r.id==='cosmos'?20:16)&&r.armed){r.armed=false;sfx.chime();if(r.id==='cosmos')enterCosmos();else if(found[r.id])open(MAPD[r.id]);else startGame(r.id)}if(d>44)r.armed=true});
  var ds=Math.hypot(P.x-SPR.x,P.y-SPR.y),onB=bridgeH(P.x,P.y)>.5;
  if(ds<85&&SPR.armed){SPR.armed=false;spiritTalk()}
  else if(onB&&ds<80&&BR.armed){BR.armed=false;bridgeTalk()}
  if(ds>160)SPR.armed=true;if(!onB)BR.armed=true;
  var dq=Math.hypot(P.x-LIB.x,P.y-LIB.y);if(dq<75&&LIB.armed&&!LIB.met){LIB.armed=false;LIB.met=1;open('librarian')}
  var dd=Math.hypot(P.x-DOOR.x,P.y-DOOR.y);
  if(dd<22&&DOOR.armed){DOOR.armed=false;if(RL.every(function(r){return found[r.id]})){if(found.contact)open('contact');else startGame('phil')}else open('locked')}
  if(dd>50)DOOR.armed=true;
}
P.fx=0;P.fy=1;var yaw=0,gy=0,idleT=0,zoom=1,zoomT=1,camP=new THREE.Vector3(41,12,40);

/* ---------- render loop ---------- */
var last=performance.now();
function frame(now){
  var dt=Math.min(.05,(now-last)/1000),t=now/1000;last=now;gdt=dt;
  if(inCosmos){cosmosFrame(dt,t);renderer.render(scene2,camera);requestAnimationFrame(frame);return}
  update(dt);
  var px=P.x*W,pz=P.y*W,unlocked=RL.every(function(r){return found[r.id]});
  amp+=((P.moving&&st==='play'?1:0)-amp)*Math.min(1,dt*8);
  var sw=Math.sin(P.step)*.9*amp;
  idleT=P.moving?0:idleT+dt;var target=idleT>.6?0:Math.atan2(P.fx,P.fy),dy=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));yaw+=dy*Math.min(1,dt*12);
  gy+=(bridgeH(P.x,P.y)-gy)*Math.min(1,dt*14);av.position.set(px,gy,pz);bd.rotation.y=yaw;bd.position.y=P.moving?Math.abs(Math.sin(P.step))*.18:Math.sin(t*2)*.04;
  legL.rotation.x=sw;legR.rotation.x=-sw;
  var spr=slashT>0?1-slashT/.2:0;armR.rotation.x=slashT>0?-2.7+2.55*spr:sw;armL.rotation.x=bowT>0?-1.5:-sw;
  if(bowT>0&&bowG.parent!==armL){armL.add(bowG);bowG.position.set(0,-1.1,.3);bowG.rotation.set(0,-Math.PI/2,0)}
  else if(bowT<=0&&bowG.parent!==bd){bd.add(bowG);bowG.position.set(0,2.7,-.5);bowG.rotation.set(0,Math.PI/2,0)}
  hairP.rotation.x=.06+amp*.25*Math.abs(Math.sin(P.step))+Math.sin(t*1.5)*.03;
  RL.forEach(function(r){r.upd(t,!!found[r.id])});
  bugs.forEach(function(b){b.g.position.set(b.x*W,Math.abs(Math.sin(t*10+b.a))*.08+bridgeH(b.x,b.y),b.y*W);b.g.rotation.y=b.yaw;
    b.g.body.emissive.setHex(b.fl>0?0xffffff:0);b.g.legs.forEach(function(l,i){l.rotation.z=Math.sin(t*16+i)*.4});
    var sc_=b.type?.8:1,q=b.sq>0;b.g.scale.set(sc_*(q?1.35:1),sc_*(q?.5:1),sc_*(q?1.35:1));
    b.g.ex.visible=!!b.al&&!b.type;b.g.qm.visible=!!b.al&&!!b.type});
  bursts.forEach(function(p){p.t-=dt;p.vy-=16*dt;p.m.position.x+=p.vx*dt;p.m.position.y=Math.max(.1,p.m.position.y+p.vy*dt);p.m.position.z+=p.vz*dt;if(p.t<=0)scene.remove(p.m)});
  bursts=bursts.filter(function(p){return p.t>0});
  slashT-=dt;slashFx.material.opacity=Math.max(0,slashT*4);slashFx.position.set(px+Math.sin(yaw)*1.2,.9,pz+Math.cos(yaw)*1.2);slashFx.rotation.z=yaw-Math.PI/2;
  var open_=unlocked;hallOpen=open_;pond.material.emissiveIntensity=.45+Math.sin(t*1.5)*.1;
  for(var i=0;i<flies.length;i++){var f=flies[i];if(!reduce){f.a+=dt;f.x+=Math.cos(f.a)*f.s*dt;f.y+=Math.sin(f.a*1.3)*f.s*dt}
    fp[i*3]=f.x*W;fp[i*3+1]=1.2+Math.sin(t+f.a)*.8+i%3*.4;fp[i*3+2]=f.y*W}
  fg.attributes.position.needsUpdate=true;
  moonL.position.set(px-18,34,pz+14);moonL.target.position.set(px,0,pz);sky.position.set(px,0,pz);
  var k=1-Math.exp(-dt*5);zoom+=(zoomT-zoom)*k;camP.lerp(new THREE.Vector3(px,12*zoom,pz+15*zoom),k);camera.position.copy(camP);camera.lookAt(px,1.2,pz-1.5);
  lab.hidden=true;
  RL.forEach(function(r){if(Math.hypot(P.x-r.x,P.y-r.y)<44){var p=proj(r.x*W,4.2,r.y*W);lab.textContent=r.n;lab.style.left=p[0]+'px';lab.style.top=p[1]+'px';lab.hidden=false}});
  if(Math.hypot(P.x-DOOR.x,P.y-DOOR.y)<50){var p=proj(41,7,9);lab.textContent=open_?'GUILD HALL: THE THINKER AWAITS':'GUILD HALL (SEALED)';lab.style.left=p[0]+'px';lab.style.top=p[1]+'px';lab.hidden=false}
  anim.forEach(function(f){f(t)});
  arrows.forEach(function(a){a.t-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.g.position.set(a.x*W,1.3,a.y*W);
    bugs.forEach(function(b){if(!a.done&&!b.dead&&Math.hypot(b.x-a.x,b.y-a.y)<11){a.done=1;hurt(b,P.x,P.y)}});
    if(blocked(a.x,a.y)||a.t<=0)a.done=1;if(a.done)scene.remove(a.g)});
  arrows=arrows.filter(function(a){return !a.done});bugs=bugs.filter(function(b){return !b.dead});

  renderer.render(scene,camera);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

})();
