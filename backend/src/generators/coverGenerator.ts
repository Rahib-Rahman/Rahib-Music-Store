import { createCanvas } from "@napi-rs/canvas";
import { makeRng, pick, randInt, randFloat } from "./rng";
import {Buffer} from "buffer";

type RNG = ReturnType<typeof makeRng>;

const COVER_SIZE = 400;

interface CoverOptions {
  title: string;
  artist: string;
  seed: string;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h},${s}%,${l}%)`;
}

type ArtStyle = "geometric" | "wave" | "radial" | "portrait" | "abstract";

export function generateCoverBuffer(opts: CoverOptions): Buffer {
  const canvas = createCanvas(COVER_SIZE, COVER_SIZE);
  const ctx = canvas.getContext("2d");
  const rng = makeRng(opts.seed);

  const style = pick<ArtStyle>(
      ["geometric", "wave", "radial", "portrait", "abstract"],
      rng
  );

  // Background gradient
  const h1 = randInt(0, 360, rng);
  const h2 = (h1 + randInt(30, 180, rng)) % 360;
  const grad = ctx.createLinearGradient(
      randFloat(0, COVER_SIZE, rng),
      randFloat(0, COVER_SIZE, rng),
      randFloat(0, COVER_SIZE, rng),
      randFloat(0, COVER_SIZE, rng)
  );
  grad.addColorStop(0, hsl(h1, 70, 25));
  grad.addColorStop(0.5, hsl((h1 + h2) / 2, 60, 15));
  grad.addColorStop(1, hsl(h2, 75, 20));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, COVER_SIZE, COVER_SIZE);

  // Art layer
  switch (style) {
    case "geometric": drawGeometric(ctx, rng); break;
    case "wave":      drawWaves(ctx, rng);     break;
    case "radial":    drawRadial(ctx, rng);    break;
    case "portrait":  drawPortrait(ctx, rng);  break;
    case "abstract":  drawAbstract(ctx, rng);  break;
  }

  // Dark overlay for text readability
  const overlay = ctx.createLinearGradient(0, COVER_SIZE * 0.5, 0, COVER_SIZE);
  overlay.addColorStop(0, "rgba(0,0,0,0)");
  overlay.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, COVER_SIZE, COVER_SIZE);

  // Artist name
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `bold 26px sans-serif`;
  ctx.textAlign = "center";
  wrapText(ctx, opts.artist.toUpperCase(), COVER_SIZE / 2, COVER_SIZE - 72, COVER_SIZE - 32, 30);

  // Song title
  ctx.fillStyle = "#ffffff";
  ctx.font = `20px sans-serif`;
  wrapText(ctx, opts.title, COVER_SIZE / 2, COVER_SIZE - 24, COVER_SIZE - 32, 24);

  return canvas.toBuffer("image/png") as Buffer;
}

function wrapText(
    ctx: ReturnType<typeof createCanvas>["getContext"] extends (c: "2d") => infer R ? R : never,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const startY = y - (lines.length - 1) * lineHeight;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }
}

function drawGeometric(ctx: any, rng: RNG) {
  const count = randInt(6, 18, rng);
  for (let i = 0; i < count; i++) {
    const x = randFloat(-50, COVER_SIZE + 50, rng);
    const y = randFloat(-50, COVER_SIZE + 50, rng);
    const size = randFloat(20, 150, rng);
    const h = randInt(0, 360, rng);
    const alpha = randFloat(0.1, 0.55, rng);
    const sides = pick([3][4][5][6][8], rng);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(randFloat(0, Math.PI * 2, rng));
    ctx.beginPath();
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = hsl(h, 70, 55);
    ctx.fill();
    ctx.restore();
  }
}

function drawWaves(ctx: any, rng: RNG) {
  const waveCount = randInt(5, 12, rng);
  for (let w = 0; w < waveCount; w++) {
    const yBase = (w / waveCount) * COVER_SIZE;
    const amp   = randFloat(15, 60, rng);
    const freq  = randFloat(0.01, 0.04, rng);
    const phase = randFloat(0, Math.PI * 2, rng);
    const h     = randInt(0, 360, rng);
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= COVER_SIZE; x += 4) {
      ctx.lineTo(x, yBase + Math.sin(x * freq + phase) * amp);
    }
    ctx.lineTo(COVER_SIZE, COVER_SIZE);
    ctx.lineTo(0, COVER_SIZE);
    ctx.closePath();
    ctx.fillStyle = hsl(h, 65, 40);
    ctx.globalAlpha = randFloat(0.15, 0.4, rng);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawRadial(ctx: any, rng: RNG) {
  const rings = randInt(4, 10, rng);
  const cx = COVER_SIZE / 2 + randFloat(-60, 60, rng);
  const cy = COVER_SIZE / 2 + randFloat(-60, 60, rng);
  for (let r = rings; r > 0; r--) {
    const radius = (r / rings) * COVER_SIZE * 0.75;
    const h = randInt(0, 360, rng);
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    radGrad.addColorStop(0, hsl(h, 80, 60));
    radGrad.addColorStop(1, hsl((h + 40) % 360, 60, 20));
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = radGrad;
    ctx.globalAlpha = randFloat(0.2, 0.5, rng);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const spokes = randInt(6, 16, rng);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  for (let s = 0; s < spokes; s++) {
    const angle = (s / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * COVER_SIZE, cy + Math.sin(angle) * COVER_SIZE);
    ctx.stroke();
  }
}

function drawPortrait(ctx: any, rng: RNG) {
  const cx = COVER_SIZE / 2;
  const h  = randInt(0, 360, rng);
  ctx.save();
  ctx.globalAlpha = 0.6;
  const bodyGrad = ctx.createRadialGradient(cx, 260, 10, cx, 280, 120);
  bodyGrad.addColorStop(0, hsl(h, 60, 50));
  bodyGrad.addColorStop(1, hsl((h + 30) % 360, 50, 25));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 310, 80 + randFloat(-10, 20, rng), 130, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
      cx + randFloat(-10, 10, rng),
      170 + randFloat(-10, 10, rng),
      55 + randFloat(-5, 15, rng),
      0, Math.PI * 2
  );
  ctx.fillStyle = hsl((h + 20) % 360, 55, 55);
  ctx.fill();
  ctx.restore();
  const glow = ctx.createRadialGradient(cx, 200, 10, cx, 200, 200);
  glow.addColorStop(0, `hsla(${h},80%,70%,0.3)`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, COVER_SIZE, COVER_SIZE);
}

function drawAbstract(ctx: any, rng: RNG) {
  const count = randInt(4, 10, rng);
  for (let i = 0; i < count; i++) {
    const h = randInt(0, 360, rng);
    ctx.beginPath();
    ctx.moveTo(randFloat(0, COVER_SIZE, rng), randFloat(0, COVER_SIZE, rng));
    ctx.bezierCurveTo(
        randFloat(0, COVER_SIZE, rng), randFloat(0, COVER_SIZE, rng),
        randFloat(0, COVER_SIZE, rng), randFloat(0, COVER_SIZE, rng),
        randFloat(0, COVER_SIZE, rng), randFloat(0, COVER_SIZE, rng)
    );
    ctx.strokeStyle = hsl(h, 80, 60);
    ctx.lineWidth = randFloat(2, 15, rng);
    ctx.globalAlpha = randFloat(0.2, 0.7, rng);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const dots = randInt(20, 60, rng);
  for (let d = 0; d < dots; d++) {
    const h = randInt(0, 360, rng);
    ctx.beginPath();
    ctx.arc(
        randFloat(0, COVER_SIZE, rng),
        randFloat(0, COVER_SIZE, rng),
        randFloat(1, 12, rng),
        0, Math.PI * 2
    );
    ctx.fillStyle = hsl(h, 75, 60);
    ctx.globalAlpha = randFloat(0.3, 0.8, rng);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
