"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  type MeshBasicMaterial,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  VideoTexture,
} from "three";
import { BILLBOARD_HEIGHT as H, BILLBOARD_WIDTH as W, type Billboard as BillboardLayout } from "./layout";
import { type Slide, slideLink } from "./slides";
import { contactPosterTexture, paletteFor, projectPosterTexture } from "./textures";

type Props = {
  slide: Slide;
  index: number;
  layout: BillboardLayout;
  active: boolean;
  contact: { title: string; email: string };
};

// Image ou vidéo du projet si fournie, sinon visuel généré.
function useScreenTexture(slide: Slide, index: number, contact: Props["contact"]) {
  const poster = useMemo(
    () =>
      slide.kind === "contact"
        ? contactPosterTexture(contact.title, contact.email)
        : projectPosterTexture(slide.project, index),
    [slide, index, contact.title, contact.email],
  );
  useEffect(() => () => poster.dispose(), [poster]);

  const media = slide.kind === "project" ? slide.project.media : undefined;
  const [loaded, setLoaded] = useState<Texture | null>(null);

  useEffect(() => {
    if (!media?.video && !media?.image) return;
    let texture: Texture | null = null;
    let cancelled = false;
    let video: HTMLVideoElement | null = null;

    if (media.video) {
      video = document.createElement("video");
      Object.assign(video, { src: media.video, muted: true, loop: true, playsInline: true, crossOrigin: "anonymous" });
      video.addEventListener(
        "loadeddata",
        () => {
          if (cancelled || !video) return;
          texture = new VideoTexture(video);
          texture.colorSpace = SRGBColorSpace;
          setLoaded(texture);
        },
        { once: true },
      );
      video.play().catch(() => {});
    } else if (media.image) {
      new TextureLoader().load(media.image, (t) => {
        if (cancelled) return t.dispose();
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 8;
        texture = t;
        setLoaded(t);
      });
    }

    return () => {
      cancelled = true;
      video?.pause();
      video?.removeAttribute("src");
      texture?.dispose();
      setLoaded(null);
    };
  }, [media?.video, media?.image]);

  return loaded ?? poster;
}

const DIM = new Color(0.42, 0.42, 0.46);
const BRIGHT = new Color(1.15, 1.15, 1.15);

export function Billboard({ slide, index, layout, active, contact }: Props) {
  const map = useScreenTexture(slide, index, contact);
  const screen = useRef<MeshBasicMaterial>(null);
  const [c1] = paletteFor(index);
  const led = useMemo(() => new Color(c1).multiplyScalar(2.4), [c1]);
  const link = slideLink(slide);
  const legHeight = layout.center.y - H / 2 - layout.roof;

  // Le panneau visé s'allume, les autres restent en veille.
  useFrame((_, delta) => {
    screen.current?.color.lerp(active ? BRIGHT : DIM, 1 - Math.exp(-delta * 3));
  });

  const open = () => {
    if (active && link) window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <group position={layout.center} rotation-y={layout.yaw}>
      <mesh
        position-z={0.05}
        onClick={open}
        onPointerOver={() => {
          if (active && link) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial ref={screen} map={map} color={DIM} toneMapped={false} />
      </mesh>

      {/* Caisson et encadrement LED */}
      <mesh position-z={-0.5}>
        <boxGeometry args={[W + 1.2, H + 1.2, 0.9]} />
        <meshStandardMaterial color="#14151c" roughness={0.6} metalness={0.6} />
      </mesh>
      {[
        [0, H / 2 + 0.35, W + 0.9, 0.18],
        [0, -H / 2 - 0.35, W + 0.9, 0.18],
        [W / 2 + 0.35, 0, 0.18, H + 0.9],
        [-W / 2 - 0.35, 0, 0.18, H + 0.9],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.06]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color={led} toneMapped={false} />
        </mesh>
      ))}

      {/* Rampe de projecteurs au-dessus */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[(i - 2.5) * (W / 6), H / 2 + 1.1, 0.9]}>
          <boxGeometry args={[0.7, 0.25, 0.5]} />
          <meshBasicMaterial color={new Color(2.5, 2.3, 2)} toneMapped={false} />
        </mesh>
      ))}

      {/* Structure métallique jusqu'au toit */}
      {[-W / 3, 0, W / 3].map((x) => (
        <mesh key={x} position={[x, -H / 2 - legHeight / 2, -0.5]}>
          <boxGeometry args={[0.35, legHeight, 0.35]} />
          <meshStandardMaterial color="#1b1c24" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, -H / 2 - legHeight * 0.55, -0.5]}>
        <boxGeometry args={[W * 0.75, 0.22, 0.22]} />
        <meshStandardMaterial color="#1b1c24" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  );
}
