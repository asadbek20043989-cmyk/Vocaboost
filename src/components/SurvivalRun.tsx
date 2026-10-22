import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Shell, QuestionView } from './Learn';
import { makeQuestion, shuffle } from '../services/srs';
import { sfx } from '../services/sound';

/** Marafon (Survival): cheksiz savollar, faqat bir necha jon. Jonlar tugaguncha ketma-ket ko'proq so'z tarjimasini toping. */
export const SurvivalRun: React.FC<{ id: string }> = ({ id }) => {
  const { challenges, allWords, saveSurvival, closeOverlay } = useApp();
  const ch = challenges.find(c => c.id === id);
  const maxLives = ch?.lives || 3;
  const queue = useMemo(() => shuffle(allWords.filter(w => w.en && w.uz)), []); // har bir so'z faqat bir marta so'raladi
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(maxLives);
  const [over, setOver] = useState(false);
  const st = useRef({ score: 0, over: false });
  st.current = { score, over };

  const q = useMemo(() => (queue[i] ? makeQuestion(queue[i], allWords, 'mcq', 4) : null), [i, queue]);

  // Ilova yopilsa/fonga ketsa ham shu paytgacha natija saqlanadi
  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === 'hidden' && !st.current.over) saveSurvival(id, st.current.score, false, true);
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);

  const finish = (finalScore: number) => {
    setOver(true);
    saveSurvival(id, finalScore, true);
    sfx.win(finalScore >= 10);
  };

  const onAnswer = (ok: boolean) => {
    if (ok) {
      const ns = score + 1;
      setScore(ns);
      if (ns % 5 === 0) saveSurvival(id, ns, false); // ilova to'satdan yopilsa ham natija yo'qolmaydi
    } else {
      setLives(l => l - 1);
    }
  };

  const onDone = (_ok: boolean) => {
    // jon va ball onAnswer da allaqachon yangilangan
    if (lives <= 0 || i + 1 >= queue.length) return finish(score);
    setI(i + 1);
  };

  const exit = () => {
    if (!over) {
      if (!window.confirm('Chiqsangiz urinishingiz tugaydi (qayta urinib bo‘lmaydi). Natijangiz saqlanadi. Chiqasizmi?')) return;
      saveSurvival(id, score, true);
    }
    closeOverlay();
  };

  const hearts = (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxLives }).map((_, k) => (
        <Heart key={k} className={`w-5 h-5 ${k < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`} />
      ))}
    </div>
  );

  return (
    <Shell title={`🏃 ${ch?.title || 'Marafon'}`} sub="Marafon · har kimga 1 ta urinish" onBack={exit}>
      {!over && q ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-[#151C28] border border-slate-800 px-4 py-2.5">
            {hearts}
            <div className="text-sm text-slate-300">Natija: <b className="text-amber-400 text-lg tabular-nums">{score}</b></div>
          </div>
          <QuestionView key={`s-${i}`} q={q} onAnswer={onAnswer} onDone={onDone} />
        </div>
      ) : (
        <div className="text-center space-y-4 pt-6">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
          <h2 className="text-xl font-extrabold text-white">Marafon yakunlandi</h2>
          <div className="text-sm text-slate-300">Ketma-ket topilgan so‘zlar: <b className="text-amber-400 text-2xl">{score}</b></div>
          <p className="text-xs text-slate-400 leading-relaxed">Natijangiz saqlandi. Chellenj tugagach admin g‘oliblarni e‘lon qiladi va sertifikatlar Telegram chatingizga yuboriladi.</p>
          <button type="button" onClick={closeOverlay} className="w-full h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm">Tayyor</button>
        </div>
      )}
    </Shell>
  );
};
