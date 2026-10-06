// ---------------------------------------------------------------------------
// Poses clés du héros, en rotations d'Euler (radians) par articulation.
// Repère local : +Z vers l'avant, +Y vers le haut, +X vers la gauche du héros.
//   rotation.x < 0 : membre vers l'avant (épaule, hanche) / flexion du coude
//   rotation.x > 0 : flexion du genou, buste penché vers l'avant
//   rotation.z     : écarte le membre sur le côté (signe selon le côté)
// ---------------------------------------------------------------------------

export const JOINTS = [
  "spine",
  "chest",
  "head",
  "shoulderL",
  "elbowL",
  "shoulderR",
  "elbowR",
  "hipL",
  "kneeL",
  "hipR",
  "kneeR",
] as const;

export type Joint = (typeof JOINTS)[number];
export type Pose = Record<Joint, [number, number, number]>;

// Accroupi au bord du toit, tête levée vers le panneau.
const perch: Pose = {
  spine: [0.35, 0, 0],
  chest: [0.15, 0, 0],
  head: [-0.75, 0, 0],
  shoulderL: [-0.85, 0, 0.3],
  elbowL: [-0.7, 0, 0],
  shoulderR: [-0.3, 0, -0.12],
  elbowR: [-0.2, 0, 0],
  hipL: [-1.7, 0.1, 0.45],
  kneeL: [2.3, 0, 0],
  hipR: [-1.45, -0.1, -0.35],
  kneeR: [2.15, 0, 0],
};

// Impulsion : bras droit tendu pour tirer la toile.
const jump: Pose = {
  spine: [0.1, 0, 0],
  chest: [0, 0, 0],
  head: [-0.25, 0, 0],
  shoulderL: [0.5, 0, 0.35],
  elbowL: [-0.5, 0, 0],
  shoulderR: [-2.9, 0, -0.2],
  elbowR: [-0.1, 0, 0],
  hipL: [-0.5, 0, 0.1],
  kneeL: [0.6, 0, 0],
  hipR: [0.25, 0, -0.1],
  kneeR: [0.35, 0, 0],
};

// Suspendu à la toile, jambes décalées.
const swing: Pose = {
  spine: [-0.15, 0, 0],
  chest: [-0.1, 0, 0],
  head: [0.05, 0, 0],
  shoulderL: [-0.3, 0, 1.25],
  elbowL: [-0.5, 0, 0],
  shoulderR: [-3.0, 0, -0.15],
  elbowR: [-0.05, 0, 0],
  hipL: [-0.8, 0, 0.15],
  kneeL: [1.3, 0, 0],
  hipR: [-0.15, 0, -0.1],
  kneeR: [0.45, 0, 0],
};

// Groupé pour le salto.
const flip: Pose = {
  spine: [0.5, 0, 0],
  chest: [0.3, 0, 0],
  head: [0.3, 0, 0],
  shoulderL: [-1.2, 0, 0.4],
  elbowL: [-1.6, 0, 0],
  shoulderR: [-1.2, 0, -0.4],
  elbowR: [-1.6, 0, 0],
  hipL: [-2.1, 0, 0.2],
  kneeL: [2.4, 0, 0],
  hipR: [-2.1, 0, -0.2],
  kneeR: [2.4, 0, 0],
};

// Réception « super-héros » : main au sol, bras gauche écarté.
const land: Pose = {
  spine: [0.65, 0, 0],
  chest: [0.2, 0, 0],
  head: [-0.4, 0, 0],
  shoulderL: [0.35, 0, 0.95],
  elbowL: [-0.3, 0, 0],
  shoulderR: [-0.25, 0, -0.2],
  elbowR: [-0.1, 0, 0],
  hipL: [-1.95, 0.1, 0.4],
  kneeL: [2.45, 0, 0],
  hipR: [-1.1, -0.1, -0.45],
  kneeR: [2.45, 0, 0],
};

export const POSES = { perch, jump, swing, flip, land };
export type PoseName = keyof typeof POSES;

export function blendPoses(a: Pose, b: Pose, t: number, out: Pose): Pose {
  for (const joint of JOINTS) {
    const pa = a[joint];
    const pb = b[joint];
    out[joint] = [
      pa[0] + (pb[0] - pa[0]) * t,
      pa[1] + (pb[1] - pa[1]) * t,
      pa[2] + (pb[2] - pa[2]) * t,
    ];
  }
  return out;
}

export function emptyPose(): Pose {
  return Object.fromEntries(JOINTS.map((j) => [j, [0, 0, 0]])) as unknown as Pose;
}
