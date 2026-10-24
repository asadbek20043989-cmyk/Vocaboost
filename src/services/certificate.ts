import { Certificate } from '../types';
import { drawQr } from './qr';

// Gorizontal (A4 albom) sertifikat. Har bir sertifikatda o'z QR kodi bor: skaner qilinsa, shu sertifikat sahifasi ochiladi.
export const CERT_W = 1754;
export const CERT_H = 1240;
/** 9:16 (tik) format: Telegram Stories va telefon ekrani uchun */
export const CERT_STORY_W = 1080;
export const CERT_STORY_H = 1920;
/** Har bir sertifikatning pastki o'rtasiga yoziladigan bot manzili */
export const CERT_BOT = '@VocaBoostProBot';
// O'lcham sertifikat formatiga qarab chizish paytida o'zgaradi (16:9 yoki 9:16)
let W = CERT_W;
let H = CERT_H;

type Deco = 'bronze' | 'silver' | 'gold' | 'platinum' | 'champion' | 'active' | 'marathon' | 'thanks' | 'trust' | 'growth' | 'wisdom' | 'speed' | 'reviewer' | 'expert' | 'consistent' | 'limitless';

interface Tpl {
  name: string;
  ribbonText: string;
  deco: Deco;
  frame: [string, string, string]; // och, o'rta, to'q
  accent: string; // "Boost" va F.I.SH. rangi
  head: [string, string]; // SERTIFIKAT gradienti (tepa, past)
  ribbon: [string, string, string]; // lenta: yorqin, asosiy, qirra
  ribbonInk: string;
  nameGrad: [string, string];
  wreath: string | null; // gul (lavr) rangi
  crown?: boolean;
  corner?: string; // burchak to'ldirish rangi
}

export const TEMPLATES: Record<string, Tpl> = {
  bronze: { name: 'Bronza', ribbonText: 'BRONZA', deco: 'bronze', frame: ['#F6B77A', '#E8923A', '#9A5420'], accent: '#E8923A', head: ['#F5B37A', '#C26A2E'], ribbon: ['#F0A468', '#C8702F', '#8A4A1D'], ribbonInk: '#2B1608', nameGrad: ['#F2A767', '#BE6A2C'], wreath: null },
  silver: { name: 'Kumush', ribbonText: 'KUMUSH', deco: 'silver', frame: ['#E8F1F8', '#A9C3D9', '#5F7C95'], accent: '#C9D8E6', head: ['#FFFFFF', '#9FB4C7'], ribbon: ['#E6ECF2', '#A9B6C3', '#6B7886'], ribbonInk: '#1B2530', nameGrad: ['#F4F8FC', '#9FB1C4'], wreath: '#C3D0DC' },
  gold: { name: 'Oltin', ribbonText: 'OLTIN', deco: 'gold', frame: ['#FFE58A', '#F2B705', '#A8730A'], accent: '#F5C21B', head: ['#FFE98F', '#D79B0A'], ribbon: ['#FFE079', '#E6A912', '#9A6A08'], ribbonInk: '#2E1F02', nameGrad: ['#FFE48A', '#D9A10E'], wreath: '#E9B820' },
  platinum: { name: 'Platina', ribbonText: 'PLATINA', deco: 'platinum', frame: ['#D4EEFF', '#8EC5E8', '#3F7FA6'], accent: '#8EC5E8', head: ['#EAF7FF', '#6FA9CF'], ribbon: ['#A9D4F0', '#6BA6CC', '#3A6E92'], ribbonInk: '#08202F', nameGrad: ['#DDF1FF', '#78B2D8'], wreath: '#A9D2EC' },
  champion: { name: 'Chempion', ribbonText: 'CHEMPION', deco: 'champion', frame: ['#FFE08A', '#F2A91B', '#B4540E'], accent: '#F5B83A', head: ['#FFE08A', '#D58A12'], ribbon: ['#E0443F', '#B01C26', '#6E0E16'], ribbonInk: '#FFD978', nameGrad: ['#FFE08A', '#D58A12'], wreath: '#F2B33A', crown: true, corner: '#A3151F' },
  active: { name: 'Eng faol', ribbonText: 'ENG FAOL', deco: 'active', frame: ['#7EE0A0', '#2DAA5F', '#166B3A'], accent: '#F5C21B', head: ['#FFE48A', '#D79B0A'], ribbon: ['#3FBF77', '#1F8C50', '#0F5A32'], ribbonInk: '#EAFFF1', nameGrad: ['#FFE48A', '#D9A10E'], wreath: '#4FC783' },
  marathon: { name: 'Marafon', ribbonText: 'MARAFON', deco: 'marathon', frame: ['#7FB6FF', '#2F7BFF', '#1546B8'], accent: '#4C95FF', head: ['#D8E9FF', '#4C8EEA'], ribbon: ['#3C8CFF', '#1F62E0', '#123F9C'], ribbonInk: '#F2F8FF', nameGrad: ['#CFE3FF', '#3F86F0'], wreath: null },
  thanks: { name: 'Minnatdorchilik', ribbonText: 'MINNATDORCHILIK', deco: 'thanks', frame: ['#D6BFFF', '#9B6BF2', '#5B2FB3'], accent: '#B58BFF', head: ['#EBDDFF', '#9A74E6'], ribbon: ['#7B4FD8', '#5A32B0', '#3A1D80'], ribbonInk: '#F4ECFF', nameGrad: ['#EBDDFF', '#A67FF0'], wreath: null },
  trust: { name: 'Ishonch', ribbonText: 'ISHONCH', deco: 'trust', frame: ['#BAE6FD', '#38BDF8', '#0284C7'], accent: '#38BDF8', head: ['#F0F9FF', '#38BDF8'], ribbon: ['#7DD3FC', '#0284C7', '#0369A1'], ribbonInk: '#082F49', nameGrad: ['#F0F9FF', '#38BDF8'], wreath: '#38BDF8' },
  growth: { name: 'Yuksalish', ribbonText: 'YUKSALISH', deco: 'growth', frame: ['#FDE68A', '#F59E0B', '#B45309'], accent: '#F59E0B', head: ['#FFFBEB', '#D97706'], ribbon: ['#FBBF24', '#D97706', '#78350F'], ribbonInk: '#451A03', nameGrad: ['#FEF3C7', '#F59E0B'], wreath: '#F59E0B', crown: true },
  wisdom: { name: 'Bilim donosi', ribbonText: 'BILIM DONOSI', deco: 'wisdom', frame: ['#FDE68A', '#D97706', '#78350F'], accent: '#D97706', head: ['#FFFDF5', '#B45309'], ribbon: ['#F59E0B', '#B45309', '#451A03'], ribbonInk: '#FEF3C7', nameGrad: ['#FFFBEB', '#D97706'], wreath: '#D97706' },
  speed: { name: 'Tezkor', ribbonText: 'TEZKOR', deco: 'speed', frame: ['#A5F3FC', '#06B6D4', '#0E7490'], accent: '#06B6D4', head: ['#ECFEFF', '#0891B2'], ribbon: ['#22D3EE', '#0891B2', '#155E75'], ribbonInk: '#083344', nameGrad: ['#ECFEFF', '#06B6D4'], wreath: null },
  reviewer: { name: 'Top Reviewer', ribbonText: 'TOP REVIEWER', deco: 'reviewer', frame: ['#FEF08A', '#EAB308', '#854D0E'], accent: '#EAB308', head: ['#FEF9C3', '#CA8A04'], ribbon: ['#FACC15', '#CA8A04', '#713F12'], ribbonInk: '#422006', nameGrad: ['#FEF08A', '#EAB308'], wreath: '#EAB308', crown: true },
  expert: { name: 'Mutaxassis', ribbonText: 'MUTAXASSIS', deco: 'expert', frame: ['#E9D5FF', '#C084FC', '#7E22CE'], accent: '#C084FC', head: ['#FAF5FF', '#A855F7'], ribbon: ['#D8B4FE', '#9333EA', '#581C87'], ribbonInk: '#3B0764', nameGrad: ['#FAF5FF', '#C084FC'], wreath: null },
  consistent: { name: 'Barqaror', ribbonText: 'BARQAROR', deco: 'consistent', frame: ['#A7F3D0', '#10B981', '#047857'], accent: '#10B981', head: ['#ECFDF5', '#059669'], ribbon: ['#34D399', '#059669', '#064E3B'], ribbonInk: '#022C22', nameGrad: ['#ECFDF5', '#10B981'], wreath: '#10B981' },
  limitless: { name: 'Cheksiz', ribbonText: 'CHEKSIZ', deco: 'limitless', frame: ['#C7D2FE', '#818CF8', '#4338CA'], accent: '#818CF8', head: ['#EEF2FF', '#6366F1'], ribbon: ['#A5B4FC', '#4F46E5', '#312E81'], ribbonInk: '#1E1B4B', nameGrad: ['#EEF2FF', '#818CF8'], wreath: null },
};

const SERIF = "Georgia, 'Times New Roman', 'DejaVu Serif', serif";
const SANS = "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'DejaVu Sans', sans-serif";

/** Sertifikat QR kodi ochadigan manzil */
export const certUrl = (id: string): string => {
  const base: string = ((import.meta as any).env?.VITE_SITE_URL as string) || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base.replace(/\/$/, '')}/c/${encodeURIComponent(id)}`;
};

const fmtDate = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || '';
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

/** Harflar orasi ochiq matn (markazda) */
function spaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, gap: number, fill?: string | CanvasGradient): number {
  const chars = Array.from(text);
  const widths = chars.map(c => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  if (fill) ctx.fillStyle = fill;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  let x = cx - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + gap;
  });
  ctx.textAlign = prev;
  return total;
}

function vGrad(ctx: CanvasRenderingContext2D, y0: number, y1: number, a: string, b: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}

function metal(ctx: CanvasRenderingContext2D, t: Tpl): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, t.frame[0]);
  g.addColorStop(0.5, t.frame[1]);
  g.addColorStop(1, t.frame[2]);
  return g;
}

// ---------- burchak bezaklari: (0,0) — chap-yuqori burchak, o'q ichkariga qarab ----------
function corner(ctx: CanvasRenderingContext2D, t: Tpl, x: number, y: number, sx: number, sy: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  const m = metal(ctx, t);
  ctx.strokeStyle = m;
  ctx.fillStyle = m;
  ctx.lineWidth = 4;
  switch (t.deco) {
    case 'bronze': // kvadrat naqshli burchak
      ctx.strokeRect(-8, -8, 70, 70);
      ctx.strokeRect(6, 6, 42, 42);
      ctx.fillRect(18, 18, 18, 18);
      ctx.beginPath();
      ctx.moveTo(62, 14); ctx.lineTo(100, 14); ctx.moveTo(14, 62); ctx.lineTo(14, 100);
      ctx.stroke();
      break;
    case 'silver': // qiyshiq (fasetka) kvadratlar
      ctx.fillRect(-10, -10, 54, 54);
      ctx.fillStyle = '#0A1220';
      ctx.fillRect(2, 2, 30, 30);
      ctx.strokeStyle = m;
      ctx.beginPath();
      ctx.moveTo(-10, -10); ctx.lineTo(34, 34);
      ctx.moveTo(44, 6); ctx.lineTo(120, 6); ctx.moveTo(6, 44); ctx.lineTo(6, 120);
      ctx.stroke();
      break;
    case 'gold': // egri chiziqli naqsh
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-6, -6, 40 + i * 18, 0, Math.PI / 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-6, 112); ctx.quadraticCurveTo(10, 60, 60, 36); ctx.moveTo(112, -6); ctx.quadraticCurveTo(60, 10, 36, 60);
      ctx.stroke();
      break;
    case 'platinum': // diagonal chiziqlar
      ctx.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-10 + i * 24, 70 + i * 6 - i * 24 + 24);
        ctx.lineTo(70 + i * 6, -10 + i * 24 - i * 24);
        ctx.stroke();
      }
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-10, 120); ctx.lineTo(120, -10); ctx.stroke();
      break;
    case 'champion': { // qizil uchburchak + oltin chiziqlar
      ctx.fillStyle = t.corner || '#A3151F';
      ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(150, -4); ctx.lineTo(-4, 150); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = m;
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(150 + i * 14, -4); ctx.lineTo(-4, 150 + i * 14); ctx.stroke();
      }
      break;
    }
    case 'active': // kesilgan burchak + yaltirash
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-6, 90); ctx.lineTo(90, -6); ctx.stroke();
      ctx.strokeStyle = '#F5D36B';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(30, 46); ctx.lineTo(84, -8); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(8, 60); ctx.lineTo(60, 8); ctx.stroke();
      break;
    case 'marathon': // tez chiziqlar
      ctx.lineWidth = 5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(-6 + i * 20, 96 - i * 4 - i * 20 + 20); ctx.lineTo(90 - i * 4 + i * 0, -6 + i * 20 - i * 20); ctx.stroke();
      }
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(110, 0); ctx.lineTo(160, 0); ctx.moveTo(0, 110); ctx.lineTo(0, 160); ctx.stroke();
      break;
    case 'thanks': // gul naqshi
      ctx.lineWidth = 3;
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.translate(34, 34);
        ctx.rotate((k * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.bezierCurveTo(20, -8, 40, -4, 36, 18); ctx.bezierCurveTo(30, 8, 14, 10, 0, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(34, 34, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(78, 12); ctx.bezierCurveTo(100, 4, 120, 20, 140, 8); ctx.moveTo(12, 78); ctx.bezierCurveTo(4, 100, 20, 120, 8, 140); ctx.stroke();
      break;
    case 'trust': // tog' va nafis novda
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 80); ctx.lineTo(40, 20); ctx.lineTo(80, 80); ctx.stroke();
      for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.arc(20 + k * 25, 15, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(10, 95); ctx.lineTo(95, 10); ctx.stroke();
      break;
    case 'growth': // cho'qqi va quyosh nurlari
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(-5, 90); ctx.lineTo(45, 10); ctx.lineTo(95, 90); ctx.stroke();
      for (let k = 0; k < 4; k++) {
        ctx.beginPath(); ctx.moveTo(45, 10); ctx.lineTo(30 + k * 10, -10); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(45, 10, 5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'wisdom': // ochiq kitob va qalam silueti
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(15, 40); ctx.quadraticCurveTo(40, 25, 65, 40); ctx.quadraticCurveTo(90, 25, 115, 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(65, 40); ctx.lineTo(65, 75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, 40); ctx.lineTo(15, 75); ctx.quadraticCurveTo(40, 60, 65, 75); ctx.quadraticCurveTo(90, 60, 115, 75); ctx.lineTo(115, 40); ctx.stroke();
      break;
    case 'speed': // yashin chaqmoq
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(40, -5); ctx.lineTo(15, 40); ctx.lineTo(45, 35); ctx.lineTo(20, 90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-5, 45); ctx.lineTo(90, 45); ctx.stroke();
      break;
    case 'reviewer': // oltin yulduzlar va toj
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(10, 45); ctx.lineTo(25, 15); ctx.lineTo(45, 35); ctx.lineTo(65, 15); ctx.lineTo(80, 45); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(45, 70, 7, 0, Math.PI * 2); ctx.fill();
      break;
    case 'expert': // lampochka va yulduz
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(45, 35, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(35, 55); ctx.lineTo(55, 55); ctx.moveTo(38, 62); ctx.lineTo(52, 62); ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const rad = (k * Math.PI) / 2;
        ctx.beginPath(); ctx.moveTo(45 + Math.cos(rad) * 26, 35 + Math.sin(rad) * 26); ctx.lineTo(45 + Math.cos(rad) * 36, 35 + Math.sin(rad) * 36); ctx.stroke();
      }
      break;
    case 'consistent': // o'rmon barglari
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.ellipse(25 + k * 22, 25 + k * 18, 16, 7, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(10, 15); ctx.quadraticCurveTo(50, 50, 85, 85); ctx.stroke();
      break;
    case 'limitless': // cheksizlik belgisi va kosmik nuqtalar
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(30, 40);
      ctx.bezierCurveTo(30, 20, 50, 20, 60, 40);
      ctx.bezierCurveTo(70, 60, 90, 60, 90, 40);
      ctx.bezierCurveTo(90, 20, 70, 20, 60, 40);
      ctx.bezierCurveTo(50, 60, 30, 60, 30, 40);
      ctx.stroke();
      for (let k = 0; k < 5; k++) {
        ctx.beginPath(); ctx.arc(15 + k * 20, 15 + ((k * 17) % 30), 2.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
  }
  ctx.restore();
}

function frame(ctx: CanvasRenderingContext2D, t: Tpl) {
  const m = metal(ctx, t);
  ctx.strokeStyle = m;
  ctx.lineWidth = 7;
  const o = 38;
  if (t.deco === 'active' || t.deco === 'champion') {
    // kesilgan burchakli (sakkizburchak) ramka
    const c = t.deco === 'active' ? 64 : 0;
    ctx.beginPath();
    ctx.moveTo(o + c, o); ctx.lineTo(W - o - c, o); ctx.lineTo(W - o, o + c); ctx.lineTo(W - o, H - o - c);
    ctx.lineTo(W - o - c, H - o); ctx.lineTo(o + c, H - o); ctx.lineTo(o, H - o - c); ctx.lineTo(o, o + c);
    ctx.closePath();
    ctx.stroke();
  } else ctx.strokeRect(o, o, W - o * 2, H - o * 2);
  ctx.lineWidth = 2.5;
  const i2 = 66;
  if (t.deco === 'active') {
    const c = 52;
    ctx.beginPath();
    ctx.moveTo(i2 + c, i2); ctx.lineTo(W - i2 - c, i2); ctx.lineTo(W - i2, i2 + c); ctx.lineTo(W - i2, H - i2 - c);
    ctx.lineTo(W - i2 - c, H - i2); ctx.lineTo(i2 + c, H - i2); ctx.lineTo(i2, H - i2 - c); ctx.lineTo(i2, i2 + c);
    ctx.closePath();
    ctx.stroke();
  } else ctx.strokeRect(i2, i2, W - i2 * 2, H - i2 * 2);
  if (t.deco !== 'active') {
    const off = t.deco === 'champion' ? 38 : 30;
    corner(ctx, t, off, off, 1, 1);
    corner(ctx, t, W - off, off, -1, 1);
    corner(ctx, t, off, H - off, 1, -1);
    corner(ctx, t, W - off, H - off, -1, -1);
  } else {
    corner(ctx, t, o + 4, o + 4, 1, 1);
    corner(ctx, t, W - o - 4, o + 4, -1, 1);
    corner(ctx, t, o + 4, H - o - 4, 1, -1);
    corner(ctx, t, W - o - 4, H - o - 4, -1, -1);
  }
}

function laurel(ctx: CanvasRenderingContext2D, cx: number, cy: number, side: 1 | -1, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(side, 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 44);
  ctx.bezierCurveTo(26, 36, 44, 10, 40, -40);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const px = 6 + Math.sin(t * 1.9) * 34 - t * 3;
    const py = 40 - t * 78;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-0.9 + t * 0.7 + (dir === 1 ? 0.55 : -0.35));
      ctx.beginPath();
      ctx.ellipse(dir === 1 ? 10 : -4, dir === 1 ? -4 : 4, 15 - t * 3, 5.6 - t * 0.6, dir === 1 ? -0.3 : 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function crown(ctx: CanvasRenderingContext2D, cx: number, y: number, color: string) {
  ctx.save();
  ctx.translate(cx, y);
  const g = vGrad(ctx, -26, 20, '#FFE9A0', '#E1A116');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-34, 18); ctx.lineTo(-40, -16); ctx.lineTo(-18, 0); ctx.lineTo(0, -26); ctx.lineTo(18, 0); ctx.lineTo(40, -16); ctx.lineTo(34, 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  [[-40, -18], [0, -29], [40, -18]].forEach(([x, yy]) => { ctx.beginPath(); ctx.arc(x, yy, 5, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}

function ribbon(ctx: CanvasRenderingContext2D, t: Tpl, cx: number, cy: number): number {
  ctx.font = `700 46px ${SERIF}`;
  const textW = Array.from(t.ribbonText).reduce((a, c) => a + ctx.measureText(c).width + 6, -6);
  const half = Math.max(210, textW / 2 + 70);
  const h = 70;
  const notch = 34;
  const x0 = cx - half;
  const x1 = cx + half;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, t.ribbon[0]);
  g.addColorStop(0.55, t.ribbon[1]);
  g.addColorStop(1, t.ribbon[2]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1 - notch, cy); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0 + notch, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = t.ribbon[0];
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = t.ribbonInk;
  ctx.textBaseline = 'middle';
  spaced(ctx, t.ribbonText, cx, cy + 2, 6);
  ctx.textBaseline = 'alphabetic';
  return half;
}

function sideDeco(ctx: CanvasRenderingContext2D, t: Tpl, cx: number, cy: number, half: number) {
  const gx = half + 44;
  if (t.wreath) {
    laurel(ctx, cx - gx, cy, -1, t.wreath);
    laurel(ctx, cx + gx, cy, 1, t.wreath);
    return;
  }
  const m = metal(ctx, t);
  ctx.strokeStyle = m;
  ctx.fillStyle = m;
  ctx.lineWidth = 4;
  if (t.deco === 'bronze') {
    [-1, 1].forEach(s => {
      ctx.beginPath(); ctx.moveTo(cx + s * (half + 40), cy); ctx.lineTo(cx + s * (half + 110), cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + s * (half + 126), cy); ctx.lineTo(cx + s * (half + 138), cy - 8); ctx.lineTo(cx + s * (half + 150), cy); ctx.lineTo(cx + s * (half + 138), cy + 8); ctx.closePath(); ctx.fill();
    });
  } else if (t.deco === 'marathon') {
    [-1, 1].forEach(s => {
      [-14, 0, 14].forEach((dy, i) => {
        ctx.beginPath(); ctx.moveTo(cx + s * (half + 24), cy + dy); ctx.lineTo(cx + s * (half + 150 - i * 22), cy + dy); ctx.stroke();
      });
    });
  } else if (t.deco === 'thanks') {
    [-1, 1].forEach(s => {
      ctx.save();
      ctx.translate(cx + s * (half + 70), cy);
      ctx.scale(s, 1);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(30, -34, 70, -20, 56, 4); ctx.bezierCurveTo(46, 20, 24, 8, 36, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(30, 30, 70, 20, 56, -2); ctx.stroke();
      ctx.beginPath(); ctx.arc(-4, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }
}

let logoPromise: Promise<HTMLImageElement | null> | null = null;
function loadLogo(): Promise<HTMLImageElement | null> {
  if (!logoPromise) {
    logoPromise = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = '/logo.png';
    });
  }
  return logoPromise;
}

/** Pastdagi «muhr»lar: daraja, yodlangan so'zlar, streak (sertifikatning rasmiy qiymatini oshiradi) */
function statPills(ctx: CanvasRenderingContext2D, t: Tpl, cx: number, y: number, stats: NonNullable<Certificate['stats']>, pw: number, ph: number) {
  const items: [string, string][] = [];
  if (stats.lvl) items.push(['DARAJA', String(stats.lvl)]);
  if (Number(stats.words) > 0) items.push(["SO'ZLAR", String(stats.words)]);
  if (Number(stats.streak) > 0) items.push(['STREAK', `${stats.streak} kun`]);
  if (!items.length) return;
  const gap = 20;
  const total = items.length * pw + (items.length - 1) * gap;
  let x = cx - total / 2;
  const lg = metal(ctx, t);
  items.forEach(([label, value]) => {
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + pw - r, y); ctx.quadraticCurveTo(x + pw, y, x + pw, y + r);
    ctx.lineTo(x + pw, y + ph - r); ctx.quadraticCurveTo(x + pw, y + ph, x + pw - r, y + ph);
    ctx.lineTo(x + r, y + ph); ctx.quadraticCurveTo(x, y + ph, x, y + ph - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = t.accent;
    ctx.font = `800 15px ${SANS}`;
    spaced(ctx, label, x + pw / 2, y + 23, 2);
    ctx.fillStyle = '#F1F5FB';
    let fs = 31;
    ctx.font = `800 ${fs}px ${SERIF}`;
    while (ctx.measureText(value).width > pw - 20 && fs > 18) { fs -= 2; ctx.font = `800 ${fs}px ${SERIF}`; }
    ctx.fillText(value, x + pw / 2, y + ph - 15);
    x += pw + gap;
  });
}

/** Sertifikatni canvas'ga chizadi: 16:9 (albom) yoki 9:16 (tik, Stories) format, QR bilan */
export async function drawCertificate(canvas: HTMLCanvasElement, c: Certificate): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  try {
    await (document as any).fonts?.load?.(`700 40px 'Plus Jakarta Sans'`);
  } catch {
    /* shrift yuklanmasa, zaxira shrift ishlatiladi */
  }
  const logo = await loadLogo();
  const t = TEMPLATES[c.tpl] || TEMPLATES.gold;
  const story = c.fmt === 'story';
  // DIQQAT: bundan keyingi chizish sinxron — W/H boshqa chizish bilan aralashib ketmaydi
  W = story ? CERT_STORY_W : CERT_W;
  H = story ? CERT_STORY_H : CERT_H;
  canvas.width = W;
  canvas.height = H;
  ctx.textAlign = 'center';

  // fon
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#040915');
  bg.addColorStop(1, '#0B152B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, story ? 1100 : 900);
  glow.addColorStop(0, t.frame[1] + '2E');
  glow.addColorStop(1, t.frame[1] + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // nozik to'lqin chiziqlar
  ctx.strokeStyle = t.frame[1] + '30';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath(); ctx.moveTo(90, H - 90 - i * 10); ctx.bezierCurveTo(260, H - 220 - i * 14, 420, H - 70, 640, H - 90 - i * 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 90, 90 + i * 10); ctx.bezierCurveTo(W - 260, 220 + i * 14, W - 420, 70, W - 640, 90 + i * 6); ctx.stroke();
  }

  frame(ctx, t);

  // VocaBoost yozuvi (+ logotip)
  const brandY = story ? 220 : 176;
  ctx.font = `800 ${story ? 58 : 62}px ${SANS}`;
  const wv = ctx.measureText('Voca').width;
  const wb = ctx.measureText('Boost').width;
  const lx = W / 2 - (wv + wb) / 2 + (story ? 30 : 0);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Voca', lx, brandY);
  ctx.fillStyle = t.accent;
  ctx.fillText('Boost', lx + wv, brandY);
  if (logo) {
    ctx.save();
    ctx.beginPath(); ctx.arc(lx - 52, brandY - 20, 34, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logo, lx - 86, brandY - 54, 68, 68);
    ctx.restore();
  }
  ctx.textAlign = 'center';

  // SERTIFIKAT
  let hs = story ? 118 : 150;
  const hGap = story ? 6 : 10;
  ctx.font = `800 ${hs}px ${SERIF}`;
  if (story) {
    const widthOf = () => Array.from('SERTIFIKAT').reduce((a, ch) => a + ctx.measureText(ch).width + hGap, -hGap);
    while (widthOf() > W - 220 && hs > 60) { hs -= 4; ctx.font = `800 ${hs}px ${SERIF}`; }
  }
  const headY = story ? 440 : 330;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  spaced(ctx, 'SERTIFIKAT', W / 2, headY, hGap, vGrad(ctx, headY - 120, headY + 10, t.head[0], t.head[1]));
  ctx.restore();

  // lenta (tur nomi), gul, toj
  const ry = story ? 560 : 428;
  const half = ribbon(ctx, t, W / 2, ry);
  if (!story || half + 150 < W / 2 - 80) sideDeco(ctx, t, W / 2, ry, half);
  if (t.crown) crown(ctx, W / 2, ry - 54, '#FFF3C4');

  // matnlar
  ctx.fillStyle = '#D9E0EC';
  ctx.font = `400 ${story ? 36 : 32}px ${SERIF}`;
  const subY = story ? 700 : 548;
  ctx.fillText('Ushbu sertifikat quyidagi shaxsga topshiriladi', W / 2, subY);

  let size = story ? 108 : 112;
  ctx.font = `800 ${size}px ${SERIF}`;
  const nm = c.name || "F.I.SH.";
  const nameMax = story ? W - 200 : W - 420;
  while (ctx.measureText(nm).width > nameMax && size > 48) {
    size -= 6;
    ctx.font = `800 ${size}px ${SERIF}`;
  }
  const nameY = story ? 830 : 668;
  ctx.fillStyle = vGrad(ctx, nameY - 68, nameY + 22, t.nameGrad[0], t.nameGrad[1]);
  ctx.fillText(nm, W / 2, nameY);

  // chiziq + olmos
  const my = story ? 880 : 704;
  const dHalf = story ? 380 : 520;
  const lg = metal(ctx, t);
  ctx.strokeStyle = lg;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - dHalf, my); ctx.lineTo(W / 2 - 18, my); ctx.moveTo(W / 2 + 18, my); ctx.lineTo(W / 2 + dHalf, my); ctx.stroke();
  ctx.fillStyle = lg;
  ctx.beginPath(); ctx.moveTo(W / 2, my - 11); ctx.lineTo(W / 2 + 11, my); ctx.lineTo(W / 2, my + 11); ctx.lineTo(W / 2 - 11, my); ctx.closePath(); ctx.fill();

  // Sarlavha (yutuq yoki natija) va Izoh
  ctx.fillStyle = '#F1F5FB';
  ctx.font = `700 ${story ? 52 : 50}px ${SERIF}`;
  const tY = story ? 980 : 790;
  const tLH = story ? 66 : 62;
  const titleLines = wrap(ctx, c.title || '', story ? W - 220 : W - 460).slice(0, story ? 3 : 2);
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, tY + i * tLH));
  let lastY = tY + Math.max(0, titleLines.length - 1) * tLH;
  if (c.reason) {
    ctx.fillStyle = '#A9B8CE';
    ctx.font = `italic 400 ${story ? 35 : 31}px ${SERIF}`;
    const rLH = story ? 50 : 44;
    const y0 = lastY + (story ? 62 : 58);
    const rl = wrap(ctx, c.reason, story ? W - 260 : W - 520).slice(0, story ? 3 : 3);
    rl.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * rLH));
    lastY = y0 + Math.max(0, rl.length - 1) * rLH;
  }

  // QR joylashuvi (format bo'yicha)
  const qs = story ? 250 : 210;
  const qx = story ? W / 2 - qs / 2 : W - 150 - qs;
  const qy = story ? 1400 : H - 140 - qs - 24;

  // Muhrlar: daraja / so'zlar / streak (joy yetsagina chiziladi)
  if (c.stats) {
    const ph = story ? 68 : 62;
    const sy = lastY + (story ? 46 : 40);
    const limit = story ? qy - 30 : H - 150;
    if (sy + ph <= limit) statPills(ctx, t, W / 2, sy, c.stats, story ? 250 : 220, ph);
  }

  if (story) {
    // 9:16: sana va raqam QR ostida, o'rtada
    ctx.textAlign = 'center';
    ctx.fillStyle = '#B4C0D2';
    ctx.font = `400 32px ${SERIF}`;
    ctx.fillText(`Sana: ${fmtDate(c.date)}   ·   № ${c.id}`, W / 2, H - 150);
  } else {
    // pastki chap: sana va raqam
    ctx.textAlign = 'left';
    ctx.fillStyle = '#B4C0D2';
    ctx.font = `400 32px ${SERIF}`;
    ctx.fillText(`Sana: ${fmtDate(c.date)}`, 150, H - 170);
    ctx.fillText(`№ ${c.id}`, 150, H - 120);
  }

  // QR (har bir sertifikat uchun alohida)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qx - 10, qy - 10, qs + 20, qs + 20);
  ctx.strokeStyle = lg;
  ctx.lineWidth = 4;
  ctx.strokeRect(qx - 10, qy - 10, qs + 20, qs + 20);
  if (c.verified !== false) drawQr(ctx, certUrl(c.id), qx, qy, qs, { dark: '#0A1220', light: '#FFFFFF', quiet: 1, ecc: 'M' });
  else {
    ctx.fillStyle = '#64748B';
    ctx.font = `600 20px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('Mahalliy nusxa', qx + qs / 2, qy + qs / 2);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = t.accent;
  ctx.font = `800 17px ${SANS}`;
  spaced(ctx, 'TEKSHIRISH QR', qx + qs / 2, qy + qs + 42, 1.5);

  // pastki o'rta: bot manzili
  ctx.textAlign = 'center';
  ctx.font = `800 ${story ? 40 : 38}px ${SANS}`;
  ctx.fillStyle = t.accent;
  ctx.fillText(CERT_BOT, W / 2, story ? H - 92 : H - 118);
  ctx.textAlign = 'center';
}

export const certFileName = (c: Certificate, ext = 'png') => `VocaBoost-${c.id}.${ext}`;

/** Sertifikatni rasm (JPEG) qilib, base64 (prefikssiz) ko'rinishida qaytaradi — botga yuborish uchun. */
export async function certificateBase64(c: Certificate): Promise<string> {
  const canvas = document.createElement('canvas');
  await drawCertificate(canvas, c);
  const url = canvas.toDataURL('image/jpeg', 0.92);
  return url.slice(url.indexOf(',') + 1);
}
