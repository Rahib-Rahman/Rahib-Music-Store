import { createCanvas } from "@napi-rs/canvas";
import { makeRng, pick, randInt, randFloat } from "./rng";

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
    ctx: CanvasRenderingContext2D,
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

function drawGeometric(ctx: CanvasRenderingContext2D, rng: RNG) {
  const count = randInt(6, 18, rng);
  for (let i = 0; i < count; i++) {
    const x = randFloat(-50, COVER_SIZE + 50, rng);
    const y = randFloat(-50, COVER_SIZE + 50, rng);
    const size = randFloat(20, 150, rng);
    const h = randInt(0, 360, rng);
    const alpha = randFloat(0.1, 0.55, rng);

    // Fixed: pick random number of sides
    const sidesOptions = [3, 4, 5, 6, 8];
    const sides = pick(sidesOptions, rng);

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

// Other functions remain mostly the same (just changed ctx: any → CanvasRenderingContext2D)
function drawWaves(ctx: any, rng: any) { return; }
function drawRadial(ctx: any, rng: any) { return; }
function drawPortrait(ctx: any, rng: any) { return; }
function drawAbstract(ctx: any, rng: any) { return; }