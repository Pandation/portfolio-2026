"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  MathUtils,
  Matrix4,
  type Group,
  type Object3D,
  type PerspectiveCamera,
  type PointLight,
  Quaternion,
  Vector3,
} from "three";
import { HIP_HEIGHT, type HeroRig, resolveRig } from "./hero";
import type { CityLayout, Stop } from "./layout";
import { blendPoses, emptyPose, JOINTS, POSES } from "./poses";
import { useSlingerStore } from "./store";
import { buildSwing, type Swing, swingPhase } from "./swing";

const UP = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);
const HERO_SCALE = 1.15;

const smooth = (x: number) => {
  const t = MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

// Le plan « par-dessus l'épaule » : caméra derrière le héros, sur le toit,
// cadrant le héros de dos et le panneau en face.
function perchFraming(stop: Stop, aspect: number) {
  const dir = stop.billboard.center.clone().sub(stop.perch).setY(0).normalize();
  const right = dir.clone().cross(UP).normalize();
  const portrait = aspect < 1;
  // Paysage : carte projet à gauche, héros et panneau décalés vers la droite.
  const position = stop.perch
    .clone()
    .addScaledVector(dir, portrait ? -6.4 : -5.6)
    .addScaledVector(UP, 1.7)
    .addScaledVector(right, portrait ? 0 : -1.2);
  const target = stop.billboard.center
    .clone()
    // Portrait : caméra plongeante, panneau en haut, héros au centre, carte en bas.
    .addScaledVector(UP, portrait ? -12 : -4.2)
    .addScaledVector(right, portrait ? 0 : -2.5);
  return { position, target };
}

type Props = {
  layout: CityLayout;
  heroRef: React.RefObject<Group | null>;
  webRef: React.RefObject<Object3D | null>;
  rimLightRef: React.RefObject<PointLight | null>;
  keyLightRef: React.RefObject<PointLight | null>;
};

// Vecteurs et poses réutilisés à chaque frame pour éviter les allocations.
function createScratch() {
  return {
    pose: emptyPose(),
    pos: new Vector3(),
    ahead: new Vector3(),
    behind: new Vector3(),
    vel: new Vector3(),
    up: new Vector3(),
    x: new Vector3(),
    z: new Vector3(),
    m: new Matrix4(),
    q: new Quaternion(),
    flip: new Quaternion(),
    camPos: new Vector3(),
    camTarget: new Vector3(),
    hand: new Vector3(),
    foot: new Vector3(),
    footR: new Vector3(),
    rimTarget: new Vector3(),
  };
}

export function Director({ layout, heroRef, webRef, rimLightRef, keyLightRef }: Props) {
  const store = useSlingerStore();
  const rigRef = useRef<HeroRig>(null);

  // État de l'animation, gardé hors de React (muté à chaque frame).
  const sim = useRef({
    current: 0,
    to: 0,
    swing: buildSwing(layout.intro.from, layout.stops[0].perch, layout.intro.anchor) as Swing | null,
    intro: true,
    elapsed: 0,
    sinceLanding: 0,
    lookTarget: new Vector3(0, 40, -40),
    forward: new Vector3(0, 0, -1),
  });

  const scratchRef = useRef<ReturnType<typeof createScratch>>(null);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 10);
    const s = sim.current;
    scratchRef.current ??= createScratch();
    const scratch = scratchRef.current;
    if (!heroRef.current) return;
    rigRef.current ??= resolveRig(heroRef.current);
    const rig = rigRef.current;
    const camera = state.camera as PerspectiveCamera;
    const { root, hips, joints } = rig;
    const store$ = store.get();
    if (!store$.ready) store.set({ ready: true });

    // --- Départ d'un nouveau swing vers la cible demandée ----------------
    if (!s.swing && store$.target !== s.current) {
      const step = Math.sign(store$.target - s.current);
      const to = s.current + step;
      const from = layout.stops[s.current];
      const anchor = layout.anchors[Math.min(s.current, to)];
      s.swing = buildSwing(from.perch, layout.stops[to].perch, anchor);
      s.to = to;
      s.elapsed = 0;
      store.set({ swinging: true });
    }

    const pose = scratch.pose;
    let groundWeight = 1;
    let webVisible = false;
    let webExtend = 0;
    const destination = layout.stops[s.swing ? s.to : s.current];

    // Orientation finale : face au panneau.
    const landingForward = scratch.z
      .copy(destination.billboard.center)
      .sub(destination.perch)
      .setY(0)
      .normalize();

    if (s.swing) {
      const swing = s.swing;
      s.elapsed += dt;
      const t = Math.min(s.elapsed / swing.duration, 1);
      const u = 0.45 * t + 0.55 * (0.5 - 0.5 * Math.cos(Math.PI * t));
      swing.curve.getPoint(u, scratch.pos);
      swing.curve.getPoint(Math.min(u + 0.01, 1), scratch.ahead);
      swing.curve.getPoint(Math.max(u - 0.01, 0), scratch.behind);
      scratch.vel.subVectors(scratch.ahead, scratch.behind);

      const { phase, local } = swingPhase(swing, u);
      const ropeUp = scratch.up.copy(swing.anchor).sub(scratch.pos).normalize();
      let upBlend = 0;
      let flipAngle = 0;
      const start = s.intro ? POSES.swing : POSES.perch;

      if (phase === "jump") {
        blendPoses(start, POSES.jump, smooth(local * 1.4), pose);
        groundWeight = s.intro ? 0 : 1 - smooth(local * 2.5);
        upBlend = local;
      } else if (phase === "swing") {
        blendPoses(POSES.jump, POSES.swing, smooth(local * 3), pose);
        groundWeight = 0;
        upBlend = 1;
        webVisible = true;
        webExtend = smooth(local * 6);
      } else if (phase === "flip") {
        blendPoses(POSES.swing, POSES.flip, smooth(local * 2.5), pose);
        groundWeight = 0;
        upBlend = 1 - smooth(local);
        flipAngle = smooth(local) * Math.PI * 2;
        // La toile se rétracte juste après le lâcher.
        webVisible = local < 0.15;
        webExtend = 1 - local / 0.15;
      } else {
        blendPoses(POSES.flip, POSES.land, smooth(local * 1.6), pose);
        groundWeight = smooth(local * 1.3);
      }

      // Repère du héros : « haut » vers la toile pendant le swing, vers le ciel sinon.
      scratch.up.copy(UP).lerp(ropeUp, upBlend * 0.9).normalize();
      const horizontal = scratch.vel.setY(0);
      if (horizontal.lengthSq() > 1e-6) s.forward.copy(horizontal.normalize());
      if (phase === "land") s.forward.lerp(landingForward, smooth(local)).normalize();

      scratch.x.crossVectors(scratch.up, s.forward).normalize();
      const fwd = scratch.ahead.crossVectors(scratch.x, scratch.up).normalize();
      scratch.m.makeBasis(scratch.x, scratch.up, fwd);
      scratch.q.setFromRotationMatrix(scratch.m);
      if (flipAngle) {
        scratch.flip.setFromAxisAngle(X_AXIS, flipAngle);
        scratch.q.multiply(scratch.flip);
      }
      root.position.copy(scratch.pos);
      root.quaternion.slerp(scratch.q, 1 - Math.exp(-dt * 18));

      if (t >= 1) {
        s.swing = null;
        s.intro = false;
        s.current = s.to;
        s.sinceLanding = 0;
        store.set({ index: s.current, swinging: store.get().target !== s.current });
      }
    } else {
      // --- Perché : réception qui se relâche puis respiration ------------
      s.sinceLanding += dt;
      blendPoses(POSES.land, POSES.perch, smooth(s.sinceLanding / 0.7), pose);
      const time = state.clock.elapsedTime;
      pose.chest = [pose.chest[0] + Math.sin(time * 2.1) * 0.025, pose.chest[1], pose.chest[2]];
      pose.head = [pose.head[0] + Math.sin(time * 0.7) * 0.04, Math.sin(time * 0.37) * 0.12, pose.head[2]];
      root.position.copy(destination.perch);
      scratch.x.crossVectors(UP, landingForward).normalize();
      scratch.m.makeBasis(scratch.x, UP, landingForward);
      scratch.q.setFromRotationMatrix(scratch.m);
      root.quaternion.slerp(scratch.q, 1 - Math.exp(-dt * 10));
    }

    // --- Application de la pose ------------------------------------------
    root.scale.setScalar(HERO_SCALE);
    for (const name of JOINTS) {
      joints[name].rotation.set(pose[name][0], pose[name][1], pose[name][2]);
    }

    // Ancrage au sol : on descend le bassin pour que le pied le plus bas
    // touche le perchoir (cinématique directe, pas besoin d'IK complète).
    hips.position.y = HIP_HEIGHT;
    if (groundWeight > 0) {
      root.updateMatrixWorld(true);
      rig.footL.getWorldPosition(scratch.foot);
      rig.footR.getWorldPosition(scratch.footR);
      root.worldToLocal(scratch.foot);
      root.worldToLocal(scratch.footR);
      hips.position.y -= Math.min(scratch.foot.y, scratch.footR.y) * groundWeight;
    }

    // --- Toile -----------------------------------------------------------
    const webMesh = webRef.current;
    if (webMesh) {
      webMesh.visible = webVisible && webExtend > 0.01 && !!s.swing;
      if (webMesh.visible && s.swing) {
        root.updateMatrixWorld(true);
        rig.handR.getWorldPosition(scratch.hand);
        const toAnchor = scratch.camTarget.copy(s.swing.anchor).sub(scratch.hand);
        const length = toAnchor.length() * webExtend;
        webMesh.position.copy(scratch.hand);
        webMesh.quaternion.setFromUnitVectors(UP, toAnchor.normalize());
        webMesh.scale.set(1, length, 1);
      }
    }

    // --- Caméra ----------------------------------------------------------
    const aspect = state.size.width / state.size.height;
    const vFov = aspect >= 1 ? 42 : Math.min(76, MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(29)) / aspect)));
    if (Math.abs(camera.fov - vFov) > 0.01) {
      camera.fov = vFov;
      camera.updateProjectionMatrix();
    }

    const framing = perchFraming(destination, aspect);
    let follow = 1;
    if (s.swing) {
      const t = Math.min(s.elapsed / s.swing.duration, 1);
      follow = s.intro ? smooth((t - 0.45) / 0.55) : smooth((t - 0.72) / 0.28);
      // Caméra de poursuite : derrière et au-dessus du héros.
      const chasePos = scratch.camPos
        .copy(root.position)
        .addScaledVector(s.forward, -9)
        .addScaledVector(UP, 3.2);
      const chaseTarget = scratch.hand.copy(root.position).addScaledVector(s.forward, 6).addScaledVector(UP, 1);
      chasePos.lerp(framing.position, follow);
      chaseTarget.lerp(framing.target, follow);
      framing.position.copy(chasePos);
      framing.target.copy(chaseTarget);
    }

    // Léger parallaxe à la souris.
    const right = scratch.x.copy(landingForward).cross(UP).normalize();
    framing.position.addScaledVector(right, state.pointer.x * 0.35).addScaledVector(UP, state.pointer.y * 0.2);

    const camSpeed = s.swing ? (s.intro ? 1.6 : 3.2) : 2.4;
    camera.position.lerp(framing.position, 1 - Math.exp(-dt * camSpeed));
    s.lookTarget.lerp(framing.target, 1 - Math.exp(-dt * (camSpeed + 0.8)));
    camera.lookAt(s.lookTarget);

    // Lumière d'appoint portée par la caméra : le dos du héros reste lisible.
    const key = keyLightRef.current;
    if (key) key.position.copy(camera.position).addScaledVector(UP, 1.5);

    // --- Lumière du panneau actif sur le héros -------------------------
    const rim = rimLightRef.current;
    if (rim) {
      scratch.rimTarget
        .copy(destination.billboard.center)
        .lerp(destination.perch, 0.35)
        .addScaledVector(UP, -2);
      rim.position.lerp(scratch.rimTarget, 1 - Math.exp(-dt * 2));
    }
  });

  return null;
}
