import * as THREE from "three";

/**
 * GENHEX honeycomb field: beveled hexagonal prisms (one InstancedMesh) whose
 * height, colour and lit cluster — and the camera — are a pure function of
 * scroll progress. Nothing animates on its own: when progress, pointer and
 * the one-off assemble intro are all settled, frames are skipped entirely.
 */
export type SceneMode = "hero" | "journey";

export interface SceneProgress {
  /** 0..1 progress through the narrative (hero: scrolled away; journey: sticky track). */
  p: number;
  /** 0..1 assembly (journey: section entering). Hero runs its own short intro. */
  asm: number;
}

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  mode: SceneMode;
  rings: number;
  dpr: number;
  antialias: boolean;
  /** +1: cluster sits on the right (LTR text on the left); -1 mirrored (RTL). */
  side: 1 | -1;
  progress: { current: SceneProgress };
  onContextLost?: () => void;
}

export interface SceneHandle {
  start(): void;
  stop(): void;
  resize(): void;
  setPointer(x: number, y: number): void;
  dispose(): void;
}

const SLATES = [0x343d46, 0x374049, 0x313a43];
const CYAN = 0x00b6bf;
const R = 1; // hex circumradius
const SQ3 = Math.sqrt(3);

interface Cell {
  q: number;
  r: number;
  u: number; // q + r/2 (row-relative column)
  d: number; // hex distance from centre
  dn: number; // d / rings
  x: number;
  z: number;
  hash: number;
  accent: boolean;
  base: THREE.Color;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Target [height, lit] of a cell for narrative step 0..3 (Learn, Practice, Prove, Certificate). */
function pattern(step: number, c: Cell): [number, number] {
  const base = 0.45 + c.hash * 0.45;
  switch (step) {
    case 0: // a stepped dome: knowledge accumulating
      if (c.d <= 3) return [0.8 + (4 - c.d) * 0.8, c.d <= 2 ? 1 - c.d * 0.2 : 0.18];
      return [base, 0];
    case 1: // rows of "code" with a cursor at the end
      if (c.r % 2 === 0 && Math.abs(c.r) <= 2 && Math.abs(c.u) <= 3) {
        return [1.3 + (c.u + 3) * 0.12, c.u === 3 ? 1 : 0.8];
      }
      return [base * 0.9, 0];
    case 2: // a target ring around a raised score cell, with a sunken moat
      if (c.d === 0) return [3.4, 1];
      if (c.d === 3) return [2.1, 0.9];
      if (c.d <= 2) return [0.25, 0.06];
      return [base, 0];
    default: // the certificate badge: stacked hexagonal medal
      if (c.d === 0) return [3.9, 1];
      if (c.d === 1) return [2.5, 0.85];
      if (c.d === 2) return [1.5, 0.45];
      return [base * 1.15, 0];
  }
}

// Camera keyframes per step: position (before distance scaling) and look target.
const CAM: Array<[number[], number[]]> = [
  [[0, 15, 16], [0, 1, 0]],
  [[10, 11, 11], [0, 1, 0]],
  [[-9, 9, 12], [0, 1.6, 0]],
  [[0, 21, 4.5], [0, 1.8, 0]],
];

export function createScene(opts: SceneOptions): SceneHandle {
  const { canvas, mode, rings, side, progress } = opts;
  const hero = mode === "hero";

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: opts.antialias,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(opts.dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x313a43, 22, 52);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);

  // Lights: soft sky fill, a white key, a cyan rim and a cyan point that follows the lit cluster.
  scene.add(new THREE.HemisphereLight(0xcfe9ee, 0x2a3138, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(6, 16, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(CYAN, 1.4);
  rim.position.set(-10, 6, -12);
  scene.add(rim);
  const glow = new THREE.PointLight(CYAN, 90, 26, 2);
  glow.position.set(0, 5, 0);
  scene.add(glow);

  // One beveled hex prism, extruded up +Y, unit height, base at y = 0.
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i + 30);
    const px = Math.cos(a) * R * 0.92;
    const py = Math.sin(a) * R * 0.92;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.9,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0.05, 0);

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.28,
    emissive: new THREE.Color(CYAN),
    emissiveIntensity: 0.32,
  });
  // Emissive only where the per-instance colour is cyan-ish (lit cells glow, slate does not).
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "vec3 totalEmissiveRadiance = emissive;",
      "vec3 totalEmissiveRadiance = emissive * smoothstep(0.08, 0.42, vColor.b - vColor.r);"
    );
  };

  // Cells
  const cells: Cell[] = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
      const h = Math.sin(q * 127.1 + r * 311.7) * 43758.5453;
      const hash = h - Math.floor(h);
      cells.push({
        q,
        r,
        u: q + r / 2,
        d,
        dn: d / rings,
        x: SQ3 * R * (q + r / 2),
        z: 1.5 * R * r,
        hash,
        accent: hash > 0.93 && d > 3,
        base: new THREE.Color(SLATES[Math.floor(hash * 997) % 3]),
      });
    }
  }
  const mesh = new THREE.InstancedMesh(geometry, material, cells.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const cyan = new THREE.Color(CYAN);
  const tmpColor = new THREE.Color();
  const dummy = new THREE.Object3D();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tgtPos = new THREE.Vector3();
  const tgtLook = new THREE.Vector3();

  const cur = { p: 0, asm: hero ? 0 : 0 };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let distScale = 1;
  let introStart = -1;
  let dirty = true;
  let raf = 0;
  let running = false;
  let last = 0;
  let disposed = false;

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep ~17 world units of the field visible horizontally on portrait screens.
    const baseDist = 22;
    const need = 17 / camera.aspect / (2 * Math.tan((camera.fov * Math.PI) / 360));
    distScale = Math.max(1.75, need / baseDist);
    if (w >= 900) camera.setViewOffset(w, h, -side * w * 0.17, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.14, w, h);
    const fog = scene.fog as THREE.Fog;
    fog.near = 20 * distScale;
    fog.far = 46 * distScale;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  function update(dt: number, now: number) {
    // Targets
    let tp = progress.current.p;
    let ta = progress.current.asm;
    if (hero) {
      if (introStart < 0) introStart = now;
      ta = clamp01((now - introStart) / 1900);
      tp = tp * 0.9;
    }
    const k = 1 - Math.exp(-dt * 7);
    const dp = tp - cur.p;
    const da = ta - cur.asm;
    cur.p += dp * k;
    cur.asm = hero ? ta : cur.asm + da * k;
    const px = ptr.tx - ptr.x;
    const py = ptr.ty - ptr.y;
    ptr.x += px * k * 0.6;
    ptr.y += py * k * 0.6;
    const settled =
      Math.abs(dp) < 1e-4 && Math.abs(da) < 1e-4 && Math.abs(px) < 1e-3 && Math.abs(py) < 1e-3 && (!hero || ta >= 1);
    if (settled && !dirty) return false;
    dirty = false;

    // Narrative position: s in 0..3 (hero stays near step 0 and drifts toward 1).
    const s = hero ? cur.p * 1.0 : clamp01((cur.p - 0.04) / 0.92) * 3;
    const i0 = Math.min(2, Math.floor(s));
    const f = s - i0;

    let cx = 0;
    let cz = 0;
    let cw = 0.0001;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      // Cells further from the centre change a touch later: a ripple, not a snap.
      const t = smooth(f * 1.5 - c.dn * 0.5);
      const [h0, l0] = pattern(i0, c);
      const [h1, l1] = pattern(i0 + 1, c);
      const hT = lerp(h0, h1, t);
      let lit = lerp(l0, l1, t);
      if (c.accent) lit = Math.max(lit, 0.4);

      // Assemble: cells rise from below in a ripple outward from the centre.
      const a = smooth(cur.asm * 1.8 - c.dn * 0.8);
      const hh = Math.max(0.04, hT * a);
      dummy.position.set(c.x, -(1 - a) * 6, c.z);
      dummy.scale.set(1, hh, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      tmpColor.copy(c.base).lerp(cyan, lit * a);
      mesh.setColorAt(i, tmpColor);

      const wgt = lit * a * hh;
      cx += c.x * wgt;
      cz += c.z * wgt;
      cw += wgt;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    glow.position.set(cx / cw, 5.5, cz / cw);
    glow.intensity = 45 + 25 * smooth(cur.asm);

    // Camera: interpolate keyframes with the same ripple-free ease, then parallax.
    if (hero) {
      const hp = smooth(cur.p / 0.9);
      tgtPos.set(lerp(0, 3, hp), lerp(15, 20, hp), lerp(17, 11, hp));
      tgtLook.set(0, 1, 0);
    } else {
      const kA = CAM[i0];
      const kB = CAM[i0 + 1];
      const e = smooth(f);
      tgtPos.set(lerp(kA[0][0], kB[0][0], e), lerp(kA[0][1], kB[0][1], e), lerp(kA[0][2], kB[0][2], e));
      tgtLook.set(lerp(kA[1][0], kB[1][0], e), lerp(kA[1][1], kB[1][1], e), lerp(kA[1][2], kB[1][2], e));
    }
    tgtPos.x += ptr.x * 1.4;
    tgtPos.y += ptr.y * -0.8;
    // Pull the camera back along its look vector for narrow viewports.
    camPos.copy(tgtLook).add(tgtPos.sub(tgtLook).multiplyScalar(distScale));
    camLook.copy(tgtLook);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    return true;
  }

  function frame(now: number) {
    if (!running || disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (update(dt, now)) renderer.render(scene, camera);
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  resize();
  update(0.016, performance.now());
  renderer.render(scene, camera);

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(canvas);

  return {
    start() {
      if (running || disposed) return;
      running = true;
      last = performance.now();
      dirty = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    resize,
    setPointer(x, y) {
      ptr.tx = x;
      ptr.ty = y;
    },
    dispose() {
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      mesh.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
