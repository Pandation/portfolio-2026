import {
  Bone,
  BufferGeometry,
  Float32BufferAttribute,
  Matrix4,
  Color,
  MeshPhysicalMaterial,
  type Texture,
  Vector2,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import { pandaEmblemTexture, suitTexture } from "./textures";

// ---------------------------------------------------------------------------
// Corps organique du Web Slinger, généré en code :
// 1. un squelette (mêmes noms d'articulations que les poses) mis en A-pose ;
// 2. des volumes « muscles » (cônes arrondis, ellipsoïdes) attachés aux os,
//    fusionnés par union lisse dans un champ de distance signée ;
// 3. extraction d'une surface continue (surface nets) ;
// 4. poids de skinning et couleurs déduits des volumes les plus proches.
// Le motif de toile, les emblèmes et les yeux sont peints par shader dans
// l'espace de la pose de référence : ils suivent le corps sans UV.
// ---------------------------------------------------------------------------

export const HIP_HEIGHT = 0.95;

type V3 = [number, number, number];

type BoneSpec = { name: string; parent?: string; pos: V3; bind?: V3 };

// Pose de référence en A : bras écartés pour ne pas fusionner avec le buste.
// Les poses du Director remplacent ces rotations, la géométrie suit.
const BONES: BoneSpec[] = [
  { name: "hips", pos: [0, HIP_HEIGHT, 0] },
  { name: "spine", parent: "hips", pos: [0, 0.06, 0] },
  { name: "chest", parent: "spine", pos: [0, 0.2, 0] },
  { name: "head", parent: "chest", pos: [0, 0.31, 0] },
  { name: "shoulderL", parent: "chest", pos: [0.21, 0.25, -0.01], bind: [0, 0, 0.75] },
  { name: "elbowL", parent: "shoulderL", pos: [0, -0.29, 0], bind: [-0.2, 0, 0] },
  { name: "handL", parent: "elbowL", pos: [0, -0.32, 0] },
  { name: "shoulderR", parent: "chest", pos: [-0.21, 0.25, -0.01], bind: [0, 0, -0.75] },
  { name: "elbowR", parent: "shoulderR", pos: [0, -0.29, 0], bind: [-0.2, 0, 0] },
  { name: "handR", parent: "elbowR", pos: [0, -0.32, 0] },
  { name: "hipL", parent: "hips", pos: [0.1, -0.03, 0], bind: [0, 0, 0.12] },
  { name: "kneeL", parent: "hipL", pos: [0, -0.44, 0] },
  { name: "footL", parent: "kneeL", pos: [0, -0.49, 0] },
  { name: "hipR", parent: "hips", pos: [-0.1, -0.03, 0], bind: [0, 0, -0.12] },
  { name: "kneeR", parent: "hipR", pos: [0, -0.44, 0] },
  { name: "footR", parent: "kneeR", pos: [0, -0.49, 0] },
];

const WHITE: V3 = [0.9, 0.9, 0.93];
const BLACK: V3 = [0.028, 0.028, 0.034];

type Prim =
  | { bone: string; color: V3; kind: "cone"; a: V3; b: V3; r1: number; r2: number }
  | { bone: string; color: V3; kind: "ell"; c: V3; r: V3 };

const cone = (bone: string, color: V3, a: V3, b: V3, r1: number, r2: number): Prim => ({
  bone,
  color,
  kind: "cone",
  a,
  b,
  r1,
  r2,
});
const ell = (bone: string, color: V3, c: V3, r: V3): Prim => ({ bone, color, kind: "ell", c, r });

function mirror(prims: Prim[], from: "L", to: "R"): Prim[] {
  const flip = (v: V3): V3 => [-v[0], v[1], v[2]];
  return prims.map((p) => {
    const bone = p.bone.replace(from, to);
    return p.kind === "cone" ? { ...p, bone, a: flip(p.a), b: flip(p.b) } : { ...p, bone, c: flip(p.c) };
  });
}

// Coordonnées dans le repère local de chaque os.
// Coordonnées dans le repère local de chaque os. Design de référence :
// assets-src/web-slinger/concept-front-*.png. Le buste est noir ici : le
// plastron blanc en écusson est peint par le shader (bords nets + liseré).
const LEFT: Prim[] = [
  // Épaule renforcée, bras et gant noirs
  ell("shoulderL", BLACK, [0.012, -0.035, 0], [0.074, 0.08, 0.074]),
  cone("shoulderL", BLACK, [0, 0, 0], [0, -0.29, 0], 0.058, 0.045),
  ell("shoulderL", BLACK, [0, -0.13, 0.024], [0.052, 0.095, 0.054]),
  ell("shoulderL", BLACK, [0, -0.15, -0.022], [0.047, 0.09, 0.046]),
  cone("elbowL", BLACK, [0, 0, 0], [0, -0.24, 0], 0.047, 0.036),
  ell("elbowL", BLACK, [0, -0.07, 0.008], [0.054, 0.085, 0.05]),
  ell("elbowL", BLACK, [0, -0.2, 0], [0.044, 0.05, 0.042]),
  ell("elbowL", BLACK, [0, -0.3, 0.006], [0.043, 0.064, 0.028]),
  cone("elbowL", BLACK, [0, -0.27, 0.02], [-0.01, -0.318, 0.046], 0.017, 0.014),
  // Jambe : cuisse, poche cargo, genouillère, mollet, ranger
  cone("hipL", BLACK, [0, 0, 0], [0, -0.44, 0], 0.088, 0.058),
  ell("hipL", BLACK, [0.008, -0.17, 0.025], [0.08, 0.15, 0.074]),
  ell("hipL", BLACK, [0.07, -0.22, 0.005], [0.03, 0.065, 0.05]),
  ell("kneeL", BLACK, [0, -0.005, 0.038], [0.054, 0.062, 0.03]),
  cone("kneeL", BLACK, [0, 0, 0], [0, -0.42, 0], 0.058, 0.042),
  ell("kneeL", BLACK, [0, -0.13, -0.03], [0.06, 0.105, 0.06]),
  cone("kneeL", BLACK, [0, -0.33, 0], [0, -0.45, 0.005], 0.052, 0.054),
  cone("kneeL", BLACK, [0, -0.46, -0.035], [0, -0.475, 0.135], 0.05, 0.042),
  // Fessier, omoplate, pectoral, oblique, abdos
  ell("hips", BLACK, [0.07, -0.05, -0.055], [0.08, 0.085, 0.07]),
  ell("chest", BLACK, [0.075, 0.17, -0.075], [0.075, 0.08, 0.04]),
  ell("chest", BLACK, [0.068, 0.165, 0.064], [0.088, 0.062, 0.048]),
  ell("spine", BLACK, [0.105, 0.08, 0.02], [0.04, 0.1, 0.07]),
  ell("spine", BLACK, [0.036, 0.035, 0.083], [0.031, 0.024, 0.024]),
  ell("spine", BLACK, [0.036, 0.09, 0.087], [0.032, 0.025, 0.024]),
  ell("spine", BLACK, [0.037, 0.145, 0.09], [0.033, 0.026, 0.024]),
];

const PRIMS: Prim[] = [
  ...LEFT,
  ...mirror(LEFT, "L", "R"),
  // Bassin et taille
  ell("hips", BLACK, [0, 0.01, 0], [0.16, 0.12, 0.11]),
  ell("spine", BLACK, [0, 0.1, 0.004], [0.13, 0.15, 0.096]),
  ell("spine", BLACK, [0, -0.02, 0], [0.145, 0.075, 0.105]),
  // Cage thoracique, dorsaux, trapèzes
  ell("chest", BLACK, [0, 0.13, 0], [0.165, 0.15, 0.112]),
  ell("chest", BLACK, [0, 0.165, -0.02], [0.215, 0.105, 0.1]),
  ell("chest", BLACK, [0, 0.245, -0.012], [0.19, 0.056, 0.09]),
  // Trapèzes : pente du cou vers les épaules
  ell("chest", BLACK, [0.085, 0.29, -0.015], [0.095, 0.042, 0.068]),
  ell("chest", BLACK, [-0.085, 0.29, -0.015], [0.095, 0.042, 0.068]),
  // Col montant blanc
  cone("chest", WHITE, [0, 0.26, 0], [0, 0.37, 0.014], 0.074, 0.062),
  // Tête : crâne, mâchoire, oreilles de panda
  ell("head", WHITE, [0, 0.16, 0.006], [0.108, 0.13, 0.118]),
  ell("head", WHITE, [0, 0.095, 0.032], [0.084, 0.074, 0.084]),
  ell("head", BLACK, [0.082, 0.27, -0.015], [0.045, 0.045, 0.026]),
  ell("head", BLACK, [-0.082, 0.27, -0.015], [0.045, 0.045, 0.026]),
];

const SMOOTH = 0.024;
const CELL = 0.0098;

// --- Distances signées (Inigo Quilez) --------------------------------------

function sdRoundCone(px: number, py: number, pz: number, p: Extract<Prim, { kind: "cone" }>) {
  const [ax, ay, az] = p.a;
  const bax = p.b[0] - ax;
  const bay = p.b[1] - ay;
  const baz = p.b[2] - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = p.r1 - p.r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pax = px - ax;
  const pay = py - ay;
  const paz = pz - az;
  const y = pax * bax + pay * bay + paz * baz;
  const z = y - l2;
  const xx = pax * l2 - bax * y;
  const xy = pay * l2 - bay * y;
  const xz = paz * l2 - baz * y;
  const x2 = xx * xx + xy * xy + xz * xz;
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - p.r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - p.r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - p.r1;
}

function sdEllipsoid(px: number, py: number, pz: number, p: Extract<Prim, { kind: "ell" }>) {
  const x = px - p.c[0];
  const y = py - p.c[1];
  const z = pz - p.c[2];
  const [rx, ry, rz] = p.r;
  const k0 = Math.hypot(x / rx, y / ry, z / rz);
  const k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

type Compiled = {
  prim: Prim;
  inv: number[];
  boneIndex: number;
  min: V3;
  max: V3;
};

function compile(prims: Prim[], bones: Map<string, Bone>, order: string[]): Compiled[] {
  return prims.map((prim) => {
    const bone = bones.get(prim.bone)!;
    const world = bone.matrixWorld;
    const inv = new Matrix4().copy(world).invert().elements;
    // Boîte englobante en espace modèle.
    const pts =
      prim.kind === "cone"
        ? [prim.a, prim.b]
        : [prim.c];
    const pad = (prim.kind === "cone" ? Math.max(prim.r1, prim.r2) : Math.max(...prim.r)) + SMOOTH + 0.04;
    const min: V3 = [Infinity, Infinity, Infinity];
    const max: V3 = [-Infinity, -Infinity, -Infinity];
    for (const p of pts) {
      const w = new Vector3(...p).applyMatrix4(world);
      const arr = [w.x, w.y, w.z];
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], arr[i] - pad);
        max[i] = Math.max(max[i], arr[i] + pad);
      }
    }
    return { prim, inv: Array.from(inv), boneIndex: order.indexOf(prim.bone), min, max };
  });
}

function evalPrim(c: Compiled, x: number, y: number, z: number) {
  const e = c.inv;
  const lx = e[0] * x + e[4] * y + e[8] * z + e[12];
  const ly = e[1] * x + e[5] * y + e[9] * z + e[13];
  const lz = e[2] * x + e[6] * y + e[10] * z + e[14];
  return c.prim.kind === "cone" ? sdRoundCone(lx, ly, lz, c.prim) : sdEllipsoid(lx, ly, lz, c.prim);
}

// --- Surface nets ------------------------------------------------------------

const CUBE_EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

function polygonize(compiled: Compiled[]) {
  const min: V3 = [Infinity, Infinity, Infinity];
  const max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const c of compiled) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], c.min[i]);
      max[i] = Math.max(max[i], c.max[i]);
    }
  }
  const nx = Math.ceil((max[0] - min[0]) / CELL) + 1;
  const ny = Math.ceil((max[1] - min[1]) / CELL) + 1;
  const nz = Math.ceil((max[2] - min[2]) / CELL) + 1;
  const field = new Float32Array(nx * ny * nz).fill(1);
  const idx = (x: number, y: number, z: number) => x + nx * (y + ny * z);

  // Chaque volume ne met à jour que les points de sa boîte englobante.
  for (const c of compiled) {
    const x0 = Math.max(0, Math.floor((c.min[0] - min[0]) / CELL));
    const y0 = Math.max(0, Math.floor((c.min[1] - min[1]) / CELL));
    const z0 = Math.max(0, Math.floor((c.min[2] - min[2]) / CELL));
    const x1 = Math.min(nx - 1, Math.ceil((c.max[0] - min[0]) / CELL));
    const y1 = Math.min(ny - 1, Math.ceil((c.max[1] - min[1]) / CELL));
    const z1 = Math.min(nz - 1, Math.ceil((c.max[2] - min[2]) / CELL));
    for (let z = z0; z <= z1; z++) {
      const wz = min[2] + z * CELL;
      for (let y = y0; y <= y1; y++) {
        const wy = min[1] + y * CELL;
        for (let x = x0; x <= x1; x++) {
          const i = idx(x, y, z);
          field[i] = smin(field[i], evalPrim(c, min[0] + x * CELL, wy, wz), SMOOTH);
        }
      }
    }
  }

  const positions: number[] = [];
  const indices: number[] = [];
  const cellVertex = new Int32Array(nx * ny * nz).fill(-1);
  const corner = new Float32Array(8);

  for (let z = 0; z < nz - 1; z++) {
    for (let y = 0; y < ny - 1; y++) {
      for (let x = 0; x < nx - 1; x++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const v = field[idx(x + (c & 1), y + ((c >> 1) & 1), z + ((c >> 2) & 1))];
          corner[c] = v;
          if (v < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;

        let sx = 0;
        let sy = 0;
        let sz = 0;
        let n = 0;
        for (const [a, b] of CUBE_EDGES) {
          const fa = corner[a];
          const fb = corner[b];
          if (fa < 0 === fb < 0) continue;
          const t = fa / (fa - fb);
          sx += (a & 1) + ((b & 1) - (a & 1)) * t;
          sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t;
          sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t;
          n++;
        }
        const vi = positions.length / 3;
        positions.push(min[0] + (x + sx / n) * CELL, min[1] + (y + sy / n) * CELL, min[2] + (z + sz / n) * CELL);
        cellVertex[idx(x, y, z)] = vi;

        // Une face par arête de grille traversée par la surface, partagée
        // par les quatre cellules qui l'entourent (déjà visitées).
        const p = [x, y, z];
        for (let a = 0; a < 3; a++) {
          const j = (a + 1) % 3;
          const k = (a + 2) % 3;
          if (p[j] === 0 || p[k] === 0) continue;
          const inside0 = corner[0] < 0;
          const inside1 = corner[1 << a] < 0;
          if (inside0 === inside1) continue;
          const off = (dj: number, dk: number) => {
            const q = [x, y, z];
            q[j] -= dj;
            q[k] -= dk;
            return cellVertex[idx(q[0], q[1], q[2])];
          };
          const v0 = vi;
          const v1 = off(1, 0);
          const v2 = off(1, 1);
          const v3 = off(0, 1);
          if (v1 < 0 || v2 < 0 || v3 < 0) continue;
          // Orientation : normale sortante dirigée de l'intérieur vers l'extérieur.
          if (inside0) indices.push(v0, v1, v2, v0, v2, v3);
          else indices.push(v0, v2, v1, v0, v3, v2);
        }
      }
    }
  }

  return { positions, indices };
}

// --- Assemblage ----------------------------------------------------------------

export type Body = {
  mesh: SkinnedMesh;
  dispose: () => void;
};

export function buildBody(envMap: Texture | null = null): Body {
  const bones = new Map<string, Bone>();
  for (const spec of BONES) {
    const bone = new Bone();
    bone.name = spec.name;
    bone.position.set(...spec.pos);
    if (spec.bind) bone.rotation.set(...spec.bind);
    bones.set(spec.name, bone);
    if (spec.parent) bones.get(spec.parent)!.add(bone);
  }
  const order = BONES.map((b) => b.name);
  const hips = bones.get("hips")!;
  hips.updateMatrixWorld(true);

  const compiled = compile(PRIMS, bones, order);
  const { positions, indices } = polygonize(compiled);

  // Poids et couleurs : les volumes les plus proches de chaque sommet.
  const count = positions.length / 3;
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const boneScore = new Float32Array(order.length);
  for (let v = 0; v < count; v++) {
    const x = positions[v * 3];
    const y = positions[v * 3 + 1];
    const z = positions[v * 3 + 2];
    boneScore.fill(0);
    let cr = 0;
    let cg = 0;
    let cb = 0;
    let cw = 0;
    for (const c of compiled) {
      const d = Math.max(evalPrim(c, x, y, z), 0);
      const w = Math.exp(-d / 0.018);
      if (w > boneScore[c.boneIndex]) boneScore[c.boneIndex] = w;
      const wc = Math.exp(-d / 0.007);
      cr += c.prim.color[0] * wc;
      cg += c.prim.color[1] * wc;
      cb += c.prim.color[2] * wc;
      cw += wc;
    }
    colors.set([cr / cw, cg / cw, cb / cw], v * 3);

    const best = Array.from(boneScore, (s, i) => [s, i])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 4);
    const total = best.reduce((sum, [s]) => sum + s, 0) || 1;
    best.forEach(([s, i], k) => {
      skinIndex[v * 4 + k] = i;
      skinWeight[v * 4 + k] = s / total;
    });
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(skinWeight, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = suitMaterial(bones, envMap);
  const mesh = new SkinnedMesh(geometry, material);
  mesh.name = "web-slinger-body";
  mesh.frustumCulled = false;
  mesh.add(hips);
  mesh.bind(new Skeleton(order.map((name) => bones.get(name)!)));

  return {
    mesh,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      material.userData.textures?.forEach((t: { dispose: () => void }) => t.dispose());
    },
  };
}

// Matériau de la combinaison, peint dans l'espace de la pose de référence :
// plastron blanc en écusson (devant et dans le dos) avec liseré, motif de
// toile triplanaire, emblèmes panda, masque (taches + yeux en amande).
// Tissu satiné (sheen) ; le plastron est plus lisse que le reste.
function suitMaterial(bones: Map<string, Bone>, envMap: Texture | null) {
  const web = suitTexture("#000000", "#ffffff");
  const emblem = pandaEmblemTexture();
  const at = (name: string, y = 0) => new Vector3(0, y, 0).applyMatrix4(bones.get(name)!.matrixWorld);
  const chest = at("chest", 0.125);
  const head = at("head");
  // Écusson : de la pointe (sous le nombril) jusqu'à la base du col.
  const shieldBottom = at("hips", -0.075).y;
  const shieldTop = at("chest", 0.265).y;

  const material = new MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.62,
    metalness: 0.04,
    sheen: 0.35,
    sheenRoughness: 0.5,
    sheenColor: new Color("#5d6275"),
    envMap,
    envMapIntensity: 0.22,
  });
  material.userData.textures = [web, emblem];
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uWeb: { value: web },
      uEmblem: { value: emblem },
      uChest: { value: chest },
      uHead: { value: head },
      uShield: { value: new Vector2(shieldBottom, shieldTop) },
    });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRest;\nvarying vec3 vRestN;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRest = position;\nvRestN = normal;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vRest;
varying vec3 vRestN;
uniform sampler2D uWeb;
uniform sampler2D uEmblem;
uniform vec3 uChest;
uniform vec3 uHead;
uniform vec2 uShield;

float ellipseMask(vec2 p, float angle, vec2 radii) {
  p = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p;
  return 1.0 - smoothstep(0.86, 1.0, length(p / radii));
}

// Demi-largeur de l'écusson selon la hauteur (0 = pointe, 1 = col).
float shieldHalfWidth(float t) {
  if (t < 0.16) return mix(0.0, 0.065, smoothstep(0.0, 0.16, t));
  if (t < 0.5) return mix(0.065, 0.105, (t - 0.16) / 0.34);
  if (t < 0.8) return mix(0.105, 0.165, smoothstep(0.5, 0.8, t));
  return mix(0.165, 0.075, smoothstep(0.8, 1.0, t));
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 restN = normalize(vRestN);

// Plastron blanc : même découpe devant et dans le dos, flancs noirs.
float shieldT = (vRest.y - uShield.x) / (uShield.y - uShield.x);
float shieldMask = 0.0;
float seam = 0.0;
if (shieldT > 0.0 && shieldT < 1.06 && abs(vRest.x) < 0.2) {
  float edge = abs(vRest.x) - shieldHalfWidth(min(shieldT, 1.0));
  shieldMask = 1.0 - smoothstep(-0.002, 0.002, edge);
  seam = 1.0 - smoothstep(0.0015, 0.0045, abs(edge + 0.004));
}
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.9, 0.93), shieldMask);

vec3 tri = pow(abs(restN), vec3(4.0));
tri /= (tri.x + tri.y + tri.z);
float webLine = texture2D(uWeb, vRest.zy * 3.4).r * tri.x
  + texture2D(uWeb, vRest.xz * 3.4).r * tri.y
  + texture2D(uWeb, vRest.xy * 3.4).r * tri.z;
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.6 + 0.1, webLine * 0.45);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.38, 0.39, 0.43), seam * 0.85);

// Emblèmes : projection plane avant / arrière sur le plastron.
vec2 front = (vRest.xy - uChest.xy) / 0.115 * 0.5 + 0.5;
if (restN.z > 0.25 && vRest.z > uChest.z + 0.03 && all(greaterThan(front, vec2(0.0))) && all(lessThan(front, vec2(1.0)))) {
  vec4 e = texture2D(uEmblem, front);
  diffuseColor.rgb = mix(diffuseColor.rgb, e.rgb, e.a);
}
vec2 back = (vRest.xy - uChest.xy) / 0.1 * 0.5 + 0.5;
back.x = 1.0 - back.x;
if (restN.z < -0.25 && vRest.z < uChest.z - 0.03 && all(greaterThan(back, vec2(0.0))) && all(lessThan(back, vec2(1.0)))) {
  vec4 e = texture2D(uEmblem, back);
  diffuseColor.rgb = mix(diffuseColor.rgb, e.rgb, e.a);
}

// Masque : grandes taches noires arrondies, yeux blancs en amande.
float lens = 0.0;
if (restN.z > 0.15 && vRest.z > uHead.z + 0.02 && vRest.y > uHead.y + 0.1) {
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? 1.0 : -1.0;
    vec2 p = vRest.xy - (uHead.xy + vec2(side * 0.05, 0.168));
    float patchMask = ellipseMask(p, side * -0.35, vec2(0.05, 0.058));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.02), patchMask);
    float l = ellipseMask(p + vec2(side * 0.004, -0.004), side * 0.38, vec2(0.03, 0.013));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), l);
    lens = max(lens, l);
  }
}`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.34, shieldMask);",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.8, 0.88, 1.0) * lens * 0.8;",
      );
  };
  return material;
}
