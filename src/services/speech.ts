// Talaffuz: 1) Edge TTS (Netlify funksiyasi /tts, CDN keshlanadi) -> 2) brauzer ovozi (zaxira).
// Shadowing uchun: Web Speech API SpeechRecognition (bepul).

const TTS_URL: string = ((import.meta as any).env?.VITE_TTS_URL as string) || '/.netlify/functions/tts';
// Netlify kreditini tejash uchun server TTS sukut bo'yicha O'CHIQ (brauzer ovozi ishlatiladi).
// Yoqish: Netlify muhit o'zgaruvchisiga VITE_SERVER_TTS=1 qo'shing va qayta deploy qiling.
const SERVER_TTS = String((import.meta as any).env?.VITE_SERVER_TTS ?? '0') === '1';
const audioCache = new Map<string, string>(); // matn -> blob URL
// iOS/Telegram WebView: async yuklangan audio'ni ijro etish uchun bitta umumiy <audio> elementini
// birinchi bosishda "ochib" qo'yamiz.
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
let ttsBroken = !SERVER_TTS; // funksiya yo'q bo'lsa (masalan, lokal dev), qayta urinmaymiz
let reqId = 0;

let cachedVoice: SpeechSynthesisVoice | null = null;
function loadVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoice =
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))) ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en')) ||
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
    currentAudio?.pause();
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
    u.rate = rate;
    if (!cachedVoice) loadVoices();
    if (cachedVoice) u.voice = cachedVoice;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

async function fetchAudio(text: string): Promise<string> {
  const hit = audioCache.get(text);
  if (hit) return hit;
  // GET + doimiy URL: Netlify CDN va brauzer keshi bir xil matnni qayta generatsiya qilmaydi
  const res = await fetch(`${TTS_URL}?text=${encodeURIComponent(text)}&v=1`);
  if (!res.ok) throw new Error('TTS ' + res.status);
  const blob = await res.blob();
  if (!blob.type.includes('audio') && blob.size < 500) throw new Error('TTS bo‘sh');
  const url = URL.createObjectURL(blob);
  audioCache.set(text, url);
  if (audioCache.size > 80) {
    const first = audioCache.keys().next().value as string;
    URL.revokeObjectURL(audioCache.get(first)!);
    audioCache.delete(first);
  }
  return url;
}

export function speakEnglish(text: string, rate: number = 0.9): void {
  const clean = text.replace(/[*_#`~]/g, '').trim().slice(0, 1200);
  if (!clean) return;
  stopSpeaking();
  if (ttsBroken) return browserSpeak(clean, rate);
  const my = ++reqId;
  fetchAudio(clean)
    .then(url => {
      if (my !== reqId) return; // yangi so'rov chiqib ketgan
      const a = sharedAudio || new Audio();
      currentAudio = a;
      a.src = url;
      a.playbackRate = rate >= 0.95 ? 1 : 0.95;
      a.play().catch(() => browserSpeak(clean, rate));
    })
    .catch(() => {
      ttsBroken = true;
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
