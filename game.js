import * as THREE from "three";

// ============================================================
// RENDERER
// ============================================================
const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// ============================================================
// SCENE & CAMERA
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 600);

const camera = new THREE.PerspectiveCamera(
  65,
  innerWidth / innerHeight,
  0.1,
  2000,
);
camera.position.set(0, 8, -12);
camera.lookAt(0, 0, 0);

// ============================================================
// LIGHTS (Day/Night)
// ============================================================
const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.4);
sunLight.position.set(80, 150, 80);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -200;
sunLight.shadow.camera.right = 200;
sunLight.shadow.camera.top = 200;
sunLight.shadow.camera.bottom = -200;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 500;
scene.add(sunLight);

const ambient = new THREE.AmbientLight(0x8899bb, 0.6);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0x88bbff, 0x334422, 0.5);
scene.add(hemi);

// Visible sun
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(15, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xffee88 }),
);
scene.add(sunMesh);

// ============================================================
// LOGO TEXTURE (for billboards)
// ============================================================
let logoTexture = null;
const logoLoader = new THREE.TextureLoader();
logoLoader.load(
  "logo.png",
  (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    logoTexture = tex;
    console.log("✅ Logo loaded — billboards will use it");
  },
  undefined,
  () => {
    console.warn("⚠️ logo.png not found — billboards will be blank");
  },
);

// ============================================================
// GROUND (Grass)
// ============================================================
const grassCanvas = document.createElement("canvas");
grassCanvas.width = grassCanvas.height = 256;
{
  const ctx = grassCanvas.getContext("2d");
  ctx.fillStyle = "#4a6e35";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `hsl(${80 + Math.random() * 40}, ${30 + Math.random() * 30}%, ${20 + Math.random() * 30}%)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
}
const grassTex = new THREE.CanvasTexture(grassCanvas);
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(80, 80);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1200, 1200),
  new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ============================================================
// ROADS
// ============================================================
const ROAD_W = 14;
const BLOCK = 60;
const RANGE = 3;
const ROAD_LIMIT = BLOCK * RANGE + 20;

const roadMat = new THREE.MeshStandardMaterial({
  color: 0x2a2a2a,
  roughness: 0.9,
});

for (let i = -RANGE; i <= RANGE; i++) {
  const h = new THREE.Mesh(
    new THREE.PlaneGeometry(BLOCK * (RANGE * 2 + 1) + ROAD_W, ROAD_W),
    roadMat,
  );
  h.rotation.x = -Math.PI / 2;
  h.position.set(0, 0.02, i * BLOCK);
  h.receiveShadow = true;
  scene.add(h);

  const v = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_W, BLOCK * (RANGE * 2 + 1) + ROAD_W),
    roadMat,
  );
  v.rotation.x = -Math.PI / 2;
  v.position.set(i * BLOCK, 0.02, 0);
  v.receiveShadow = true;
  scene.add(v);
}

// Road center lines
const lineMat = new THREE.MeshStandardMaterial({
  color: 0xffcc00,
  emissive: 0x442200,
});
for (let i = -RANGE; i <= RANGE; i++) {
  for (let j = -RANGE * 4; j < RANGE * 4; j++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(j * 6 + 3, 0.03, i * BLOCK);
    scene.add(dash);

    const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.3), lineMat);
    dash2.rotation.x = -Math.PI / 2;
    dash2.position.set(i * BLOCK, 0.03, j * 6 + 3);
    scene.add(dash2);
  }
}

// ============================================================
// BUILDINGS with windows + logo billboards
// ============================================================
function makeBuildingTexture(baseColor, floors, cols) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d");

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, c.width, c.height);

  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
  }

  const mx = 22,
    my = 30;
  const wW = (c.width - mx * 2) / cols;
  const wH = (c.height - my * 2) / floors;

  for (let r = 0; r < floors; r++) {
    for (let col = 0; col < cols; col++) {
      const x = mx + col * wW + 4;
      const y = my + r * wH + 4;
      const w = wW - 8;
      const h = wH - 8;

      const isLit = Math.random() > 0.45;
      ctx.fillStyle = isLit
        ? `hsl(${40 + Math.random() * 20}, 90%, ${60 + Math.random() * 20}%)`
        : `hsl(210, 40%, ${18 + Math.random() * 15}%)`;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x, y, w * 0.35, h);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

const collisionBoxes = [];

// ===== Billboard with logo =====
function addBillboard(parent, x, y, z, w, h, rotY = 0) {
  if (!logoTexture) return;

  // Dark backing panel
  const bgMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a,
    emissive: 0x001133,
    emissiveIntensity: 0.4,
    roughness: 0.5,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.1, h * 1.2), bgMat);
  bg.position.set(x, y, z);
  bg.rotation.y = rotY;
  bg.position.x += Math.sin(rotY) * 0.02;
  bg.position.z += Math.cos(rotY) * 0.02;
  parent.add(bg);

  // Logo image
  const logoMat = new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), logoMat);
  logo.position.set(x, y, z);
  logo.rotation.y = rotY;
  logo.position.x += Math.sin(rotY) * 0.08;
  logo.position.z += Math.cos(rotY) * 0.08;
  parent.add(logo);

  // Neon glow light
  const glow = new THREE.PointLight(0x00aaff, 2, 25);
  glow.position.set(x + Math.sin(rotY) * 1.2, y, z + Math.cos(rotY) * 1.2);
  parent.add(glow);
}

function createBuilding(x, z, w, d, h) {
  const group = new THREE.Group();

  const hue = 200 + Math.random() * 60;
  const baseColor = `hsl(${hue}, ${10 + Math.random() * 15}%, ${35 + Math.random() * 20}%)`;

  const floors = Math.max(3, Math.floor(h / 3));
  const cols = Math.max(3, Math.floor(w / 2));
  const tex = makeBuildingTexture(baseColor, floors, cols);

  const faceMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.85,
    metalness: 0.15,
  });
  const sideMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.9,
  });

  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [
    faceMat,
    faceMat,
    sideMat,
    sideMat,
    faceMat,
    faceMat,
  ]);
  box.position.y = h / 2;
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  // Roof details
  for (let i = 0; i < 2; i++) {
    const rw = 1 + Math.random() * 2;
    const rh = 0.5 + Math.random();
    const rd = 1 + Math.random() * 2;
    const roofBox = new THREE.Mesh(
      new THREE.BoxGeometry(rw, rh, rd),
      new THREE.MeshStandardMaterial({ color: 0x555555 }),
    );
    roofBox.position.set(
      (Math.random() - 0.5) * (w - rw - 1),
      h + rh / 2,
      (Math.random() - 0.5) * (d - rd - 1),
    );
    roofBox.castShadow = true;
    group.add(roofBox);
  }

  // ===== Billboard with logo (30% chance) =====
  if (Math.random() < 0.35 && h > 15) {
    const billW = Math.min(w * 0.75, 7);
    const billH = Math.min(h * 0.28, 4.5);

    // Front face (Z+)
    addBillboard(group, 0, h * 0.6, d / 2 + 0.06, billW, billH, 0);

    // Back face (Z-) — 50% chance
    if (Math.random() < 0.5) {
      addBillboard(group, 0, h * 0.6, -d / 2 - 0.06, billW, billH, Math.PI);
    }

    // Side face (X) — 40% chance
    if (Math.random() < 0.4) {
      const sideSign = Math.random() < 0.5 ? 1 : -1;
      addBillboard(
        group,
        sideSign * (w / 2 + 0.06),
        h * 0.6,
        0,
        Math.min(d * 0.75, 7),
        billH,
        sideSign > 0 ? Math.PI / 2 : -Math.PI / 2,
      );
    }
  }

  group.position.set(x, 0, z);
  scene.add(group);

  collisionBoxes.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
  });
}

// Generate buildings
const HALF_BLOCK = (BLOCK - ROAD_W) / 2 - 2;

for (let bx = -RANGE; bx < RANGE; bx++) {
  for (let bz = -RANGE; bz < RANGE; bz++) {
    const cx = bx * BLOCK + BLOCK / 2;
    const cz = bz * BLOCK + BLOCK / 2;

    const numB = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numB; i++) {
      const w = 8 + Math.random() * 10;
      const d = 8 + Math.random() * 10;
      const h = 12 + Math.random() * 45;

      const px = cx + (Math.random() - 0.5) * (HALF_BLOCK * 2 - w);
      const pz = cz + (Math.random() - 0.5) * (HALF_BLOCK * 2 - d);

      if (Math.abs(px) < 15 && Math.abs(pz) < 15) continue;
      createBuilding(px, pz, w, d, h);
    }
  }
}

// ============================================================
// TREES
// ============================================================
function createTree() {
  const g = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1e, roughness: 1 }),
  );
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6b2d,
    roughness: 1,
  });
  [
    { r: 2.2, y: 3.5 },
    { r: 1.8, y: 4.8 },
    { r: 1.3, y: 6.0 },
  ].forEach((s) => {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(s.r, 2, 8), leafMat);
    leaf.position.y = s.y;
    leaf.castShadow = true;
    g.add(leaf);
  });
  return g;
}

for (let bx = -RANGE; bx < RANGE; bx++) {
  for (let bz = -RANGE; bz < RANGE; bz++) {
    const cx = bx * BLOCK + BLOCK / 2;
    const cz = bz * BLOCK + BLOCK / 2;
    const numT = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numT; i++) {
      const tx = cx + (Math.random() - 0.5) * HALF_BLOCK * 1.8;
      const tz = cz + (Math.random() - 0.5) * HALF_BLOCK * 1.8;
      if (Math.abs(tx) < 15 && Math.abs(tz) < 15) continue;
      const t = createTree();
      t.position.set(tx, 0, tz);
      t.rotation.y = Math.random() * Math.PI * 2;
      scene.add(t);
      collisionBoxes.push({
        minX: tx - 0.6,
        maxX: tx + 0.6,
        minZ: tz - 0.6,
        maxZ: tz + 0.6,
      });
    }
  }
}

// ============================================================
// PLAYER CAR
// ============================================================
function buildCar(color) {
  const g = new THREE.Group();

  // ✅ নতুন করে প্রতিবার ম্যাটেরিয়াল তৈরি হচ্ছে — এতে রঙ কাজ করবে
  const paint = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.9,
    roughness: 0.25,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.6,
    metalness: 0.4,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x101820,
    metalness: 1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.65,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffdd,
    emissiveIntensity: 2.5,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0xff0000,
    emissiveIntensity: 2,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 1,
    roughness: 0.1,
  });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.4), paint);
  body.position.y = 0.75;
  body.castShadow = true;
  g.add(body);

  // Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 1.0), paint);
  hood.position.set(0, 0.95, 1.55);
  hood.castShadow = true;
  g.add(hood);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.65, 1.9), paint);
  cabin.position.set(0, 1.35, -0.35);
  cabin.castShadow = true;
  g.add(cabin);

  // Windows
  const windF = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 0.05), glass);
  windF.position.set(0, 1.35, 0.62);
  windF.rotation.x = -0.25;
  g.add(windF);

  const windB = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 0.05), glass);
  windB.position.set(0, 1.35, -1.3);
  windB.rotation.x = 0.25;
  g.add(windB);

  const windL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 1.7), glass);
  windL.position.set(-0.88, 1.35, -0.35);
  g.add(windL);

  const windR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 1.7), glass);
  windR.position.set(0.88, 1.35, -0.35);
  g.add(windR);

  // Lights
  const hlGeo = new THREE.BoxGeometry(0.5, 0.22, 0.1);
  const hl1 = new THREE.Mesh(hlGeo, lightMat);
  hl1.position.set(-0.65, 0.85, 2.22);
  g.add(hl1);
  const hl2 = new THREE.Mesh(hlGeo, lightMat);
  hl2.position.set(0.65, 0.85, 2.22);
  g.add(hl2);

  const tlGeo = new THREE.BoxGeometry(0.5, 0.2, 0.08);
  const tl1 = new THREE.Mesh(tlGeo, tailMat);
  tl1.position.set(-0.65, 0.85, -2.22);
  g.add(tl1);
  const tl2 = new THREE.Mesh(tlGeo, tailMat);
  tl2.position.set(0.65, 0.85, -2.22);
  g.add(tl2);

  // Spoiler
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.35), dark);
  spoiler.position.set(0, 1.15, -2.15);
  g.add(spoiler);

  // Wheels
  const wheels = [];
  [
    [-1.05, 0.42, 1.4],
    [1.05, 0.42, 1.4],
    [-1.05, 0.42, -1.4],
    [1.05, 0.42, -1.4],
  ].forEach((pos) => {
    const wheel = new THREE.Group();

    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 }),
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheel.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.34, 12),
      chrome,
    );
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);

    wheel.position.set(...pos);
    g.add(wheel);
    wheels.push(wheel);
  });

  // Headlight beam
  const beam = new THREE.SpotLight(0xffeecc, 0, 45, Math.PI / 6, 0.4, 1);
  beam.position.set(0, 0.9, 2.2);
  beam.target.position.set(0, 0.5, 25);
  g.add(beam);
  g.add(beam.target);

  g.userData = { wheels, beam };
  return g;
}

// ============================================================
// AI TRAFFIC
// ============================================================
function buildAICar(color) {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.6, 4.0),
    new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.4 }),
  );
  body.position.y = 0.7;
  body.castShadow = true;
  g.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.55, 1.8),
    new THREE.MeshStandardMaterial({
      color: 0x0a1015,
      metalness: 1,
      roughness: 0.1,
    }),
  );
  cabin.position.set(0, 1.25, -0.2);
  cabin.castShadow = true;
  g.add(cabin);

  const wm = new THREE.MeshStandardMaterial({ color: 0x111111 });
  [
    [-1, 0.4, 1.3],
    [1, 0.4, 1.3],
    [-1, 0.4, -1.3],
    [1, 0.4, -1.3],
  ].forEach((p) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 14), wm);
    w.rotation.z = Math.PI / 2;
    w.position.set(...p);
    w.castShadow = true;
    g.add(w);
  });
  return g;
}

const trafficCars = [];
const trafficColors = [
  0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xffffff, 0x000000, 0xff8800,
  0xaa44ff,
];

for (let i = 0; i < 25; i++) {
  const car = buildAICar(
    trafficColors[Math.floor(Math.random() * trafficColors.length)],
  );
  const isHoriz = Math.random() > 0.5;
  const dir = Math.random() > 0.5 ? 1 : -1;
  const laneOffset = ROAD_W / 4;

  if (isHoriz) {
    const z =
      (Math.floor(Math.random() * (RANGE * 2 + 1)) - RANGE) * BLOCK +
      laneOffset * dir;
    const x = (Math.random() - 0.5) * BLOCK * RANGE * 2;
    car.position.set(x, 0, z);
    car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    car.userData = { isHoriz: true, dir, speed: 10 + Math.random() * 8 };
  } else {
    const x =
      (Math.floor(Math.random() * (RANGE * 2 + 1)) - RANGE) * BLOCK -
      laneOffset * dir;
    const z = (Math.random() - 0.5) * BLOCK * RANGE * 2;
    car.position.set(x, 0, z);
    car.rotation.y = dir > 0 ? 0 : Math.PI;
    car.userData = { isHoriz: false, dir, speed: 10 + Math.random() * 8 };
  }
  scene.add(car);
  trafficCars.push(car);
}

function updateTraffic(dt) {
  for (const car of trafficCars) {
    const d = car.userData;
    if (d.isHoriz) {
      car.position.x += d.dir * d.speed * dt;
      if (car.position.x > ROAD_LIMIT) car.position.x = -ROAD_LIMIT;
      if (car.position.x < -ROAD_LIMIT) car.position.x = ROAD_LIMIT;
    } else {
      car.position.z += d.dir * d.speed * dt;
      if (car.position.z > ROAD_LIMIT) car.position.z = -ROAD_LIMIT;
      if (car.position.z < -ROAD_LIMIT) car.position.z = ROAD_LIMIT;
    }
  }
}

// ============================================================
// PEOPLE
// ============================================================
function buildPerson() {
  const g = new THREE.Group();

  const skinColors = [0xffcc99, 0xdd9966, 0x885522, 0xffe0bd, 0xc68642];
  const shirtColors = [
    0xff4444, 0x4488ff, 0x44cc44, 0xffcc00, 0xff44cc, 0xffffff, 0x222222,
    0xaa66ff,
  ];
  const pantColors = [0x223355, 0x333333, 0x553322, 0x666666, 0x1a1a2e];
  const hairColors = [0x1a1a1a, 0x3a2a1a, 0x000000, 0x5a3a1a, 0xaa7744];

  const skin = new THREE.MeshStandardMaterial({
    color: skinColors[Math.floor(Math.random() * skinColors.length)],
    roughness: 0.85,
  });
  const shirt = new THREE.MeshStandardMaterial({
    color: shirtColors[Math.floor(Math.random() * shirtColors.length)],
    roughness: 0.9,
  });
  const pant = new THREE.MeshStandardMaterial({
    color: pantColors[Math.floor(Math.random() * pantColors.length)],
    roughness: 0.9,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColors[Math.floor(Math.random() * hairColors.length)],
    roughness: 1,
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), skin);
  head.position.y = 1.65;
  head.castShadow = true;
  g.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    hairMat,
  );
  hair.position.y = 1.68;
  g.add(hair);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.24), shirt);
  torso.position.y = 1.15;
  torso.castShadow = true;
  g.add(torso);

  const armGeo = new THREE.BoxGeometry(0.14, 0.6, 0.14);
  const armL = new THREE.Mesh(armGeo, shirt);
  armL.position.set(-0.3, 1.15, 0);
  armL.castShadow = true;
  g.add(armL);

  const armR = new THREE.Mesh(armGeo, shirt);
  armR.position.set(0.3, 1.15, 0);
  armR.castShadow = true;
  g.add(armR);

  const legGeo = new THREE.BoxGeometry(0.17, 0.85, 0.17);
  const legL = new THREE.Mesh(legGeo, pant);
  legL.position.set(-0.12, 0.43, 0);
  legL.castShadow = true;
  g.add(legL);

  const legR = new THREE.Mesh(legGeo, pant);
  legR.position.set(0.12, 0.43, 0);
  legR.castShadow = true;
  g.add(legR);

  g.userData.limbs = { armL, armR, legL, legR };
  return g;
}

const people = [];
for (let i = 0; i < 50; i++) {
  const p = buildPerson();
  const isHoriz = Math.random() > 0.5;
  const side = Math.random() > 0.5 ? 1 : -1;
  const offset = ROAD_W / 2 + 2;

  if (isHoriz) {
    const z =
      (Math.floor(Math.random() * (RANGE * 2 + 1)) - RANGE) * BLOCK +
      offset * side;
    const x = (Math.random() - 0.5) * BLOCK * RANGE * 1.6;
    p.position.set(x, 0, z);
  } else {
    const x =
      (Math.floor(Math.random() * (RANGE * 2 + 1)) - RANGE) * BLOCK +
      offset * side;
    const z = (Math.random() - 0.5) * BLOCK * RANGE * 1.6;
    p.position.set(x, 0, z);
  }

  const dir = Math.random() > 0.5 ? 1 : -1;
  p.rotation.y = isHoriz
    ? dir > 0
      ? Math.PI / 2
      : -Math.PI / 2
    : dir > 0
      ? 0
      : Math.PI;

  p.userData = {
    speed: 1.2 + Math.random() * 1.2,
    dir,
    isHoriz,
    walkPhase: Math.random() * Math.PI * 2,
    limbs: p.userData.limbs,
  };

  scene.add(p);
  people.push(p);
}

function updatePeople(dt) {
  const limit = ROAD_LIMIT;
  for (const p of people) {
    const d = p.userData;

    if (d.isHoriz) p.position.x += d.dir * d.speed * dt;
    else p.position.z += d.dir * d.speed * dt;

    if (d.isHoriz && (p.position.x > limit || p.position.x < -limit)) {
      d.dir *= -1;
      p.rotation.y += Math.PI;
    }
    if (!d.isHoriz && (p.position.z > limit || p.position.z < -limit)) {
      d.dir *= -1;
      p.rotation.y += Math.PI;
    }

    d.walkPhase += dt * d.speed * 6;
    const swing = Math.sin(d.walkPhase) * 0.5;
    const l = d.limbs;
    l.armL.rotation.x = swing;
    l.armR.rotation.x = -swing;
    l.legL.rotation.x = -swing;
    l.legR.rotation.x = swing;

    p.position.y = Math.abs(Math.sin(d.walkPhase)) * 0.05;
  }
}

// ============================================================
// CAR TYPES
// ============================================================
const carTypes = [
  { name: "Crimson GT", color: 0xff2233, top: 32, handling: 1.05, accel: 32 },
  { name: "Ocean Racer", color: 0x2277ff, top: 30, handling: 1.1, accel: 30 },
  { name: "Neon Green", color: 0x22dd55, top: 31, handling: 1.05, accel: 31 },
  { name: "Solar Flare", color: 0xffcc00, top: 34, handling: 0.95, accel: 34 },
  { name: "Violet Storm", color: 0x9933ff, top: 31, handling: 1.08, accel: 31 },
  { name: "Tangerine", color: 0xff7700, top: 32, handling: 1.02, accel: 33 },
  {
    name: "Phantom White",
    color: 0xf0f0f0,
    top: 30,
    handling: 1.15,
    accel: 30,
  },
  { name: "Onyx", color: 0x0a0a0a, top: 33, handling: 1.0, accel: 33 },
  { name: "Rose Gold", color: 0xff66aa, top: 29, handling: 1.2, accel: 29 },
  { name: "Cyan Wave", color: 0x00cccc, top: 31, handling: 1.1, accel: 31 },
  { name: "Silver Arrow", color: 0xcccccc, top: 32, handling: 1.05, accel: 32 },
  { name: "Golden King", color: 0xffaa00, top: 34, handling: 0.98, accel: 34 },
];

let selectedCar = carTypes[0];
let playerCar = null;

// ============================================================
// MENU
// ============================================================
const carListEl = document.getElementById("carList");
carTypes.forEach((ct, i) => {
  const card = document.createElement("div");
  card.className = "carCard" + (i === 0 ? " selected" : "");
  const hex = "#" + ct.color.toString(16).padStart(6, "0");
  card.innerHTML = `
    <div class="swatch" style="background:${hex}"></div>
    <div><b>${ct.name}</b></div>
    <div style="font-size:11px;opacity:0.7">Top ${ct.top} • H ${ct.handling.toFixed(2)}</div>
  `;
  card.onclick = () => {
    document
      .querySelectorAll(".carCard")
      .forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedCar = ct;
    console.log("🚗 Selected:", ct.name, "| color:", ct.color.toString(16));
  };
  carListEl.appendChild(card);
});

document.getElementById("startBtn").onclick = () => {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");

  // পুরনো কার সরান + মেমরি পরিষ্কার
  if (playerCar) {
    scene.remove(playerCar);
    playerCar.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material))
          obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    playerCar = null;
  }

  // নতুন কার তৈরি
  playerCar = buildCar(selectedCar.color);
  playerCar.position.set(0, 0, 0);
  scene.add(playerCar);

  // কার স্টেট রিসেট
  carState.pos.set(0, 0, 0);
  carState.heading = 0;
  carState.speed = 0;
  carState.steerAngle = 0;

  console.log(
    "✅ Car created | color:",
    selectedCar.color.toString(16),
    "| name:",
    selectedCar.name,
  );
};

// ============================================================
// CONTROLS
// ============================================================
const keys = { up: false, down: false, left: false, right: false };

const km = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

addEventListener("keydown", (e) => {
  if (km[e.key]) keys[km[e.key]] = true;
});
addEventListener("keyup", (e) => {
  if (km[e.key]) keys[km[e.key]] = false;
});

const isTouch = matchMedia("(pointer: coarse)").matches;
if (isTouch)
  document.getElementById("mobileControls").classList.remove("hidden");

function bindBtn(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  const down = (e) => {
    e.preventDefault();
    keys[key] = true;
  };
  const up = (e) => {
    e.preventDefault();
    keys[key] = false;
  };
  el.addEventListener("touchstart", down, { passive: false });
  el.addEventListener("touchend", up, { passive: false });
  el.addEventListener("touchcancel", up, { passive: false });
  el.addEventListener("mousedown", down);
  el.addEventListener("mouseup", up);
  el.addEventListener("mouseleave", up);
}
bindBtn("leftBtn", "left");
bindBtn("rightBtn", "right");
bindBtn("gasBtn", "up");
bindBtn("brakeBtn", "down");

// ============================================================
// CAR STATE & UPDATE
// ============================================================
const carState = {
  pos: new THREE.Vector3(0, 0, 0),
  heading: 0,
  speed: 0,
  steerAngle: 0,
  wheelSpin: 0,
};

function updatePlayer(dt) {
  if (!playerCar) return;
  const s = carState;
  const topSpeed = selectedCar.top;
  const accel = selectedCar.accel;

  if (keys.up) s.speed += accel * dt;
  else if (keys.down) s.speed -= accel * 0.9 * dt;
  else {
    const fric = 12 * dt;
    if (Math.abs(s.speed) < fric) s.speed = 0;
    else s.speed -= Math.sign(s.speed) * fric;
  }

  s.speed = Math.max(-topSpeed * 0.4, Math.min(topSpeed, s.speed));

  const steerInput = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
  const maxSteer = 0.6 * selectedCar.handling;
  s.steerAngle += (steerInput * maxSteer - s.steerAngle) * Math.min(1, dt * 8);

  const speedFactor = Math.min(1, Math.abs(s.speed) / 8);
  s.heading += s.steerAngle * speedFactor * 2.2 * dt * Math.sign(s.speed || 1);

  const fx = Math.sin(s.heading);
  const fz = Math.cos(s.heading);
  s.pos.x += fx * s.speed * dt;
  s.pos.z += fz * s.speed * dt;

  const B = 400;
  s.pos.x = Math.max(-B, Math.min(B, s.pos.x));
  s.pos.z = Math.max(-B, Math.min(B, s.pos.z));

  const pad = 1.5;
  for (const b of collisionBoxes) {
    if (
      s.pos.x + pad > b.minX &&
      s.pos.x - pad < b.maxX &&
      s.pos.z + pad > b.minZ &&
      s.pos.z - pad < b.maxZ
    ) {
      s.pos.x -= fx * Math.abs(s.speed) * dt * 2;
      s.pos.z -= fz * Math.abs(s.speed) * dt * 2;
      s.speed *= -0.25;
      break;
    }
  }

  playerCar.position.set(s.pos.x, 0, s.pos.z);
  playerCar.rotation.y = s.heading;

  s.wheelSpin += s.speed * dt * 2;
  const wheels = playerCar.userData.wheels;
  wheels.forEach((w) => {
    w.rotation.x = s.wheelSpin;
  });
  wheels[0].rotation.y = s.steerAngle * 0.6;
  wheels[1].rotation.y = s.steerAngle * 0.6;

  const beam = playerCar.userData.beam;
  const dayAmt = Math.max(0, Math.sin(dayTime * Math.PI * 2));
  if (beam) beam.intensity = dayAmt < 0.15 ? 60 : 0;

  const camBack = 9;
  const camHeight = 4.5;
  const idealPos = new THREE.Vector3(
    s.pos.x - fx * camBack,
    camHeight,
    s.pos.z - fz * camBack,
  );
  camera.position.lerp(idealPos, 0.12);

  const lookAt = new THREE.Vector3(s.pos.x + fx * 4, 1.3, s.pos.z + fz * 4);
  camera.lookAt(lookAt);

  document.getElementById("speedVal").textContent = Math.round(
    Math.abs(s.speed) * 3.6,
  );
}

// ============================================================
// DAY / NIGHT
// ============================================================
let dayTime = 0.25;
const dayCycleSpeed = 0.0015;

const dayTopColor = new THREE.Color(0x1a5fb4);
const nightTopColor = new THREE.Color(0x050818);

function updateDayNight(dt) {
  dayTime = (dayTime + dt * dayCycleSpeed) % 1;
  const angle = dayTime * Math.PI * 2 - Math.PI / 2;
  const sunX = Math.cos(angle) * 400;
  const sunY = Math.sin(angle) * 400;
  const sunZ = Math.sin(angle * 0.6) * 150;

  sunLight.position.set(sunX, Math.max(sunY, 5), sunZ);
  sunMesh.position.set(sunX, sunY, sunZ);

  const dayAmt = Math.max(0, Math.sin(dayTime * Math.PI * 2));
  sunLight.intensity = dayAmt * 1.6 + 0.05;
  ambient.intensity = 0.15 + dayAmt * 0.55;
  hemi.intensity = 0.1 + dayAmt * 0.5;

  const skyColor = nightTopColor.clone().lerp(dayTopColor, dayAmt);
  scene.background.copy(skyColor);
  scene.fog.color.copy(skyColor);

  const timeEl = document.getElementById("timeHud");
  if (timeEl) timeEl.textContent = dayAmt > 0.15 ? "☀️ Day" : "🌙 Night";
}

// ============================================================
// RESIZE
// ============================================================
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ============================================================
// MAIN LOOP
// ============================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  updateDayNight(dt);
  updateTraffic(dt);
  updatePeople(dt);
  updatePlayer(dt);

  renderer.render(scene, camera);
}
animate();

// Show menu after splash
setTimeout(() => {
  document.getElementById("menu").classList.remove("hidden");
}, 4200);
