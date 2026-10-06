import { CatmullRomCurve3, Vector3 } from "three";

// ---------------------------------------------------------------------------
// Trajectoire d'un swing : petit saut, arc de pendule autour du point
// d'accroche, lâcher de la toile, vol balistique (avec salto) et réception.
// La courbe passe exactement par chaque point de contrôle, ce qui permet de
// savoir à quel paramètre t la toile est attachée / lâchée.
// ---------------------------------------------------------------------------

export type SwingPhase = "jump" | "swing" | "flip" | "land";

export type Swing = {
  curve: CatmullRomCurve3;
  anchor: Vector3;
  attachAt: number;
  releaseAt: number;
  duration: number;
};

const ARC_STEPS = 6;

export function buildSwing(from: Vector3, to: Vector3, anchor: Vector3): Swing {
  const forward = new Vector3(to.x - from.x, 0, to.z - from.z).normalize();
  const up = new Vector3(0, 1, 0);

  const hop = from.clone().addScaledVector(forward, 1.5).addScaledVector(up, 2.5);

  // Point de lâcher : aux trois quarts du trajet, au-dessus de l'arrivée pour
  // laisser la place à un vol en cloche.
  const release = from.clone().lerp(to, 0.74);
  release.y = Math.max(to.y + 7, release.y);

  const startDir = hop.clone().sub(anchor);
  const endDir = release.clone().sub(anchor);
  const startLen = startDir.length();
  const endLen = endDir.length();
  startDir.normalize();
  endDir.normalize();

  // Interpolation sphérique de la direction de la corde : on reste sur un arc
  // de cercle centré sur l'accroche, donc la trajectoire plonge naturellement.
  const angle = startDir.angleTo(endDir);
  const arc: Vector3[] = [];
  for (let k = 1; k < ARC_STEPS; k++) {
    const t = k / ARC_STEPS;
    const dir =
      angle < 1e-4
        ? startDir.clone()
        : startDir
            .clone()
            .multiplyScalar(Math.sin((1 - t) * angle) / Math.sin(angle))
            .addScaledVector(endDir, Math.sin(t * angle) / Math.sin(angle));
    arc.push(anchor.clone().addScaledVector(dir, startLen + (endLen - startLen) * t));
  }

  const apex = release.clone().lerp(to, 0.5);
  apex.y = Math.max(release.y, to.y) + 3.5;

  const points = [from, hop, ...arc, release, apex, to];
  const last = points.length - 1;

  return {
    curve: new CatmullRomCurve3(points, false, "centripetal"),
    anchor,
    attachAt: 1 / last,
    releaseAt: (ARC_STEPS + 1) / last,
    duration: 2.9,
  };
}

// Phase et progression locale (0 → 1) à l'intérieur de la phase.
export function swingPhase(swing: Swing, t: number): { phase: SwingPhase; local: number } {
  const landAt = swing.releaseAt + (1 - swing.releaseAt) * 0.78;
  if (t < swing.attachAt) return { phase: "jump", local: t / swing.attachAt };
  if (t < swing.releaseAt)
    return { phase: "swing", local: (t - swing.attachAt) / (swing.releaseAt - swing.attachAt) };
  if (t < landAt) return { phase: "flip", local: (t - swing.releaseAt) / (landAt - swing.releaseAt) };
  return { phase: "land", local: (t - landAt) / (1 - landAt) };
}
