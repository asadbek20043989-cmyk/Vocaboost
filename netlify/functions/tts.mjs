// Edge TTS (Microsoft neyral ovozlar) — Netlify Function.
// GET /.netlify/functions/tts?text=Hello+world[&voice=en-US-AriaNeural]
// Xavfsizlik: ochiq proksi sifatida begona domenlar tomonidan suiiste'mol qilinishining oldi olingan.
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICES = new Set(['en-US-AriaNeural', 'en-US-JennyNeural', 'en-US-GuyNeural', 'en-GB-SoniaNeural', 'en-GB-RyanNeural']);
const DEFAULT_VOICE = process.env.TTS_VOICE || 'en-US-AriaNeural';

// IP bo'yicha daqiqalik cheklov (rate limiting)
const ipRequests = new Map(); // ip -> { count, resetTime }

const err = (status, msg) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify({ error: msg }),
});

const streamToBuffer = stream =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', c => chunks.push(Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

export const handler = async event => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  // 1. IP rate limiting (bir IP dan daqiqasiga ko'pi bilan 60 ta so'rov)
  const clientIp = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || event.headers['client-ip'] || 'unknown';
  const now = Date.now();
  const ipData = ipRequests.get(clientIp);

  if (ipData && now < ipData.resetTime) {
    if (ipData.count >= 60) {
      return err(429, 'So‘rovlar soni me’yordan oshdi. Bir ozdan so‘ng urinib ko‘ring.');
    }
    ipData.count++;
  } else {
    ipRequests.set(clientIp, { count: 1, resetTime: now + 60000 });
  }

  // Eskirgan IP yozuvlarni tozalash
  if (ipRequests.size > 2000) {
    for (const [k, v] of ipRequests.entries()) {
      if (now >= v.resetTime) ipRequests.delete(k);
    }
  }

  const q = event.queryStringParameters || {};
  const text = String(q.text || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
  if (!text) return err(400, 'text kerak');
  const voice = VOICES.has(q.voice) ? q.voice : DEFAULT_VOICE;

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const out = tts.toStream(text);
    const stream = out && out.audioStream ? out.audioStream : out;
    const buf = await streamToBuffer(stream);
    if (!buf.length) return err(502, 'Audio bo‘sh');

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Netlify-CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
      body: buf.toString('base64'),
    };
  } catch (e) {
    return err(502, 'TTS xatosi: ' + String(e.message || e));
  }
};
