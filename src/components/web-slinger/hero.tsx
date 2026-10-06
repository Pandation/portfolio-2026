"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { type Group, type Object3D, PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildBody } from "./body";
import { type Joint, JOINTS } from "./poses";

export { HIP_HEIGHT } from "./body";

// ---------------------------------------------------------------------------
// Le Web Slinger : un SkinnedMesh organique généré en code (voir body.ts).
// Le Director pilote ses os, nommés comme les articulations des poses.
// ---------------------------------------------------------------------------

export type HeroRig = {
  root: Group;
  hips: Object3D;
  joints: Record<Joint, Object3D>;
  footL: Object3D;
  footR: Object3D;
  handR: Object3D;
};

// Les os sont nommés : on les retrouve par leur nom.
export function resolveRig(root: Group): HeroRig {
  const get = (name: string) => root.getObjectByName(name)!;
  return {
    root,
    hips: get("hips"),
    joints: Object.fromEntries(JOINTS.map((j) => [j, get(j)])) as Record<Joint, Object3D>,
    footL: get("footL"),
    footR: get("footR"),
    handR: get("handR"),
  };
}

export function Hero({ ref }: { ref: React.Ref<Group> }) {
  const gl = useThree((state) => state.gl);
  // Environnement studio généré localement : reflets satinés sur la
  // combinaison uniquement (la ville garde son éclairage de nuit).
  const env = useMemo(() => {
    const pmrem = new PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose();
    return target;
  }, [gl]);
  const body = useMemo(() => buildBody(env.texture), [env]);
  useEffect(
    () => () => {
      body.dispose();
      env.dispose();
    },
    [body, env],
  );

  return (
    <group ref={ref}>
      <primitive object={body.mesh} />
    </group>
  );
}
