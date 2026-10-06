import {
  CanvasTexture,
  type ColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import type { Project } from "@/data/profile";

// ---------------------------------------------------------------------------
// Toutes les textures de la scène sont dessinées sur canvas : pas d'asset à
// télécharger, et les panneaux se mettent à jour avec src/data/profile.ts.
// ---------------------------------------------------------------------------

function canvas(width: number, height: number) {
  const el = document.createElement("canvas");
  el.width = width;
  el.height = height;
  return [el, el.getContext("2d")!] as const;
}

function toTexture(el: HTMLCanvasElement, colorSpace: ColorSpace = SRGBColorSpace) {
  const texture = new CanvasTexture(el);
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  return texture;
}

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

const displayFont = () => cssFont("--font-space-grotesk", "system-ui, sans-serif");
const bodyFont = () => cssFont("--font-inter", "system-ui, sans-serif");

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Couleurs par projet, alignées sur les tokens --accent / --accent-secondary.
const PALETTES = [
  ["#8b5cf6", "#22d3ee"],
  ["#f97316", "#facc15"],
  ["#22d3ee", "#34d399"],
  ["#ec4899", "#8b5cf6"],
  ["#34d399", "#22d3ee"],
  ["#facc15", "#f97316"],
];

export function paletteFor(index: number) {
  return PALETTES[index % PALETTES.length];
}

// Panda dessiné en vectoriel, réutilisé par l'emblème et le panneau contact.
function drawPanda(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, ink: string, paper: string) {
  ctx.save();
  ctx.fillStyle = ink;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * r * 0.72, cy - r * 0.72, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fillStyle = paper;
  ctx.fill();
  ctx.lineWidth = r * 0.1;
  ctx.strokeStyle = ink;
  ctx.stroke();

  ctx.fillStyle = ink;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * r * 0.38, cy - r * 0.02);
    ctx.rotate(side * -0.6);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.2, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx + side * r * 0.36, cy - r * 0.08, r * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = paper;
    ctx.fill();
    ctx.fillStyle = ink;
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.32, r * 0.13, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.4);
  ctx.quadraticCurveTo(cx - r * 0.12, cy + r * 0.56, cx - r * 0.24, cy + r * 0.48);
  ctx.moveTo(cx, cy + r * 0.4);
  ctx.quadraticCurveTo(cx + r * 0.12, cy + r * 0.56, cx + r * 0.24, cy + r * 0.48);
  ctx.stroke();
  ctx.restore();
}

export function pandaEmblemTexture() {
  const [el, ctx] = canvas(256, 256);
  drawPanda(ctx, 128, 140, 92, "#0b0b0f", "#f4f4f6");
  return toTexture(el);
}

// Tissu de la combinaison : fond uni + motif de toile (méridiens et arcs).
export function suitTexture(base: string, line: string) {
  const [el, ctx] = canvas(512, 512);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.5;
  const cols = 8;
  const rows = 8;
  const cw = 512 / cols;
  const rh = 512 / rows;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cw, 0);
    ctx.lineTo(c * cw, 512);
    ctx.stroke();
  }
  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cw, r * rh);
      ctx.quadraticCurveTo(c * cw + cw / 2, r * rh - rh * 0.28, (c + 1) * cw, r * rh);
      ctx.stroke();
    }
  }
  const texture = toTexture(el);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  return texture;
}

// Façades : une tuile de 16×16 fenêtres dont une partie est allumée.
// Le coin (0,0) de la tuile est toujours du mur, utilisé pour les toits.
export function windowTextures(seed = 7) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const size = 512;
  const cells = 16;
  const cell = size / cells;
  const [wallEl, wall] = canvas(size, size);
  const [glowEl, glow] = canvas(size, size);
  wall.fillStyle = "#151826";
  wall.fillRect(0, 0, size, size);
  glow.fillStyle = "#000";
  glow.fillRect(0, 0, size, size);

  const warm = ["#ffd59a", "#ffe7c2", "#ffc46b"];
  const cool = ["#cfe6ff", "#a9d2ff", "#e6f0ff"];
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const wx = x * cell + 6;
      const wy = y * cell + 5;
      const ww = cell - 12;
      const wh = cell - 11;
      wall.fillStyle = "#0b0d16";
      wall.fillRect(wx, wy, ww, wh);
      if (rand() < 0.32) {
        const palette = rand() < 0.7 ? warm : cool;
        glow.globalAlpha = 0.35 + rand() * 0.65;
        glow.fillStyle = palette[Math.floor(rand() * palette.length)];
        glow.fillRect(wx, wy, ww, wh);
      }
    }
  }
  const map = toTexture(wallEl);
  const emissive = toTexture(glowEl);
  for (const t of [map, emissive]) t.wrapS = t.wrapT = RepeatWrapping;
  return { map, emissive, tileWindows: cells };
}

// Visuel « capture d'écran » généré quand un projet n'a pas encore de média.
export function projectPosterTexture(project: Project, index: number) {
  const W = 1600;
  const H = 900;
  const [el, ctx] = canvas(W, H);
  const [c1, c2] = paletteFor(index);
  const display = displayFont();
  const body = bodyFont();

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#07070d");
  bg.addColorStop(1, "#141428");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const halo = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, W * 0.6);
  halo.addColorStop(0, `${c1}66`);
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // Fenêtre de navigateur.
  const bx = 80;
  const by = 70;
  const bw = W - 160;
  const bh = H - 140;
  roundRect(ctx, bx, by, bw, bh, 28);
  ctx.fillStyle = "#0c0c16";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#2a2a3d";
  ctx.stroke();

  ctx.save();
  roundRect(ctx, bx, by, bw, bh, 28);
  ctx.clip();
  ctx.fillStyle = "#12121f";
  ctx.fillRect(bx, by, bw, 64);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(bx + 40 + i * 30, by + 32, 9, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
  roundRect(ctx, bx + 160, by + 16, bw - 320, 32, 16);
  ctx.fillStyle = "#1c1c2c";
  ctx.fill();
  ctx.fillStyle = "#9696a8";
  ctx.font = `500 18px ${body}`;
  const url = (project.demoUrl ?? project.githubUrl ?? "").replace(/^https?:\/\//, "");
  ctx.fillText(url, bx + 184, by + 38);
  ctx.restore();

  // Contenu.
  const px = bx + 70;
  ctx.fillStyle = c1;
  ctx.font = `600 26px ${display}`;
  ctx.fillText(String(index + 1).padStart(2, "0") + "  ·  PROJECT", px, by + 150);

  ctx.fillStyle = "#f4f4f6";
  ctx.font = `700 76px ${display}`;
  const titleLines = wrapLines(ctx, project.title, 860);
  titleLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, px, by + 240 + i * 84));

  const afterTitle = by + 240 + Math.min(titleLines.length, 2) * 84;
  ctx.fillStyle = "#b4b4c4";
  ctx.font = `400 30px ${body}`;
  wrapLines(ctx, project.description, 820)
    .slice(0, 4)
    .forEach((line, i) => ctx.fillText(line, px, afterTitle + 20 + i * 44));

  ctx.font = `600 24px ${body}`;
  let chipX = px;
  const chipY = by + bh - 110;
  for (const tech of project.stack) {
    const w = ctx.measureText(tech).width + 44;
    roundRect(ctx, chipX, chipY, w, 52, 26);
    ctx.fillStyle = "#1a1a2b";
    ctx.fill();
    ctx.strokeStyle = `${c2}aa`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#e4e4ee";
    ctx.fillText(tech, chipX + 22, chipY + 34);
    chipX += w + 14;
  }

  // Maquette d'interface abstraite à droite.
  const mx = bx + bw - 520;
  const my = by + 120;
  const grad = ctx.createLinearGradient(mx, my, mx + 440, my + 560);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  roundRect(ctx, mx, my, 440, 250, 22);
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const x = mx + 30 + i * 38;
    const y = my + 190 - Math.sin(i * 0.9 + index) * 40 - i * 9;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    roundRect(ctx, mx + i * 152, my + 280, 136, 130, 18);
    ctx.fillStyle = "#1a1a2b";
    ctx.fill();
    roundRect(ctx, mx + i * 152 + 18, my + 300, 60, 14, 7);
    ctx.fillStyle = i === 0 ? c1 : "#3a3a52";
    ctx.fill();
    roundRect(ctx, mx + i * 152 + 18, my + 330, 100, 40, 10);
    ctx.fillStyle = "#26263a";
    ctx.fill();
  }
  roundRect(ctx, mx, my + 440, 440, 70, 18);
  ctx.fillStyle = "#1a1a2b";
  ctx.fill();

  return toTexture(el);
}

export function contactPosterTexture(title: string, email: string) {
  const W = 1600;
  const H = 900;
  const [el, ctx] = canvas(W, H);
  const display = displayFont();
  const body = bodyFont();

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0b14");
  bg.addColorStop(1, "#1d1036");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Toile d'araignée stylisée en fond.
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 3;
  const cx = W * 0.78;
  const cy = H * 0.5;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900);
    ctx.stroke();
  }
  for (let r = 80; r < 900; r += 90) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(cx + Math.cos(a - 0.26) * r * 0.9, cy + Math.sin(a - 0.26) * r * 0.9, x, y);
    }
    ctx.stroke();
  }

  drawPanda(ctx, cx, cy, 190, "#0b0b0f", "#f4f4f6");

  ctx.fillStyle = "#8b5cf6";
  ctx.font = `600 30px ${display}`;
  ctx.fillText("WEB SLINGER  ·  CONTACT", 120, 230);
  ctx.fillStyle = "#f4f4f6";
  ctx.font = `700 104px ${display}`;
  wrapLines(ctx, title, 820).forEach((line, i) => ctx.fillText(line, 120, 360 + i * 112));
  ctx.fillStyle = "#22d3ee";
  ctx.font = `500 44px ${body}`;
  ctx.fillText(email, 120, 690);

  return toTexture(el);
}

// Enseignes lumineuses décoratives (texte néon sur fond sombre).
export function neonSignTexture(text: string, color: string, vertical = false) {
  const W = vertical ? 160 : 640;
  const H = vertical ? 640 : 160;
  const [el, ctx] = canvas(W, H);
  ctx.fillStyle = "#06060c";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const font = displayFont();
  if (vertical) {
    const letters = text.replace(/\s+/g, "").slice(0, 8).split("");
    ctx.font = `700 64px ${font}`;
    const step = (H - 80) / letters.length;
    letters.forEach((letter, i) => ctx.fillText(letter, W / 2, 40 + step * (i + 0.5)));
  } else {
    let size = 76;
    ctx.font = `700 ${size}px ${font}`;
    while (ctx.measureText(text).width > W - 70 && size > 20) {
      size -= 4;
      ctx.font = `700 ${size}px ${font}`;
    }
    ctx.fillText(text, W / 2, H / 2 + 4);
  }
  return toTexture(el);
}
