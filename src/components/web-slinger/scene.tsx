"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Color, type Group, type PointLight } from "three";
import { Billboard } from "./billboard";
import { City } from "./city";
import { Director } from "./director";
import { Hero } from "./hero";
import { buildLayout } from "./layout";
import type { Slide } from "./slides";
import { useSlingerState } from "./store";

const NIGHT = "#070914";

type Props = {
  slides: Slide[];
  contact: { title: string; email: string };
};

function World({ slides, contact }: Props) {
  const layout = useMemo(() => buildLayout(slides.length), [slides.length]);
  const hero = useRef<Group>(null);
  const web = useRef<Group>(null);
  const rim = useRef<PointLight>(null);
  const key = useRef<PointLight>(null);
  const index = useSlingerState((s) => s.index);
  const target = useSlingerState((s) => s.target);
  const swinging = useSlingerState((s) => s.swinging);
  const active = swinging ? target : index;

  return (
    <>
      <color attach="background" args={[NIGHT]} />
      <fog attach="fog" args={[NIGHT, 70, 330]} />
      <hemisphereLight args={["#5b6ea8", "#120c18", 0.7]} />
      <directionalLight position={[-60, 120, 40]} intensity={0.55} color="#9db4ff" />
      <pointLight ref={rim} color="#e8ecff" intensity={260} distance={60} decay={1.6} position={[0, 40, 0]} />
      <pointLight ref={key} color="#ffe2c4" intensity={9} distance={14} decay={1.2} />

      <City layout={layout} />

      {slides.map((slide, i) => (
        <Billboard
          key={i}
          slide={slide}
          index={i}
          layout={layout.stops[i].billboard}
          active={i === active}
          contact={contact}
        />
      ))}

      <Hero ref={hero} />

      {/* Toile : cylindre de hauteur 1 posé sur sa base, étiré main → accroche. */}
      <group ref={web} visible={false}>
        <mesh position-y={0.5}>
          <cylinderGeometry args={[0.025, 0.025, 1, 6, 1]} />
          <meshBasicMaterial color={new Color(2.2, 2.2, 2.4)} toneMapped={false} />
        </mesh>
      </group>

      <Director layout={layout} heroRef={hero} webRef={web} rimLightRef={rim} keyLightRef={key} />
    </>
  );
}

export default function Scene(props: Props) {
  const [dpr, setDpr] = useState(1.75);

  return (
    <Canvas
      dpr={[1, dpr]}
      camera={{ fov: 42, near: 0.1, far: 700, position: [0, 110, 170] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
      <World {...props} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
