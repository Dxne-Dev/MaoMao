// The upload canvas — port of UploadCanvasView.swift.
//
// While the sequence engine is active this canvas draws the whole island body:
// card, dashed drop frame, drop text, progress bar, the choose card, the mascot
// and the file being sucked in. The island's own BotEngine canvas is hidden
// for the duration, because this canvas draws its own silhouette (`drawMochi`).
// That path is not BotEngine — change it together with src/mascot/ when swapping
// the character.

import { State } from "../core/state";
import {
  USC, eIn, eInOut, eOut, lerp, progressAt,
  type UploadEyeShape, type UploadFrame,
} from "./sequence";

const FONT = 'system-ui, "Segoe UI Variable Text", "Segoe UI", sans-serif';

const KEFF_RED = "#BD2828";
const KEFF_WHITE = "#FAF8F5";
const SKIN = "#DFC4AE";

let uploadKeffTile: HTMLCanvasElement | null = null;
function uploadKeffPattern(x: CanvasRenderingContext2D): CanvasPattern | null {
  if (typeof document === "undefined") return null;
  if (!uploadKeffTile) {
    uploadKeffTile = document.createElement("canvas");
    uploadKeffTile.width = uploadKeffTile.height = 16;
    const t = uploadKeffTile.getContext("2d");
    if (!t) return null;
    t.fillStyle = KEFF_WHITE;
    t.fillRect(0, 0, 16, 16);
    t.fillStyle = KEFF_RED;
    t.fillRect(0, 0, 8, 8);
    t.fillRect(8, 8, 8, 8);
    t.beginPath(); t.moveTo(8, 0); t.lineTo(16, 8); t.lineTo(8, 8); t.closePath(); t.fill();
    t.beginPath(); t.moveTo(0, 8); t.lineTo(8, 16); t.lineTo(8, 8); t.closePath(); t.fill();
  }
  return x.createPattern(uploadKeffTile, "repeat");
}

/** Mirrors the reference `rr()`: a rounded rect, radius clamped to the box. */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);
}

/** Superellipse body — port of usBodyPath(m, R). */
function bodyPath(ctx: CanvasRenderingContext2D, m: number, R: number): { rx: number; ry: number } {
  const mc = Math.max(0, Math.min(m, 1));
  const n = 2.15 + (5.5 - 2.15) * mc;
  const rx = R * (1.04 - 0.04 * mc);
  const ry = R * (0.97 - 0.03 * mc);
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const px = rx * Math.sign(ca) * Math.pow(Math.abs(ca), 2 / n);
    const py = ry * Math.sign(sa) * Math.pow(Math.abs(sa), 2 / n);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  return { rx, ry };
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = "left",
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  // SwiftUI's .leading / .center / .trailing anchors are vertically centred.
  ctx.textBaseline = "middle";
  ctx.fillText(s, x, y);
}

export interface UploadCanvasActions {
  /** Primary button — hand the file to the chat. */
  ask(): void;
  /** Secondary button. */
  cancel(): void;
}

export class UploadCanvas {
  /** Wrapper holding the canvas and the two invisible choose buttons. */
  readonly el: HTMLElement;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private overlay: HTMLElement;
  private sizedFor = 0;

  constructor(actions: UploadCanvasActions) {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "upload-canvas";

    // Invisible hit areas at the reference button positions. The labels are
    // painted on the canvas; these only catch the click.
    const mk = (x: number, w: number, onclick: () => void) => {
      const b = document.createElement("button");
      b.className = "upload-hit";
      b.style.left = `${x}px`;
      b.style.top = "113px";
      b.style.width = `${w}px`;
      b.style.height = "26px";
      b.addEventListener("click", onclick);
      return b;
    };
    this.overlay = document.createElement("div");
    this.overlay.id = "upload-overlay";
    this.overlay.append(mk(114, 168, actions.ask), mk(290, 120, actions.cancel));

    this.el = document.createElement("div");
    this.el.id = "upload-layer";
    this.el.append(this.canvas, this.overlay);

    this.ctx = this.canvas.getContext("2d");
  }

  /** `wallTime` in seconds drives the marching dashes, like the macOS timeline. */
  draw(f: UploadFrame, wallTime: number) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this.sizedFor !== dpr) {
      this.sizedFor = dpr;
      this.canvas.width = Math.round(USC.W * dpr);
      this.canvas.height = Math.round(USC.ISL_H * dpr);
      this.canvas.style.width = `${USC.W}px`;
      this.canvas.style.height = `${USC.ISL_H}px`;
    }
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, USC.W, USC.ISL_H);

    this.drawScene(ctx, f, wallTime);

    // The buttons only exist once the choose card has faded in.
    this.overlay.style.display = f.chooseAlpha > 0.5 ? "block" : "none";
  }

  // ── Scene ─────────────────────────────────────────────────────────────────

  private drawScene(ctx: CanvasRenderingContext2D, f: UploadFrame, wallTime: number) {
    // Island background.
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, USC.W, USC.ISL_H);

    // Card.
    ctx.save();
    rr(ctx, USC.CARD_X, USC.CARD_Y, USC.CARD_W, USC.CARD_H, USC.CARD_R);
    ctx.clip();
    ctx.fillStyle = "#0D0E10";
    ctx.fillRect(USC.CARD_X, USC.CARD_Y, USC.CARD_W, USC.CARD_H);

    // Green glow, fanning up from the bottom edge of the card.
    if (f.greenWash > 0) {
      const gx = USC.CARD_X + USC.CARD_W / 2;
      const gy = USC.CARD_Y + USC.CARD_H;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, USC.CARD_H * 1.5);
      g.addColorStop(0, `rgba(40,212,130,${f.greenWash * 0.9})`);
      g.addColorStop(0.55, `rgba(40,212,130,${f.greenWash * 0.3})`);
      g.addColorStop(1, "rgba(40,212,130,0)");
      ctx.fillStyle = g;
      ctx.fillRect(USC.CARD_X, USC.CARD_Y, USC.CARD_W, USC.CARD_H);
    }
    ctx.restore();

    // Dashed border, marching left to right at ~20 pt/s.
    if (f.zoneAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = f.zoneAlpha;
      ctx.strokeStyle = f.zoneOver ? "rgba(52,212,153,0.55)" : "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -wallTime * 20;
      rr(ctx, USC.CARD_X + 0.75, USC.CARD_Y + 0.75, USC.CARD_W - 1.5, USC.CARD_H - 1.5, USC.CARD_R - 0.5);
      ctx.stroke();
      ctx.restore();
    }

    if (f.zoneAlpha > 0 && f.textAlpha > 0) this.drawDropText(ctx, f);
    if (f.barAlpha > 0 || f.barReveal > 0) this.drawProgressBar(ctx, f);
    if (f.chooseAlpha > 0) this.drawChoose(ctx, f);

    this.drawMochi(ctx, f);
    if (f.fileVisible) this.drawFile(ctx, f);
  }

  // ── Drop zone text and chips ──────────────────────────────────────────────

  private drawDropText(ctx: CanvasRenderingContext2D, f: UploadFrame) {
    ctx.save();
    ctx.globalAlpha = f.textAlpha;
    text(ctx, "Drop your files here", USC.TEXT_X, USC.TEXT_Y - 4, `500 13px ${FONT}`, "#D5D7DB");

    let cx = USC.TEXT_X;
    for (const chip of ["PDF", "Images", "Code", "Docs"]) {
      // The macOS port measures chips the same rough way, so the row lines up.
      const w = chip.length * 6.5 + 16;
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      rr(ctx, cx, USC.TEXT_Y + 9, w, 18, 9);
      ctx.fill();
      text(ctx, chip, cx + 8, USC.TEXT_Y + 18, `500 11px ${FONT}`, "#B9BDC4");
      cx += w + 6;
    }
    ctx.restore();
  }

  // ── Progress bar ──────────────────────────────────────────────────────────

  private drawProgressBar(ctx: CanvasRenderingContext2D, f: UploadFrame) {
    ctx.save();
    ctx.globalAlpha = Math.max(f.barAlpha, 0.001);

    const x0 = USC.BAR_X0;
    const x1 = USC.BAR_X1;
    const by = USC.BAR_Y;
    const barLen = (x1 - x0) * f.barReveal;

    const name = State.droppedFile?.name ?? "file";
    text(ctx, `Uploading ${name}`, x0, by - 30, `500 12.5px ${FONT}`, "#A9ADB5");

    if (f.check > 0) {
      ctx.save();
      ctx.translate(x1 - 8, by - 30);
      ctx.scale(f.check, f.check);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#34D399";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-3.6, 0.2);
      ctx.lineTo(-1, 2.8);
      ctx.lineTo(3.8, -2.6);
      ctx.strokeStyle = "#07130E";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    } else {
      text(ctx, `${Math.round(f.progress * 100)} %`, x1, by - 30, `500 12.5px ${FONT}`, "#A9ADB5", "right");
    }

    // Track.
    if (barLen > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      rr(ctx, x0, by - 3, barLen, 6, 3);
      ctx.fill();
    }

    // Fill.
    const fx = lerp(x0, x1, f.progress);
    if (fx > x0 + 1) {
      const flashGreen = `rgb(${Math.round(lerp(52, 110, f.flash))},${Math.round(
        lerp(211, 231, f.flash),
      )},${Math.round(lerp(153, 183, f.flash))})`;
      const g = ctx.createLinearGradient(x0, 0, fx, 0);
      g.addColorStop(0, "#1FA87A");
      g.addColorStop(1, flashGreen);
      ctx.fillStyle = g;
      rr(ctx, x0, by - 3, fx - x0, 6, 3);
      ctx.fill();
    }

    // Glow trail, its length driven by how fast the bar is moving.
    if (f.progress > 0.01 && f.progress < 1) {
      const v =
        (progressAt(f.t + 0.01, USC.T_PROG_START, f.progEnd) -
          progressAt(f.t, USC.T_PROG_START, f.progEnd)) / 0.01;
      const tl = Math.max(8, Math.min(34, 8 + v * 40));
      const g = ctx.createLinearGradient(fx - tl, 0, fx, 0);
      g.addColorStop(0, "rgba(52,212,153,0)");
      g.addColorStop(1, "rgba(110,231,183,0.6)");
      ctx.save();
      ctx.filter = "blur(3px)";
      ctx.fillStyle = g;
      rr(ctx, fx - tl, by - 4, tl, 8, 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ── Choose card ───────────────────────────────────────────────────────────

  private drawChoose(ctx: CanvasRenderingContext2D, f: UploadFrame) {
    ctx.save();
    ctx.globalAlpha = f.chooseAlpha;
    ctx.translate(0, (1 - f.chooseAlpha) * 4);

    const name = State.droppedFile?.name ?? "file";
    text(ctx, `${name} is ready.`, 114, 80, `600 14px ${FONT}`, "#F5F6F8");
    text(ctx, "What do you want to do with it?", 114, 100, `400 12.5px ${FONT}`, "#9398A1");

    ctx.fillStyle = "#F5F6F8";
    rr(ctx, 114, 113, 168, 26, 13);
    ctx.fill();
    text(ctx, "Ask a question about it", 198, 126, `500 12.5px ${FONT}`, "#0B0C0E", "center");

    ctx.fillStyle = "rgba(255,255,255,0.09)";
    rr(ctx, 290, 113, 120, 26, 13);
    ctx.fill();
    text(ctx, "Cancel", 350, 126, `500 12.5px ${FONT}`, "#F1F2F4", "center");
    ctx.restore();
  }

  // ── Mochi (MaoMao) ───────────────────────────────────────────────────────

  private drawMochi(ctx: CanvasRenderingContext2D, f: UploadFrame) {
    const R = f.d / 2 / 1.04;
    const mc = Math.max(0, Math.min(f.morph, 1));

    ctx.save();
    ctx.translate(f.x, f.y + f.hop);
    ctx.rotate(f.tilt);
    ctx.scale(f.sx, f.sy);

    const { rx, ry } = bodyPath(ctx, f.morph, R);

    // 1. Keffiyeh drapes behind
    const kp = new Path2D();
    kp.moveTo(-rx * 1.02, -ry * 0.45);
    kp.bezierCurveTo(-rx * 1.05, -ry * 1.18, rx * 1.05, -ry * 1.18, rx * 1.02, -ry * 0.45);
    kp.bezierCurveTo(rx * 0.85, -ry * 0.65, -rx * 0.85, -ry * 0.65, -rx * 1.02, -ry * 0.45);
    kp.closePath();
    for (const sd of [-1, 1]) {
      kp.moveTo(sd * rx * 0.85, -ry * 0.50);
      kp.bezierCurveTo(sd * rx * 1.25, -ry * 0.10, sd * rx * 1.28, ry * 0.50, sd * rx * 1.08, ry * 0.98);
      kp.lineTo(sd * rx * 0.96, ry * 0.92);
      kp.lineTo(sd * rx * 0.84, ry * 0.98);
      kp.lineTo(sd * rx * 0.72, ry * 0.90);
      kp.bezierCurveTo(sd * rx * 0.78, ry * 0.40, sd * rx * 0.85, -ry * 0.10, sd * rx * 0.68, -ry * 0.45);
      kp.closePath();
    }
    ctx.fillStyle = KEFF_WHITE;
    ctx.fill(kp);
    ctx.save();
    ctx.clip(kp);
    const pat = uploadKeffPattern(ctx);
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(-rx * 1.5, -ry * 1.5, rx * 3, ry * 3);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke(kp);

    // 2. Heather Grey Balaclava Body
    const bg = ctx.createLinearGradient(rx * 0.7, -ry * 0.9, -rx * 0.8, ry * 0.9);
    bg.addColorStop(0, "#A8ADB8");
    bg.addColorStop(0.5, "#8E939D");
    bg.addColorStop(1, "#757A85");
    ctx.fillStyle = bg;
    bodyPath(ctx, f.morph, R);
    ctx.fill();

    // Edge shadow
    const sg = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.3);
    sg.addColorStop(0, "rgba(0,0,0,0)");
    sg.addColorStop(0.62, "rgba(0,0,0,0)");
    sg.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = sg;
    bodyPath(ctx, f.morph, R);
    ctx.fill();

    // Body clip for mouth & eyes
    ctx.save();
    bodyPath(ctx, f.morph, R);
    ctx.clip();

    // Top rim, once box-shaped enough
    if (mc > 0.3) {
      const a = Math.max(0, Math.min(1, (mc - 0.3) / 0.7));
      ctx.beginPath();
      ctx.moveTo(-rx * 0.72, -ry + 0.9);
      ctx.lineTo(rx * 0.72, -ry + 0.9);
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * a})`;
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Mouth hole
    const mh = f.mouth * R * mc;
    if (mh > 0.3) {
      const mw = 2 * rx - 0.24 * R;
      const mx = -mw / 2;
      const my = -ry + 0.1 * R;
      const g = ctx.createLinearGradient(0, my, 0, my + mh);
      g.addColorStop(0, "#030304");
      g.addColorStop(1, "#101114");
      ctx.fillStyle = g;
      rr(ctx, mx, my, mw, mh, Math.min(mw / 2, mh / 2));
      ctx.fill();
      if (mh > 4) {
        const r = Math.min(mw / 2, mh / 2);
        ctx.beginPath();
        ctx.moveTo(mx + r, my + mh + 0.5);
        ctx.lineTo(mx + mw - r, my + mh + 0.5);
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    // 3. MaoMao Sleepy / Chill Eyes
    const ew = R * 0.32;
    const eh = R * (0.50 - 0.12 * mc);
    const ey = R * (0.02 + 0.28 * mc);
    const sp = R * 0.36;
    const lx = f.lookX * R * (0.34 - 0.08 * mc);
    const ly = f.lookY * R * (0.16 - 0.09 * mc);

    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.translate(sd * sp + lx, ey + ly);
      drawMaoMaoEye(ctx, f.eye, ew, eh);
      ctx.restore();
    }

    ctx.restore(); // body clip
    ctx.restore(); // transform
  }

  // ── The file, and the suction ─────────────────────────────────────────────

  private drawFile(ctx: CanvasRenderingContext2D, f: UploadFrame) {
    const cx = f.cursorX;
    const cy = f.cursorY + 14;

    if (f.suck <= 0) {
      ctx.save();
      ctx.globalAlpha = 0.92;
      drawDoc(ctx, cx, cy, 1, 1);
      ctx.restore();
      return;
    }

    const m = f.mouthRect;
    const W0 = 34;
    const H0 = 42;
    const p = eIn(f.suck);
    const topY = lerp(cy - H0 / 2, m.y - 2, eInOut(f.suck));
    const hs = lerp(1.08, 0.55, eInOut(f.suck));
    const Hh = H0 * hs;
    const sc = lerp(1, 0.55, p);
    const q = eOut(f.suck);
    const fCx = lerp(cx, m.x + m.w / 2, eOut(f.suck));
    const wob = Math.sin(f.suck * Math.PI * 2) * 0.1 * (1 - p);
    const clipY = m.y + m.h * 0.5;

    // The sheet is drawn as 28 horizontal strips, each narrowed towards the
    // mouth, so the page appears to funnel in. Everything below the mouth line
    // is clipped away — that is what makes it look swallowed.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, USC.W, clipY);
    ctx.clip();

    for (let i = 0; i < 28; i++) {
      const v0 = i / 28;
      const wsc = lerp(1, lerp(0.92, (0.22 * m.w) / W0, Math.pow(v0, 1.2)), q) * sc;
      const yy = topY + v0 * Hh;
      const hh = Hh / 28 + 0.6;

      ctx.save();
      ctx.translate(fCx, yy);
      ctx.rotate(wob);
      ctx.beginPath();
      ctx.rect((-W0 * wsc) / 2, 0, W0 * wsc, hh);
      ctx.clip();
      ctx.translate(-fCx, -yy);
      drawDoc(ctx, fCx, topY + Hh / 2, wsc, hs);
      ctx.restore();
    }
    ctx.restore();

    // Green crumbs pulled in with the file.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.6;
      const k = Math.max(0, Math.min(1, (f.suck - i * 0.08) / 0.7));
      if (k <= 0 || k >= 1) continue;
      const sx0 = cx + Math.cos(a) * 24;
      const sy0 = cy + Math.sin(a) * 24;
      const ex = m.x + m.w / 2;
      const ey = m.y + m.h * 0.3;
      const kk = Math.pow(k, 0.7);
      const px = lerp(sx0, ex, kk);
      const py = lerp(sy0, ey, kk) - Math.sin(Math.PI * k) * 6;
      const rad = 2.2 * (1 - k * 0.5);
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(52,212,153,${1 - k})`;
      ctx.fill();
    }
  }
}

function drawMaoMaoEye(ctx: CanvasRenderingContext2D, shape: UploadEyeShape, w: number, h: number) {
  // 1. Padded beige rim
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 1.08, h * 1.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.85, h * 0.86, 0, 0, Math.PI * 2);
  ctx.clip();

  // 2. Sclera
  ctx.fillStyle = "#FAF8F5";
  ctx.fillRect(-w, -h, w * 2, h * 2);

  if (shape === "content") {
    ctx.fillStyle = SKIN;
    ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.strokeStyle = "#16171A";
    ctx.lineWidth = w * 0.42;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, h * 0.20, w * 0.62, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (shape === "cup") {
    // Wide open on gulp
    const pupilR = Math.min(w, h) * 0.65;
    ctx.fillStyle = "#16171A";
    ctx.beginPath();
    ctx.arc(0, 0, pupilR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(-pupilR * 0.35, -pupilR * 0.35, pupilR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Standard chill / sleepy eye with droopy eyelid
    const pupilR = Math.min(w, h) * 0.52;
    ctx.fillStyle = "#16171A";
    ctx.beginPath();
    ctx.arc(0, h * 0.12, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Dual highlights
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(-pupilR * 0.32, h * 0.12 - pupilR * 0.32, pupilR * 0.30, 0, Math.PI * 2);
    ctx.fill();

    // Droopy beige lid
    const lidY = -h * 0.05;
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.moveTo(-w, -h);
    ctx.lineTo(w, -h);
    ctx.lineTo(w, lidY);
    ctx.quadraticCurveTo(0, lidY + h * 0.1, -w, lidY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(90,60,40,0.35)";
    ctx.lineWidth = Math.max(1, w * 0.06);
    ctx.beginPath();
    ctx.moveTo(-w * 0.75, lidY);
    ctx.quadraticCurveTo(0, lidY + h * 0.1, w * 0.75, lidY);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Document icon ───────────────────────────────────────────────────────────

/**
 * The generic sheet with a folded corner. macOS swaps in the real file icon from
 * NSWorkspace; Windows has no equivalent reachable from the webview, so this is
 * the shape in every case — it is the same fallback the Swift draws.
 */
function drawDoc(ctx: CanvasRenderingContext2D, cx: number, cy: number, wsc: number, hsc: number) {
  const w = 34 * wsc;
  const h = 42 * hsc;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const fold = 8 * Math.min(wsc, hsc);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.moveTo(x + 2, y);
  ctx.lineTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w, y + h - 2);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 2, y + h);
  ctx.lineTo(x + 2, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 2);
  ctx.lineTo(x, y + 2);
  ctx.quadraticCurveTo(x, y, x + 2, y);
  ctx.closePath();
  ctx.fillStyle = "#F4F4F6";
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(x + w - fold, y);
  ctx.lineTo(x + w - fold, y + fold);
  ctx.lineTo(x + w, y + fold);
  ctx.closePath();
  ctx.fillStyle = "#D5D6DB";
  ctx.fill();

  ctx.fillStyle = "#3B82F5";
  rr(ctx, x + w * 0.18, y + h * 0.58, w * 0.64, h * 0.16, 2);
  ctx.fill();
}
