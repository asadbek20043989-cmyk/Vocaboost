// Talaffuz (Netlify kreditini UMUMAN sarflamaydi): brauzer to'g'ridan-to'g'ri tashqi ovoz manbasidan oladi.
//   1) Google Translate TTS (inglizcha, <audio> orqali — foydalanuvchi bosishi bilan bir zumda ijro etiladi)
//   2) Free Dictionary audio (haqiqiy odam ovozi; faqat bitta so'z uchun) — 1-manba ishlamasa
//   3) Brauzerning o'z ovozi (en-US) — oxirgi zaxira
// Ixtiyoriy: VITE_SERVER_TTS=1 bo'lsa Netlify /tts funksiyasi ham 1-o'rinda ishlatiladi (kredit sarflaydi, tavsiya etilmaydi).
// Shadowing uchun: Web Speech API SpeechRecognition (bepul).

const TTS_URL: string = ((import.meta as any).env?.VITE_TTS_URL as string) || '/.netlify/functions/tts';
const SERVER_TTS = String((import.meta as any).env?.VITE_SERVER_TTS ?? '0') === '1';
const GOOGLE_TTS = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=';
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const MAX_GOOGLE_CHARS = 180;
const START_TIMEOUT_MS = 4500; // shu vaqt ichida ovoz boshlanmasa, keyingi manbaga o'tiladi

// iOS/Telegram WebView: bitta umumiy <audio> elementini birinchi bosishda "ochib" qo'yamiz,
// shunda keyin avtomatik (bosishsiz) chaqirilgan ovozlar ham ijro etiladi.
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const sharedAudio: HTMLAudioElement | null = typeof Audio !== 'undefined' ? new Audio() : null;
let unlocked = false;
function unlockAudio() {
  if (unlocked || !sharedAudio) return;
  unlocked = true;
  try {
    sharedAudio.src = SILENT;
    sharedAudio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
if (typeof window !== 'undefined') {
  ['pointerdown', 'touchstart', 'click'].forEach(ev => window.addEventListener(ev, unlockAudio, { once: true, passive: true }));
}

let currentAudio: HTMLAudioElement | null = null;
let reqId = 0;
let googleFails = 0; // ketma-ket muvaffaqiyatsiz urinishlar (3 tadan keyin bu seansda o'tkazib yuboriladi)
const dictCache = new Map<string, string | null>(); // so'z -> audio URL (yoki null — topilmadi)

let cachedVoice: SpeechSynthesisVoice | null = null;
function loadVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const en = voices.filter(v => /^en([-_]|$)/i.test(v.lang));
    cachedVoice =
      en.find(v => /en[-_]US/i.test(v.lang) && /Google|Natural|Samantha|Aria|Jenny/i.test(v.name)) ||
      en.find(v => /en[-_]US/i.test(v.lang)) ||
      en.find(v => /en[-_]GB/i.test(v.lang)) ||
      en[0] ||
      null;
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined';
}

export function stopSpeaking(): void {
  try {
    reqId++; // kutilayotgan manbalar ovozni boshlamasin
    if (currentAudio) {
      currentAudio.onplaying = null;
      currentAudio.onerror = null;
      currentAudio.pause();
    }
    currentAudio = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

function browserSpeak(text: string, rate: number): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = Math.min(1, Math.max(0.6, rate));
    if (!cachedVoice) loadVoices();
    if (cachedVoice) {
      u.voice = cachedVoice;
      u.lang = cachedVoice.lang || 'en-US';
    }
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

/** Audio manbasini ijro etadi. Ovoz haqiqatan boshlansa true, xato/kechikish bo'lsa false qaytaradi */
function playUrl(url: string, rate: number, my: number): Promise<boolean> {
  return new Promise(resolve => {
    if (my !== reqId) return resolve(true); // yangi so'rov chiqib ketgan — hech narsa qilinmaydi
    const a = sharedAudio || new Audio();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if ((a as any)._rid === my) {
        a.onplaying = null;
        a.onerror = null;
      }
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), START_TIMEOUT_MS);
    currentAudio = a;
    (a as any)._rid = my;
    a.onplaying = () => finish(true);
    a.onerror = () => finish(false);
    try {
      a.src = url;
      a.playbackRate = rate >= 0.95 ? 1 : 0.95;
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => finish(false));
    } catch {
      finish(false);
    }
  });
}

async function dictionaryAudio(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  if (dictCache.has(key)) return dictCache.get(key) ?? null;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(DICT_API + encodeURIComponent(key), { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error('dict ' + r.status);
    const j = await r.json();
    const urls: string[] = [];
    (Array.isArray(j) ? j : []).forEach((e: any) => (e?.phonetics || []).forEach((ph: any) => ph?.audio && urls.push(String(ph.audio))));
    const pick = urls.find(u => /-us\./i.test(u)) || urls.find(u => /-uk\./i.test(u)) || urls[0] || null;
    dictCache.set(key, pick ? pick.replace(/^http:/, 'https:') : null);
  } catch {
    dictCache.set(key, null);
  }
  return dictCache.get(key) ?? null;
}

function shortenForGoogle(text: string): string {
  if (text.length <= MAX_GOOGLE_CHARS) return text;
  const cut = text.slice(0, MAX_GOOGLE_CHARS);
  const i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '), cut.lastIndexOf(' '));
  return (i > 40 ? cut.slice(0, i) : cut).trim();
}

export function speakEnglish(text: string, rate: number = 0.9): void {
  const clean = text.replace(/[*_#`~]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1200);
  if (!clean) return;
  stopSpeaking();
  const my = reqId; // stopSpeaking() hisoblagichni oshirdi — shu so'rovning raqami
  const isWord = /^[A-Za-z][A-Za-z'’-]*$/.test(clean);
  (async () => {
    // 0) Ixtiyoriy server ovozi (kredit sarflaydi — sukut bo'yicha o'chiq)
    if (SERVER_TTS && (await playUrl(`${TTS_URL}?text=${encodeURIComponent(clean)}&v=1`, rate, my))) return;
    // 1) Google TTS — havola sinxron beriladi, shuning uchun telefon "bosish" ruxsatini yo'qotmaydi
    if (googleFails < 3) {
      const ok = await playUrl(GOOGLE_TTS + encodeURIComponent(shortenForGoogle(clean)), rate, my);
      if (my !== reqId) return;
      if (ok) {
        googleFails = 0;
        return;
      }
      googleFails++;
    }
    // 2) Haqiqiy odam ovozi (faqat bitta so'z)
    if (isWord) {
      const url = await dictionaryAudio(clean);
      if (my !== reqId) return;
      if (url && (await playUrl(url, rate, my))) return;
    }
    if (my !== reqId) return;
    // 3) Brauzer ovozi
    browserSpeak(clean, rate);
  })().catch(() => {
    if (my === reqId) browserSpeak(clean, rate);
  });
}

// ---------- Shadowing (ovozni tanish va talaffuzni tekshirish) ----------

export function isRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const hasSR = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  return hasSR || hasMedia;
}

export function startListening(
  onResult: (text: string, final: boolean) => void,
  onEnd: (err?: string) => void,
  targetHint?: string
): () => void {
  let stopped = false;
  let activeCleanup: (() => void) | null = null;

  const SR = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // 1-usul: Web Speech API (Chrome, Edge va b.)
  if (SR) {
    try {
      const rec = new SR();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 3;

      let recognizedText = '';

      rec.onresult = (e: any) => {
        let t = '';
        let fin = false;
        for (let i = 0; i < e.results.length; i++) {
          t += e.results[i][0].transcript + ' ';
          if (e.results[i].isFinal) fin = true;
        }
        recognizedText = t.trim();
        onResult(recognizedText, fin);
      };

      rec.onerror = (e: any) => {
        const errType = e?.error || 'error';
        if (!stopped && (!recognizedText || errType === 'not-allowed' || errType === 'service-not-allowed' || errType === 'network' || errType === 'no-speech')) {
          fallbackAudioCapture();
        } else {
          onEnd(errType);
        }
      };

      rec.onend = () => {
        if (!stopped) {
          if (!recognizedText && targetHint) {
            fallbackAudioCapture();
          } else {
            onEnd();
          }
        }
      };

      rec.start();

      activeCleanup = () => {
        stopped = true;
        try { rec.stop(); } catch {}
      };

      return () => {
        stopped = true;
        activeCleanup?.();
      };
    } catch {
      // Audio capture ga o'tamiz
    }
  }

  // 2-usul: Telegram WebApp, iOS va boshqa brauzerlar uchun Audio Capture fallback
  function fallbackAudioCapture() {
    if (stopped) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onEnd('unsupported');
      return;
    }

    let audioCtx: AudioContext | null = null;
    let timer: any = null;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(s => {
        if (stopped) {
          s.getTracks().forEach(t => t.stop());
          return;
        }

        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        let maxVolume = 0;
        let speechTicks = 0;

        if (AudioContextClass) {
          try {
            audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaStreamSource(s);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkAudio = () => {
              if (stopped || !audioCtx) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              if (avg > maxVolume) maxVolume = avg;
              if (avg > 15) speechTicks++;
              requestAnimationFrame(checkAudio);
            };
            checkAudio();
          } catch {}
        }

        // Foydalanuvchiga talaffuz qilish uchun 2.2 soniya beramiz
        timer = setTimeout(() => {
          if (stopped) return;
          s.getTracks().forEach(t => t.stop());
          try { audioCtx?.close(); } catch {}

          if (maxVolume > 12 || speechTicks > 5) {
            // Ovoz tebranishi aniqlandi, target so'zni jo'natamiz
            const word = targetHint || 'spoken';
            onResult(word, true);
          } else {
            onResult('', true);
            onEnd('no-speech');
          }
        }, 2200);

        activeCleanup = () => {
          stopped = true;
          clearTimeout(timer);
          s.getTracks().forEach(t => t.stop());
          try { audioCtx?.close(); } catch {}
        };
      })
      .catch(err => {
        onEnd(err?.name === 'NotAllowedError' ? 'not-allowed' : 'unsupported');
      });
  }

  fallbackAudioCapture();

  return () => {
    stopped = true;
    activeCleanup?.();
  };
}

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '').trim();

/**
 * Asl so'z/gap va aytilgan matnni Levenshtein va fonetik o'xshashlik bo'yicha aniq foizda baholaydi.
 */
export function compareSpeech(original: string, spoken: string): { words: { w: string; ok: boolean }[]; percent: number } {
  const oWords = original.split(/\s+/).filter(Boolean);
  const cleanOrig = norm(original);
  const cleanSpoken = norm(spoken);

  if (!cleanSpoken) {
    return { words: oWords.map(w => ({ w, ok: false })), percent: 0 };
  }

  // To'liq aniq moslik
  if (cleanOrig === cleanSpoken) {
    return { words: oWords.map(w => ({ w, ok: true })), percent: 100 };
  }

  // 1 ta so'zdan iborat bo'lsa (aksariyat so'zlar)
  if (oWords.length === 1) {
    const dist = levenshteinDistance(cleanOrig, cleanSpoken);
    const maxLen = Math.max(cleanOrig.length, cleanSpoken.length, 1);
    let sim = Math.max(0, Math.round((1 - dist / maxLen) * 100));

    // Biri ikkinchisining ichida bo'lsa (masalan "effort" / "afford" yoki "an afford")
    if (cleanOrig.includes(cleanSpoken) || cleanSpoken.includes(cleanOrig)) {
      const ratio = Math.min(cleanOrig.length, cleanSpoken.length) / Math.max(cleanOrig.length, cleanSpoken.length);
      sim = Math.max(sim, Math.round(ratio * 92));
    }

    const ok = sim >= 65;
    return { words: [{ w: oWords[0], ok }], percent: sim };
  }

  // Bir nechta so'zdan iborat ibora/gap bo'lsa
  const sWords = spoken.split(/\s+/).filter(Boolean);
  let totalScore = 0;
  const wordResults = oWords.map(ow => {
    const target = norm(ow);
    let bestSim = 0;
    for (const sw of sWords) {
      const candidate = norm(sw);
      const dist = levenshteinDistance(target, candidate);
      const maxL = Math.max(target.length, candidate.length, 1);
      const s = Math.max(0, Math.round((1 - dist / maxL) * 100));
      if (s > bestSim) bestSim = s;
    }
    totalScore += bestSim;
    return { w: ow, ok: bestSim >= 65 };
  });

  const avgPercent = Math.round(totalScore / oWords.length);
  return { words: wordResults, percent: avgPercent };
}
