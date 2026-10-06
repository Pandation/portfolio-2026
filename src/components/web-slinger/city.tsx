"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  type InstancedMesh,
  Matrix4,
  Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type CityLayout, LEDGE_HEIGHT, LEDGE_WIDTH, STREET_HALF } from "./layout";
import { neonSignTexture, windowTextures } from "./textures";

const WINDOW_SIZE = 2.1;

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

// Boîte dont les UV sont en unités monde : les fenêtres gardent la même taille
// quel que soit l'immeuble. Les toits pointent sur un coin « mur » de la tuile.
function buildingBox(
  w: number,
  h: number,
  d: number,
  cx: number,
  cy: number,
  cz: number,
  tile: number,
  offset: [number, number],
) {
  const geo = new BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  // Ordre des faces de BoxGeometry : +x, -x, +y, -y, +z, -z (4 sommets chacune).
  for (let face = 0; face < 6; face++) {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      if (face === 2 || face === 3) {
        uv.setXY(i, 0.004, 0.004);
        continue;
      }
      const span = face < 2 ? d : w;
      uv.setXY(i, (uv.getX(i) * span) / tile + offset[0], (uv.getY(i) * h) / tile + offset[1]);
    }
  }
  geo.translate(cx, cy, cz);
  return geo;
}

function useBuildingsGeometry(layout: CityLayout, tileWindows: number) {
  return useMemo(() => {
    const tile = WINDOW_SIZE * tileWindows;
    const parts: BufferGeometry[] = [];
    layout.blocks.forEach((b, i) => {
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const cx = (b.x0 + b.x1) / 2;
      const cz = (b.z0 + b.z1) / 2;
      // Décalage entier en fenêtres pour varier les façades sans couper une fenêtre.
      const offset: [number, number] = [((i * 7) % tileWindows) / tileWindows, ((i * 3) % tileWindows) / tileWindows];
      parts.push(buildingBox(w, b.height, d, cx, b.height / 2, cz, tile, offset));

      // Muret côté avenue.
      const onStreet = Math.abs(b.x0) === STREET_HALF || Math.abs(b.x1) === STREET_HALF;
      if (onStreet) {
        const edge = Math.abs(b.x0) === STREET_HALF ? b.x0 : b.x1;
        const lx = edge + Math.sign(cx) * (LEDGE_WIDTH / 2);
        parts.push(buildingBox(LEDGE_WIDTH, LEDGE_HEIGHT, d, lx, b.height + LEDGE_HEIGHT / 2, cz, tile, [0, 0]));
      }
    });
    const merged = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return merged;
  }, [layout, tileWindows]);
}

function Buildings({ layout }: { layout: CityLayout }) {
  const textures = useMemo(() => windowTextures(), []);
  const geometry = useBuildingsGeometry(layout, textures.tileWindows);

  useEffect(
    () => () => {
      geometry.dispose();
      textures.map.dispose();
      textures.emissive.dispose();
    },
    [geometry, textures],
  );

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        map={textures.map}
        emissiveMap={textures.emissive}
        emissive="#ffffff"
        emissiveIntensity={1.25}
        roughness={0.85}
        metalness={0.15}
      />
    </mesh>
  );
}

// Réservoirs d'eau en bois sur les toits, si typiques de New York.
function WaterTowers({ layout }: { layout: CityLayout }) {
  const ref = useRef<InstancedMesh>(null);
  const spots = useMemo(
    () =>
      layout.blocks
        .filter((b) => b.waterTower)
        .map((b) => {
          const cx = (b.x0 + b.x1) / 2 + Math.sign(b.x0 + b.x1) * (b.x1 - b.x0) * 0.2;
          return [cx, b.height, (b.z0 + b.z1) / 2 + (b.z1 - b.z0) * 0.2] as const;
        }),
    [layout],
  );
  const geometry = useMemo(() => {
    const tank = new CylinderGeometry(1.7, 1.7, 3.4, 14).translate(0, 4.2, 0);
    const roof = new ConeGeometry(1.9, 1.4, 14).translate(0, 6.6, 0);
    const legs = [-1, 1].flatMap((x) =>
      [-1, 1].map((z) => new BoxGeometry(0.18, 2.5, 0.18).translate(x * 1.1, 1.25, z * 1.1)),
    );
    const merged = mergeGeometries([tank, roof, ...legs]);
    [tank, roof, ...legs].forEach((g) => g.dispose());
    return merged;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    spots.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.rotation.y = i;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [spots]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, spots.length]}>
      <meshStandardMaterial color="#3a2a22" roughness={0.9} />
    </instancedMesh>
  );
}

function Street({ layout }: { layout: CityLayout }) {
  const length = layout.zStart - layout.zEnd;
  const midZ = (layout.zStart + layout.zEnd) / 2;
  const dashes = Math.floor(length / 8);
  const lampCount = Math.floor(length / 22);
  const dashRef = useRef<InstancedMesh>(null);
  const lampRef = useRef<InstancedMesh>(null);
  const bulbRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new Matrix4();
    for (let i = 0; i < dashes; i++) {
      m.makeTranslation(0, 0.02, layout.zStart - i * 8);
      dashRef.current?.setMatrixAt(i, m);
    }
    for (let i = 0; i < lampCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = layout.zStart - i * 22;
      m.makeTranslation(side * (STREET_HALF - 1.2), 3.5, z);
      lampRef.current?.setMatrixAt(i, m);
      m.makeTranslation(side * (STREET_HALF - 2.2), 7, z);
      bulbRef.current?.setMatrixAt(i, m);
    }
    for (const ref of [dashRef, lampRef, bulbRef]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  }, [dashes, lampCount, layout.zStart]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]}>
        <planeGeometry args={[600, length + 400]} />
        <meshStandardMaterial color="#08090f" roughness={0.35} metalness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (STREET_HALF - 1.5), 0.12, midZ]}>
          <boxGeometry args={[3, 0.24, length]} />
          <meshStandardMaterial color="#171922" roughness={0.8} />
        </mesh>
      ))}
      <instancedMesh ref={dashRef} args={[undefined, undefined, dashes]}>
        <boxGeometry args={[0.25, 0.02, 3]} />
        <meshBasicMaterial color="#c9a227" />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[undefined, undefined, lampCount]}>
        <cylinderGeometry args={[0.1, 0.12, 7, 6]} />
        <meshStandardMaterial color="#20222c" />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, lampCount]}>
        <boxGeometry args={[1.4, 0.18, 0.4]} />
        <meshBasicMaterial color={new Color(3, 2.6, 1.9)} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

// Phares et feux arrière qui défilent dans l'avenue.
function Traffic({ layout }: { layout: CityLayout }) {
  const COUNT = 46;
  const ref = useRef<InstancedMesh>(null);
  const cars = useMemo(() => {
    const rand = seededRandom(42);
    const length = layout.zStart - layout.zEnd;
    return Array.from({ length: COUNT }, (_, i) => {
      const towardCamera = i % 2 === 0;
      return {
        towardCamera,
        x: (towardCamera ? -1 : 1) * (2.2 + (rand() < 0.5 ? 0 : 3.4)),
        z: layout.zEnd + rand() * length,
        speed: 14 + rand() * 12,
      };
    });
  }, [layout]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const head = new Color(3.2, 3, 2.7);
    const tail = new Color(3, 0.15, 0.1);
    cars.forEach((car, i) => mesh.setColorAt(i, car.towardCamera ? head : tail));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cars]);

  // Position calculée à partir du temps : pas d'état à faire évoluer.
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const length = layout.zStart - layout.zEnd;
    const matrix = new Matrix4();
    cars.forEach((car, i) => {
      const travelled = (car.towardCamera ? 1 : -1) * car.speed * clock.elapsedTime;
      const z = layout.zEnd + ((((car.z - layout.zEnd + travelled) % length) + length) % length);
      mesh.setMatrixAt(i, matrix.makeTranslation(car.x, 0.7, z));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[1.5, 0.22, 0.3]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

const SIGNS = [
  { text: "CLAUDE CODE", color: "#f97316" },
  { text: "THREE.JS", color: "#22d3ee" },
  { text: "NEXT.JS", color: "#f4f4f6" },
  { text: "TYPESCRIPT", color: "#3b82f6" },
  { text: "PANDA", color: "#f4f4f6" },
  { text: "REACT", color: "#22d3ee" },
  { text: "OPEN 24/7", color: "#ec4899" },
  { text: "WEBGL", color: "#8b5cf6" },
  { text: "DEPLOY", color: "#34d399" },
];

// Enseignes néon : en drapeau (verticales) ou à plat sur les façades.
function NeonSigns({ layout }: { layout: CityLayout }) {
  const signs = useMemo(() => {
    const out: {
      key: string;
      position: [number, number, number];
      rotationY: number;
      size: [number, number];
      vertical: boolean;
      sign: (typeof SIGNS)[number];
    }[] = [];
    let n = 0;
    for (let z = layout.zStart - 30; z > layout.zEnd + 40; z -= 17) {
      const side = n % 2 === 0 ? 1 : -1;
      const vertical = n % 3 !== 1;
      const sign = SIGNS[n % SIGNS.length];
      const y = 7 + ((n * 5) % 12);
      if (vertical) {
        out.push({
          key: `s${n}`,
          position: [side * (STREET_HALF - 1.1), y, z],
          rotationY: 0,
          size: [1.8, 7.2],
          vertical,
          sign,
        });
      } else {
        out.push({
          key: `s${n}`,
          position: [side * (STREET_HALF - 0.05), y, z],
          rotationY: -side * Math.PI * 0.5,
          size: [9, 2.25],
          vertical,
          sign,
        });
      }
      n++;
    }
    return out;
  }, [layout]);

  const textures = useMemo(
    () =>
      new Map(
        SIGNS.flatMap((s) => [
          [`${s.text}|v`, neonSignTexture(s.text, s.color, true)],
          [`${s.text}|h`, neonSignTexture(s.text, s.color, false)],
        ]),
      ),
    [],
  );
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  return (
    <group>
      {signs.map((s) => (
        <mesh key={s.key} position={s.position} rotation-y={s.rotationY}>
          <planeGeometry args={s.size} />
          <meshBasicMaterial
            map={textures.get(`${s.sign.text}|${s.vertical ? "v" : "h"}`)}
            color={new Color(1.6, 1.6, 1.6)}
            toneMapped={false}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export function City({ layout }: { layout: CityLayout }) {
  return (
    <group>
      <Buildings layout={layout} />
      <WaterTowers layout={layout} />
      <Street layout={layout} />
      <Traffic layout={layout} />
      <NeonSigns layout={layout} />
    </group>
  );
}
