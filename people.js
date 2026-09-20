/* =====================================================================
   SHATOR CANVAS — gallery visitors
   Jointed figures built from simple solids, stylised rather than
   photographic: at gallery distances the read is posture and stillness,
   not skin. They walk between rooms through the real doorways, stop in
   front of a picture, and look at it for a while before moving on.

   Nothing here touches index.html beyond the two hooks it exposes.
   Delete the <script src="people.js"> line and the gallery is exactly
   as it was.

   Tuning, if you want it — set before this file loads:
     window.SHATOR_PEOPLE = { count: 16, speed: 0.95 };
   ===================================================================== */
(function(){
'use strict';

var OPT = window.SHATOR_PEOPLE || {};
var IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

/* A busy opening, trimmed on a phone so the frame rate stays honest. */
var COUNT = OPT.count || (IS_TOUCH ? 7 : 17);
var WALK  = OPT.speed || 0.92;          // metres per second, an unhurried pace
var FAR   = 46;                          // beyond this they are not drawn

var G, THREE, scene, SLOTS, LAY, walkable;
var people = [], clock = 0;

/* ---------- palettes ----------
   Muted and warm, so nobody out-dresses the artwork. */
var SKIN   = [0x8d5524,0xa9704a,0xc68642,0x7b4a2b,0xe0ac69,0x9c6644];
var HAIR   = [0x140f0c,0x1d1512,0x2b1d16,0x0f0c0a,0x3a2418];
var CLOTH  = [0x4a5b6b,0x7d4b52,0x5d6b52,0x6b5d7d,0x8a6a4a,0x3f4a5a,
              0x94705a,0x556b66,0x7a5f7a,0x6d7a5c,0xa3785c,0x4a5f52];
var LOWER  = [0x2b2a2e,0x3a3632,0x24262b,0x33302c,0x2e2a26];
var pick = function(a){ return a[Math.floor(Math.random()*a.length)]; };
var rnd  = function(a,b){ return a + Math.random()*(b-a); };

/* =====================================================================
   BUILDING A FIGURE
   Every joint is a Group positioned at the joint itself, with the limb
   hung below it, so rotating the group swings the limb the way a real
   one swings — from the shoulder, not from the middle of the arm.
   ===================================================================== */
var geo = {};
function makeGeometry(){
  geo.head    = new THREE.SphereGeometry(1, 14, 12);
  geo.jaw     = new THREE.SphereGeometry(1, 12, 10);
  geo.neck    = new THREE.CylinderGeometry(1, 1, 1, 8);
  geo.torso   = new THREE.CylinderGeometry(1, 1, 1, 12);
  geo.limb    = new THREE.CylinderGeometry(1, 1, 1, 8);
  geo.joint   = new THREE.SphereGeometry(1, 8, 6);
  geo.foot    = new THREE.BoxGeometry(1, 1, 1);
  geo.skirt   = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true);
  geo.shadow  = new THREE.CircleGeometry(1, 16);
}
function part(g, mat, sx, sy, sz, x, y, z){
  var m = new THREE.Mesh(g, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x || 0, y || 0, z || 0);
  return m;
}
function joint(parent, x, y, z){
  var j = new THREE.Group();
  j.position.set(x, y, z);
  parent.add(j);
  return j;
}

function buildFigure(){
  var child  = Math.random() < 0.28;                 // it is a school show
  var h      = child ? rnd(1.12, 1.38) : rnd(1.55, 1.83);
  var drape  = !child && Math.random() < 0.45;       // a long garment rather than trousers
  var k      = h / 1.72;                             // everything scales off adult height

  var skin  = new THREE.MeshStandardMaterial({ color: pick(SKIN),  roughness: 0.82 });
  var hair  = new THREE.MeshStandardMaterial({ color: pick(HAIR),  roughness: 0.68 });
  var top   = new THREE.MeshStandardMaterial({ color: pick(CLOTH), roughness: 0.94 });
  var leg   = new THREE.MeshStandardMaterial({ color: drape ? top.color.getHex() : pick(LOWER), roughness: 0.93 });

  var root = new THREE.Group();

  /* a soft contact shadow, so nobody floats */
  var sh = part(geo.shadow, new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false
  }), 0.30 * k, 0.22 * k, 1, 0, 0.02, 0);
  sh.rotation.x = -Math.PI / 2;
  root.add(sh);

  var body = joint(root, 0, 0, 0);                   // carries the walking bob
  var hips = joint(body, 0, 0.92 * k, 0);

  /* ---- legs ---- */
  var legs = [];
  if (!drape) {
    [-1, 1].forEach(function(side){
      var hip  = joint(hips, side * 0.085 * k, 0, 0);
      hip.add(part(geo.limb, leg, 0.075 * k, 0.42 * k, 0.075 * k, 0, -0.21 * k, 0));
      var knee = joint(hip, 0, -0.42 * k, 0);
      knee.add(part(geo.joint, leg, 0.068 * k, 0.062 * k, 0.068 * k, 0, 0, 0));
      knee.add(part(geo.limb, leg, 0.062 * k, 0.40 * k, 0.062 * k, 0, -0.20 * k, 0));
      var ankle = joint(knee, 0, -0.40 * k, 0);
      ankle.add(part(geo.foot, new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 0.6 }),
        0.10 * k, 0.055 * k, 0.24 * k, 0, -0.03 * k, 0.05 * k));
      legs.push({ hip: hip, knee: knee, ankle: ankle });
    });
  } else {
    /* one long garment: a gently flaring column, with the feet just showing */
    var sk = part(geo.skirt, leg, 0.20 * k, 0.86 * k, 0.20 * k, 0, -0.43 * k, 0);
    sk.material = new THREE.MeshStandardMaterial({ color: leg.color.getHex(), roughness: 0.95, side: THREE.DoubleSide });
    hips.add(sk);
    hips.add(part(geo.torso, sk.material, 0.155 * k, 0.10 * k, 0.155 * k, 0, 0.02 * k, 0));
    [-1, 1].forEach(function(side){
      hips.add(part(geo.foot, new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 0.6 }),
        0.085 * k, 0.05 * k, 0.20 * k, side * 0.075 * k, -0.89 * k, 0.03 * k));
    });
  }

  /* ---- torso, neck, head ---- */
  var chest = joint(hips, 0, 0, 0);
  chest.add(part(geo.torso, top, 0.175 * k, 0.34 * k, 0.125 * k, 0, 0.17 * k, 0));
  chest.add(part(geo.torso, top, 0.152 * k, 0.12 * k, 0.115 * k, 0, 0.00 * k, 0));
  if (drape) {  /* a shawl falling from one shoulder */
    var dr = part(geo.torso, new THREE.MeshStandardMaterial({
      color: top.color.getHex(), roughness: 0.9, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
      0.19 * k, 0.30 * k, 0.14 * k, 0.03 * k, 0.18 * k, 0);
    dr.rotation.z = 0.08;
    chest.add(dr);
  }

  var neck = joint(chest, 0, 0.35 * k, 0);
  neck.add(part(geo.neck, skin, 0.048 * k, 0.07 * k, 0.048 * k, 0, 0.03 * k, 0));
  var head = joint(neck, 0, 0.08 * k, 0);
  head.add(part(geo.head, skin, 0.098 * k, 0.115 * k, 0.100 * k, 0, 0.09 * k, 0));
  head.add(part(geo.jaw,  skin, 0.082 * k, 0.070 * k, 0.088 * k, 0, 0.045 * k, 0.012 * k));
  /* hair: a cap, and for some a long fall down the back */
  head.add(part(geo.head, hair, 0.104 * k, 0.098 * k, 0.106 * k, 0, 0.108 * k, -0.004 * k));
  if (Math.random() < 0.5) {
    head.add(part(geo.torso, hair, 0.085 * k, 0.22 * k, 0.055 * k, 0, 0.01 * k, -0.055 * k));
  }

  /* ---- arms ---- */
  var arms = [];
  [-1, 1].forEach(function(side){
    var sh2 = joint(chest, side * 0.185 * k, 0.30 * k, 0);
    sh2.add(part(geo.joint, top, 0.055 * k, 0.05 * k, 0.055 * k, 0, 0, 0));
    sh2.add(part(geo.limb, top, 0.045 * k, 0.28 * k, 0.045 * k, 0, -0.14 * k, 0));
    var el = joint(sh2, 0, -0.28 * k, 0);
    el.add(part(geo.limb, skin, 0.039 * k, 0.26 * k, 0.039 * k, 0, -0.13 * k, 0));
    el.add(part(geo.joint, skin, 0.042 * k, 0.045 * k, 0.042 * k, 0, -0.27 * k, 0));
    arms.push({ shoulder: sh2, elbow: el, side: side });
  });

  return { root: root, body: body, hips: hips, chest: chest, neck: neck,
           head: head, arms: arms, legs: legs, k: k, child: child, drape: drape };
}

/* =====================================================================
   WHERE THEY GO
   Routing uses the building's own geometry: out of the room, along the
   passage, across the hall, and in through the next doorway. No figure
   ever walks through a wall because no figure ever takes a straight line
   between two rooms.
   ===================================================================== */
function roomOf(x, z){
  var R = LAY.radius;
  if (x * x + z * z < (R + 1) * (R + 1)) return 'winners';
  for (var i = 0; i < LAY.live.length; i++){
    var c = LAY.live[i], r = LAY.rooms[c];
    if (x > r.x1 - 1 && x < r.x2 + 1 && z > r.z1 - 1 && z < r.z2 + 1) return c;
  }
  return 'winners';
}
function hallDoor(cat){
  var R = LAY.radius;
  if (cat === 'junior') return { x: 0, z: R - 1.7 };
  if (cat === 'campus') return { x: 0, z: -(R - 1.7) };
  return { x: -(R - 1.7), z: 0 };
}
function passageMid(cat){
  var R = LAY.radius, r = LAY.rooms[cat];
  if (cat === 'junior') return { x: 0, z: (R + r.z1) / 2 };
  if (cat === 'campus') return { x: 0, z: (-R + r.z2) / 2 };
  return { x: (r.x2 - R) / 2, z: 0 };
}
function roomDoor(cat){
  var r = LAY.rooms[cat];
  if (cat === 'junior') return { x: 0, z: r.z1 + 1.7 };
  if (cat === 'campus') return { x: 0, z: r.z2 - 1.7 };
  return { x: r.x2 - 1.7, z: 0 };
}
function routeBetween(from, to){
  if (from === to) return [];
  var w = [];
  if (from !== 'winners'){ w.push(roomDoor(from), passageMid(from), hallDoor(from)); }
  if (to   !== 'winners'){ w.push(hallDoor(to),   passageMid(to),   roomDoor(to)); }
  return w;
}

/* a standing spot in front of a picture, far enough back to see it */
function viewingSpot(slot){
  for (var t = 0; t < 6; t++){
    var d   = rnd(2.0, 3.2);
    var lat = rnd(-0.75, 0.75);
    var x = slot.x + Math.sin(slot.rotY) * d + Math.cos(slot.rotY) * lat;
    var z = slot.z + Math.cos(slot.rotY) * d - Math.sin(slot.rotY) * lat;
    if (walkable(x, z)) return { x: x, z: z, slot: slot };
  }
  return null;
}
function chooseDestination(person){
  if (!SLOTS.length) return null;
  var here = roomOf(person.x, person.z);
  /* mostly linger in this room; now and then cross the building */
  var pool = (Math.random() < 0.88) ? SLOTS.filter(function(s){ return s.room === here; }) : SLOTS;
  if (!pool.length) pool = SLOTS;
  for (var t = 0; t < 10; t++){
    var slot = pool[Math.floor(Math.random() * pool.length)];
    if (person.slot === slot) continue;
    var spot = viewingSpot(slot);
    if (!spot) continue;
    var taken = people.some(function(p){
      return p !== person && p.target &&
             Math.abs(p.target.x - spot.x) < 0.85 && Math.abs(p.target.z - spot.z) < 0.85;
    });
    if (taken) continue;
    return spot;
  }
  return null;
}
function send(person){
  var spot = chooseDestination(person);
  if (!spot){ person.wait = rnd(2, 5); return; }
  person.target = spot;
  person.path = routeBetween(roomOf(person.x, person.z), roomOf(spot.x, spot.z));
  person.path.push({ x: spot.x, z: spot.z });
  person.state = 'walk';
}

/* =====================================================================
   MOVEMENT AND POSE
   ===================================================================== */
function turnTowards(person, ang, dt, rate){
  var d = ang - person.face;
  while (d >  Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  person.face += d * Math.min(1, dt * (rate || 4));
  person.fig.root.rotation.y = person.face;
}

function step(person, dt){
  var f = person.fig;

  if (person.state === 'wait'){
    person.wait -= dt;
    if (person.wait <= 0) send(person);
    return;
  }

  if (person.state === 'walk'){
    var wp = person.path[0];
    if (!wp){ arrive(person); return; }
    var dx = wp.x - person.x, dz = wp.z - person.z;
    var dist = Math.hypot(dx, dz);
    if (dist < 0.28){
      person.path.shift();
      if (!person.path.length) arrive(person);
      return;
    }
    /* keep a little air between people */
    var sx = 0, sz = 0;
    for (var i = 0; i < people.length; i++){
      var o = people[i];
      if (o === person) continue;
      var ox = person.x - o.x, oz = person.z - o.z;
      var od = Math.hypot(ox, oz);
      if (od > 0.001 && od < 0.85){ sx += ox / od * (0.85 - od); sz += oz / od * (0.85 - od); }
    }
    var ux = dx / dist + sx * 1.6, uz = dz / dist + sz * 1.6;
    var ul = Math.hypot(ux, uz) || 1;
    var sp = person.speed * dt;
    var nx = person.x + ux / ul * sp, nz = person.z + uz / ul * sp;

    if (walkable(nx, nz)){ person.x = nx; person.z = nz; }
    else if (walkable(person.x + ux / ul * sp, person.z)){ person.x += ux / ul * sp; }
    else if (walkable(person.x, person.z + uz / ul * sp)){ person.z += uz / ul * sp; }
    else { person.stuck = (person.stuck || 0) + dt; if (person.stuck > 1.2){ person.stuck = 0; send(person); } }

    turnTowards(person, Math.atan2(dx, dz), dt, 3.4);
    poseWalk(person, dt);
    return;
  }

  /* looking at a picture */
  person.wait -= dt;
  poseView(person, dt);
  if (person.wait <= 0) send(person);
}

function arrive(person){
  person.state = 'view';
  person.slot  = person.target ? person.target.slot : null;
  person.wait  = rnd(11, 34);                // how long a picture holds them
  person.phase = 0;
  person.glance = 0;
}

function poseWalk(person, dt){
  var f = person.fig, k = f.k;
  person.phase += dt * person.speed * 5.4;
  var p = person.phase, sw = Math.sin(p), sw2 = Math.sin(p + Math.PI);

  if (f.legs.length === 2){
    f.legs[0].hip.rotation.x  = sw * 0.46;
    f.legs[1].hip.rotation.x  = sw2 * 0.46;
    f.legs[0].knee.rotation.x = Math.max(0, -sw) * 0.78;
    f.legs[1].knee.rotation.x = Math.max(0, -sw2) * 0.78;
    f.legs[0].ankle.rotation.x = -f.legs[0].knee.rotation.x * 0.4;
    f.legs[1].ankle.rotation.x = -f.legs[1].knee.rotation.x * 0.4;
  } else {
    f.hips.rotation.x = sw * 0.05;           // the garment sways instead
  }
  f.arms[0].shoulder.rotation.x = sw2 * 0.40;
  f.arms[1].shoulder.rotation.x = sw  * 0.40;
  f.arms[0].elbow.rotation.x = -0.25 - Math.max(0, sw2) * 0.3;
  f.arms[1].elbow.rotation.x = -0.25 - Math.max(0, sw)  * 0.3;

  f.body.position.y  = Math.abs(Math.sin(p)) * 0.026 * k;
  f.chest.rotation.y = -sw * 0.07;           // the shoulders counter the hips
  f.hips.rotation.y  =  sw * 0.05;
  f.chest.rotation.x = 0.05;
  f.head.rotation.y  = Math.sin(clock * 0.6 + person.seed) * 0.18;
  f.head.rotation.x  = 0;
}

function poseView(person, dt){
  var f = person.fig, k = f.k, t = clock + person.seed * 7;

  /* face the picture squarely */
  if (person.slot){
    turnTowards(person, Math.atan2(person.slot.x - person.x, person.slot.z - person.z), dt, 2.2);
  }
  /* limbs settle */
  var ease = Math.min(1, dt * 3);
  if (f.legs.length === 2){
    f.legs.forEach(function(l){
      l.hip.rotation.x  += (0 - l.hip.rotation.x) * ease;
      l.knee.rotation.x += (0.04 - l.knee.rotation.x) * ease;
      l.ankle.rotation.x += (0 - l.ankle.rotation.x) * ease;
    });
  }
  f.arms.forEach(function(a){
    a.shoulder.rotation.x += (0.06 - a.shoulder.rotation.x) * ease;
    a.shoulder.rotation.z += (a.side * -0.07 - a.shoulder.rotation.z) * ease;
    a.elbow.rotation.x    += (-0.32 - a.elbow.rotation.x) * ease;
  });

  /* breathing, and the slow shift of weight from one foot to the other */
  var breathe = Math.sin(t * 1.5) * 0.010;
  f.chest.scale.set(1 + breathe, 1 + breathe * 0.5, 1 + breathe);
  var shift = Math.sin(t * 0.32) * 0.028;
  f.hips.position.x = shift * k;
  f.hips.rotation.z = -shift * 0.35;
  f.body.position.y += (0 - f.body.position.y) * ease;
  f.chest.rotation.y += (0 - f.chest.rotation.y) * ease;
  f.hips.rotation.y  += (0 - f.hips.rotation.y) * ease;
  f.chest.rotation.x += (0.02 - f.chest.rotation.x) * ease;

  /* the eyes travel across the picture, with the odd glance away */
  person.glance -= dt;
  if (person.glance <= 0){
    person.glance = rnd(2.5, 6);
    person.lookX = rnd(-0.30, 0.30);
    person.lookY = rnd(-0.12, 0.10);
    if (Math.random() < 0.18) person.lookX = rnd(-0.9, 0.9);   // looks at a neighbour
  }
  f.head.rotation.y += ((person.lookX || 0) - f.head.rotation.y) * Math.min(1, dt * 1.4);
  f.head.rotation.x += ((person.lookY || 0) - f.head.rotation.x) * Math.min(1, dt * 1.4);
}

/* =====================================================================
   SET-UP AND FRAME LOOP
   ===================================================================== */
function spawn(){
  var made = 0, guard = 0;
  while (made < COUNT && guard++ < COUNT * 20){
    var slot = SLOTS.length ? SLOTS[Math.floor(Math.random() * SLOTS.length)] : null;
    var spot = slot ? viewingSpot(slot) : null;
    if (!spot){
      /* no picture free: stand somewhere in the hall instead */
      var a = Math.random() * Math.PI * 2, r = rnd(2.5, LAY.radius - 1.5);
      spot = { x: Math.cos(a) * r, z: Math.sin(a) * r, slot: null };
      if (!walkable(spot.x, spot.z)) continue;
    }
    var fig = buildFigure();
    fig.root.position.set(spot.x, 0, spot.z);
    scene.add(fig.root);

    var person = {
      fig: fig, x: spot.x, z: spot.z, face: Math.random() * Math.PI * 2,
      speed: WALK * rnd(0.82, 1.18) * (fig.child ? 1.12 : 1),
      state: 'view', slot: spot.slot, target: spot,
      wait: rnd(1, 14), phase: Math.random() * 9, seed: Math.random() * 10,
      glance: 0, lookX: 0, lookY: 0
    };
    fig.root.rotation.y = person.face;
    people.push(person);
    made++;
  }
}

function tick(dt){
  if (!dt || dt > 0.25) dt = 0.016;
  clock += dt;
  var cam = G.camera;
  for (var i = 0; i < people.length; i++){
    var p = people[i];
    /* a figure far away is not drawn, and does not think */
    var far = Math.hypot(p.x - cam.position.x, p.z - cam.position.z) > FAR;
    p.fig.root.visible = !far;
    if (far) continue;
    step(p, dt);
    p.fig.root.position.x = p.x;
    p.fig.root.position.z = p.z;
  }
}

function init(){
  THREE    = G.THREE;
  scene    = G.scene;
  SLOTS    = G.SLOTS;
  LAY      = G.LAY;
  walkable = G.walkable;
  if (!THREE || !scene || !LAY) return;
  makeGeometry();
  spawn();
  G.tick = tick;
  G.people = people;
}

/* index.html publishes window.SHATOR once the building exists */
var tries = 0;
var wait = setInterval(function(){
  if (window.SHATOR && window.SHATOR.scene){ clearInterval(wait); G = window.SHATOR; init(); }
  else if (++tries > 200) clearInterval(wait);
}, 100);

})();
