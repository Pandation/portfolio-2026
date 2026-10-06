import { Vector3 } from "three";

// ---------------------------------------------------------------------------
// Plan de la ville : une avenue orientée vers -Z, des immeubles des deux côtés.
// Pour chaque arrêt (un projet), le héros se pose au bord d'un toit et regarde
// un panneau publicitaire installé sur le toit d'en face, un peu plus loin.
// Entre deux arrêts, une tour sert de point d'accroche à la toile.
// ---------------------------------------------------------------------------

export const STREET_HALF = 12;
const SPACING = 46;
// Muret (parapet) au bord des toits côté avenue : le héros se perche dessus.
export const LEDGE_HEIGHT = 0.9;
export const LEDGE_WIDTH = 0.5;
const PERCH_EDGE = STREET_HALF + LEDGE_WIDTH / 2;
const PERCH_HEIGHTS = [34, 42, 38, 46, 36, 44];

export const BILLBOARD_WIDTH = 30;
export const BILLBOARD_HEIGHT = (BILLBOARD_WIDTH * 9) / 16;

export type Side = 1 | -1;

export type Block = {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  height: number;
  waterTower?: boolean;
};

export type Billboard = {
  center: Vector3;
  yaw: number;
  roof: number;
};

export type Stop = {
  side: Side;
  // Point où se posent les pieds du héros.
  perch: Vector3;
  billboard: Billboard;
};

export type CityLayout = {
  stops: Stop[];
  // anchors[i] : accroche de la toile pour le swing entre stops[i] et stops[i+1].
  anchors: Vector3[];
  intro: { from: Vector3; anchor: Vector3 };
  blocks: Block[];
  zStart: number;
  zEnd: number;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bloc collé à l'avenue sur un côté donné, entre deux profondeurs.
function streetBlock(
  side: Side,
  zA: number,
  zB: number,
  depth: number,
  height: number,
  extra?: Partial<Block>,
): Block {
  const inner = side * STREET_HALF;
  const outer = side * (STREET_HALF + depth);
  return {
    x0: Math.min(inner, outer),
    x1: Math.max(inner, outer),
    z0: Math.min(zA, zB),
    z1: Math.max(zA, zB),
    height,
    ...extra,
  };
}

export function buildLayout(count: number): CityLayout {
  const rand = mulberry32(1337);
  const stops: Stop[] = [];
  const anchors: Vector3[] = [];
  const required: Block[] = [];

  const sideOf = (i: number): Side => (i % 2 === 0 ? -1 : 1);
  const heightOf = (i: number) => PERCH_HEIGHTS[i % PERCH_HEIGHTS.length];

  for (let i = 0; i < count; i++) {
    const s = sideOf(i);
    const z = -i * SPACING;
    const h = heightOf(i);

    // Immeuble perchoir.
    required.push(streetBlock(s, z + 7, z - 7, 18, h, { waterTower: true }));
    const perch = new Vector3(s * PERCH_EDGE, h + LEDGE_HEIGHT, z - 6);

    // Immeuble d'en face, plus bas, qui porte le panneau.
    const roof = h - 5;
    required.push(streetBlock(-s as Side, z - 14, z - 37, 24, roof));
    const center = new Vector3(-s * 21, roof + 3 + BILLBOARD_HEIGHT / 2, z - 25.5);
    const yaw = Math.atan2(perch.x - center.x, perch.z - center.z);

    stops.push({ side: s, perch, billboard: { center, yaw, roof } });

    // Tour d'accroche vers l'arrêt suivant, du même côté que le perchoir.
    if (i < count - 1) {
      const top = Math.max(h, heightOf(i + 1));
      required.push(streetBlock(s, z - 15, z - 37, 20, top + 58));
      anchors.push(new Vector3(s * STREET_HALF, top + 42, z - 26));
    }
  }

  // Entrée en scène : le héros arrive de derrière la caméra, accroché à une
  // tour placée juste avant le premier perchoir.
  const s0 = sideOf(0);
  const h0 = heightOf(0);
  required.push(streetBlock(s0, 9, 30, 20, h0 + 70));
  const intro = {
    from: new Vector3(-s0 * 3, h0 + 30, 70),
    anchor: new Vector3(s0 * STREET_HALF, h0 + 52, 18),
  };

  const zStart = 140;
  const zEnd = -(count - 1) * SPACING - 200;
  const blocks: Block[] = [...required];

  // Remplissage de l'avenue entre les blocs imposés.
  for (const side of [-1, 1] as Side[]) {
    const fixed = required
      .filter((b) => Math.sign(b.x0 + b.x1) === side)
      .sort((a, b) => b.z1 - a.z1);
    let cursor = zStart;
    const fillUntil = (limit: number) => {
      while (cursor - limit > 6) {
        const depth = Math.min(10 + rand() * 14, cursor - limit - 1.5);
        let height = 16 + rand() * 60 + (rand() < 0.15 ? 50 : 0);
        // Pas d'immeuble plus haut que le panneau entre le héros et celui-ci.
        for (const stop of stops) {
          const z = stop.perch.z + 6;
          if (side === -stop.side && cursor - depth < z + 30 && cursor > z - 14) {
            height = Math.min(height, stop.billboard.roof - 2);
          }
        }
        blocks.push(
          streetBlock(side, cursor, cursor - depth, 14 + rand() * 20, height, {
            waterTower: rand() < 0.3,
          }),
        );
        cursor -= depth + 1.5 + (rand() < 0.2 ? 4 + rand() * 5 : 0);
      }
    };
    for (const block of fixed) {
      fillUntil(block.z1 + 1.5);
      cursor = block.z0 - 1.5;
    }
    fillUntil(zEnd);

    // Deuxième et troisième rangées : la skyline qui se perd dans le brouillard.
    for (const [inner, outer, minH, maxH] of [
      [40, 70, 50, 150],
      [80, 130, 80, 210],
    ]) {
      let z = zStart;
      while (z > zEnd) {
        const depth = 14 + rand() * 22;
        const x0 = inner + rand() * 6;
        const x1 = Math.min(outer, x0 + 14 + rand() * 20);
        blocks.push({
          x0: side > 0 ? x0 : -x1,
          x1: side > 0 ? x1 : -x0,
          z0: z - depth,
          z1: z,
          height: minH + rand() * (maxH - minH),
        });
        z -= depth + 3 + rand() * 6;
      }
    }
  }

  return { stops, anchors, intro, blocks, zStart, zEnd };
}
