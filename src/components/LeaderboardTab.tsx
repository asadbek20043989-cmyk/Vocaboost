import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Diamond,
  Settings,
  Award,
  BookOpen,
  Brain,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EnglishLevel } from '../types';
import { triggerHaptic, getTelegramUserData } from '../services/telegram';
import { compressImage, AVATAR_PRESETS, presetValue } from '../services/avatar';
import { useSfx } from '../services/sound';
import { botSetRemind } from '../services/bot';
import { Avatar } from './Avatar';
import { DuelTab } from './DuelTab';
import { ChallengesTab } from './ChallengesTab';

export const LeaderboardTab: React.FC = () => {
  const { profile, savedWords, badges, updateProfile, resetProgress, leagueUsers, leagueLive, realtimeOn, showCertificate, certificates, accountId, isTelegram, linkAccount, realtimeOn: rtOn } = useApp();
  const [linkCode, setLinkCode] = useState('');
  const [linkMsg, setLinkMsg] = useState('');

  const { pendingDuelCode } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'league' | 'duel' | 'challenge' | 'profile'>(() => {
    let want = '';
    try {
      want = sessionStorage.getItem('vb_liga_sub') || '';
      sessionStorage.removeItem('vb_liga_sub');
    } catch {
      /* ignore */
    }
    return pendingDuelCode || want === 'duel' ? 'duel' : want === 'challenge' ? 'challenge' : 'league';
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(50);

  // Settings form state
  const [editName, setEditName] = useState(profile.name);
  const [editLevel, setEditLevel] = useState<EnglishLevel>(profile.level);
  const [editPerDay, setEditPerDay] = useState<number>(profile.wordsPerDay);
  const [editRemind, setEditRemind] = useState(profile.botRemind !== false);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);
  const [sfxOn, setSfxOn] = useSfx();

  const tgInfo = getTelegramUserData();
  const tgAvatar = tgInfo.avatar || (isTelegram ? profile.avatar : undefined);

  // Real vaqtdagi umumiy reyting (barcha foydalanuvchilar)
  const leaderboardList = leagueUsers;

  const currentUserRank = leaderboardList.findIndex(u => u.isCurrentUser) + 1;

  const handleSaveSettings = () => {
    triggerHaptic('success');
    const name = editName.trim() || "O'quvchi";
    updateProfile({
      name,
      level: editLevel,
      wordsPerDay: editPerDay,
      dailyGoalMinutes: Math.round(6 + editPerDay * 0.7),
      avatar: editAvatar,
      botRemind: editRemind,
      customName: profile.customName || name !== profile.name,
      // Telegram rasmi tanlansa — avtomatik yangilanib turadi; boshqasi tanlansa — o'zgarmas
      customAvatar: editAvatar === tgAvatar ? false : profile.customAvatar || editAvatar !== profile.avatar,
    });
    if (isTelegram && editRemind !== (profile.botRemind !== false)) botSetRemind(editRemind).catch(() => {});
    setShowSettingsModal(false);
  };

  return (
    <div className="space-y-4 pb-8 max-w-md mx-auto">
      {/* Top Bar with Settings Icon */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Reyting va Profil</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ligada bellashing va yutuqlaringizni kuzating
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowSettingsModal(true);
          }}
          className="w-10 h-10 rounded-xl bg-[#151C28] hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 transition-colors"
          title="Sozlamalar"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-[#151C28] rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setActiveSubTab('league');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
            activeSubTab === 'league'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏆 Liga
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setActiveSubTab('challenge');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
            activeSubTab === 'challenge'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏁 Chellenj
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setActiveSubTab('duel');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
            activeSubTab === 'duel'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚔️ Bellashuv
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setActiveSubTab('profile');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
            activeSubTab === 'profile'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          👤 Profil
        </button>
      </div>

      {/* SUB-VIEW 1: Haftalik Liga */}
      {activeSubTab === 'league' && (
        <div className="space-y-3">
          {/* Top 3 Podium Box */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#151C28] via-[#1B2433] to-[#121822] border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-semibold text-[11px] shadow-sm">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{leaderboardList.length > 0 ? `${leaderboardList.length.toLocaleString()} ta o'quvchi` : 'O\'quvchilar...'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  {realtimeOn && leagueLive && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${realtimeOn && leagueLive ? 'bg-emerald-400' : realtimeOn ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                </span>
                {!realtimeOn ? 'Oflayn rejim' : leagueLive ? 'Jonli reyting' : 'Reyting yuklanmoqda…'}
              </span>
            </div>

            <div className="flex items-end justify-around pt-2 pb-1">
              {/* 2nd place */}
              {leaderboardList[1] && (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-400 mb-1">2-o&apos;rin</span>
                  <Avatar src={leaderboardList[1].avatar} name={leaderboardList[1].name} className="w-12 h-12  border-2 border-slate-400" />
                  <span className="text-xs font-bold text-white mt-1 max-w-[80px] truncate text-center">
                    {leaderboardList[1].name}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                    {leaderboardList[1].xp} XP
                  </span>
                </div>
              )}

              {/* 1st place */}
              {leaderboardList[0] && (
                <div className="flex flex-col items-center -translate-y-2">
                  <div className="text-amber-400 mb-1">👑 1-o&apos;rin</div>
                  <Avatar src={leaderboardList[0].avatar} name={leaderboardList[0].name} className="w-16 h-16  border-2 border-amber-400   shadow-lg shadow-amber-500/20" />
                  <span className="text-sm font-bold text-white mt-1 max-w-[90px] truncate text-center">
                    {leaderboardList[0].name}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                    {leaderboardList[0].xp} XP
                  </span>
                </div>
              )}

              {/* 3rd place */}
              {leaderboardList[2] && (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-amber-600 mb-1">3-o&apos;rin</span>
                  <Avatar src={leaderboardList[2].avatar} name={leaderboardList[2].name} className="w-12 h-12  border-2 border-amber-700" />
                  <span className="text-xs font-bold text-white mt-1 max-w-[80px] truncate text-center">
                    {leaderboardList[2].name}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                    {leaderboardList[2].xp} XP
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Current User Fixed Position Strip */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-base text-amber-400 w-6 text-center tabular-nums">
                #{currentUserRank || '-'}
              </span>
              <Avatar src={profile.avatar} name={profile.name} className="w-10 h-10 border border-amber-400" />
              <div>
                <div className="font-bold text-sm text-white">{profile.name} (Siz)</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>{profile.level}</span>
                  <span>·</span>
                  <span className="text-orange-400 flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-orange-400 inline" /> {profile.streak} kun
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="font-extrabold text-sm text-amber-400 tabular-nums">
                {profile.xp} XP
              </span>
            </div>
          </div>

          {/* Remaining Rankings List */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-slate-400 font-semibold uppercase px-1">Barcha Ishtirokchilar</span>
            {leaderboardList.slice(0, displayLimit).map((user, idx) => {
              const rank = idx + 1;
              const isMe = user.isCurrentUser;

              return (
                <div
                  key={user.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isMe
                      ? 'bg-amber-500/15 border-amber-500/60'
                      : 'bg-[#151C28] border-slate-800/80 hover:bg-[#1B2333]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-slate-400 w-5 text-center tabular-nums">
                      {rank}
                    </span>
                    <Avatar src={user.avatar} name={user.name} className="w-8 h-8" />
                    <div className="truncate max-w-[150px]">
                      <div className="font-semibold text-xs text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {user.level} · {user.streak} kun streak
                      </div>
                    </div>
                  </div>

                  <span className="font-bold text-xs text-amber-400 tabular-nums">
                    {user.xp} XP
                  </span>
                </div>
              );
            })}
            {leaderboardList.length > displayLimit && (
              <button
                type="button"
                onClick={() => setDisplayLimit(l => l + 50)}
                className="w-full py-3 rounded-xl bg-[#1B2333] border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-[0.98]"
              >
                Yana ko&apos;rsatish ({Math.min(displayLimit, leaderboardList.length)} / {leaderboardList.length})
              </button>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'duel' && <DuelTab />}
      {activeSubTab === 'challenge' && <ChallengesTab />}

      {/* SUB-VIEW 2: Shaxsiy Profil */}
      {activeSubTab === 'profile' && (
        <div className="space-y-4">
          {/* Profile Overview Card */}
          <div className="p-4 rounded-3xl bg-[#151C28] border border-slate-800 text-center space-y-3">
            <Avatar src={profile.avatar} name={profile.name} className="w-20 h-20 border-2 border-amber-500 mx-auto shadow-lg" />
            <div>
              <h3 className="text-lg font-bold text-white">{profile.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daraja: <strong className="text-amber-400">{profile.level}</strong> · Maqsad: kuniga {profile.wordsPerDay} ta so&apos;z
              </p>
            </div>

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <div className="p-2.5 rounded-xl bg-[#0E1524] border border-slate-800 text-center">
                <div className="text-base font-bold text-amber-400 tabular-nums flex items-center justify-center gap-1">
                  <Diamond className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {profile.xp}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Jami XP</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0E1524] border border-slate-800 text-center">
                <div className="text-base font-bold text-orange-400 tabular-nums flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 fill-orange-400 text-orange-400" />
                  {profile.streak}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kun Streak</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0E1524] border border-slate-800 text-center">
                <div className="text-base font-bold text-emerald-400 tabular-nums flex items-center justify-center gap-1">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  {savedWords.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">So&apos;zlar</div>
              </div>
            </div>
          </div>

          {/* Sertifikatlar */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Sertifikatlarim ({certificates.length})</span>
            </h4>
            {certificates.length === 0 ? (
              <p className="text-xs text-slate-500 px-1">100, 250, 500, 750 va 1000 ta so&apos;zni yodlaganingizda ismingiz yozilgan sertifikat avtomatik beriladi. Admin ham sizga maxsus sertifikat yuborishi mumkin.</p>
            ) : (
              <div className="grid gap-2">
                {certificates.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => showCertificate(c)}
                    className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-left"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{c.title}{c.special ? ' ⭐' : ''}</div>
                      <div className="text-[11px] text-slate-400">{c.date} · № {c.id}</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">Ko&apos;rish 🎓</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Badges / Achievements Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Yutuqlar &amp; Nishonlar ({badges.filter(b => b.unlocked).length} / {badges.length})</span>
            </h4>

            <div className="grid gap-2">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    badge.unlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-white'
                      : 'bg-[#151C28]/60 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      badge.unlocked
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-2">
                      <span>{badge.titleUz}</span>
                      {badge.unlocked && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 rounded">
                          Ochilgan ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {badge.descriptionUz}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (O'ng tepadagi sozlamalar) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-[#0B0F17]/95 backdrop-blur-md flex flex-col justify-between p-4 max-w-md mx-auto">
          {/* Modal Header */}
          <div className="pt-2 flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Sozlamalar</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="text-slate-400 hover:text-white text-xs font-semibold"
            >
              Yopish ✕
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Ismingiz</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-[#151C28] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Avatar Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Profil rasmi</label>
              <div className="flex items-center gap-3 flex-wrap">
                <Avatar src={editAvatar} name={editName} className="w-16 h-16 border-2 border-amber-500/60" />
                <label className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer active:scale-95" data-sfx>
                  📷 Rasm yuklash
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        setEditAvatar(await compressImage(f, 96, 0.8, 5800));
                        triggerHaptic('success');
                      } catch {
                        /* ignore */
                      }
                    }}
                  />
                </label>
                {tgAvatar && (
                  <button type="button" onClick={() => setEditAvatar(tgAvatar)} className="px-3 py-2 rounded-lg bg-[#151C28] border border-slate-700 text-slate-300 text-xs font-semibold">
                    Telegram rasmi
                  </button>
                )}
              </div>
              <label className="text-xs font-semibold text-slate-300 block pt-1">Yoki maxsus avatar tanlang</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map(pr => {
                  const v = presetValue(pr.id);
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setEditAvatar(v);
                      }}
                      aria-label={pr.id}
                      className={`rounded-full p-0.5 border-2 transition-all ${editAvatar === v ? 'border-amber-400 scale-105' : 'border-transparent opacity-70'}`}
                    >
                      <Avatar src={v} name={pr.id} className="w-full aspect-square" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* English Level Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Ingliz tili darajangiz</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['A1', 'A2', 'B1', 'B2+'] as EnglishLevel[]).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setEditLevel(lvl);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      editLevel === lvl
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-[#151C28] text-slate-300 border-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily words */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Kuniga nechta yangi so&apos;z</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setEditPerDay(n);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${editPerDay === n ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' : 'bg-[#151C28] text-slate-300 border-slate-800'}`}
                  >
                    {n} ta
                  </button>
                ))}
              </div>
            </div>

            {/* Bot eslatmasi */}
            {isTelegram && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#151C28] border border-slate-800">
                <div className="text-xs text-slate-300">
                  <div className="font-semibold">Kunlik eslatma (bot orqali)</div>
                  <div className="text-[11px] text-slate-500">Telegram chatingizga eslatma keladi</div>
                </div>
                <input type="checkbox" checked={editRemind} onChange={e => setEditRemind(e.target.checked)} className="accent-amber-500 w-4 h-4" />
              </div>
            )}

            {/* Sound Toggle (darhol amal qiladi) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#151C28] border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                {sfxOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>Tovush effektlari (tugmalar, to&apos;g&apos;ri/xato javob)</span>
              </div>
              <input type="checkbox" data-nosfx checked={sfxOn} onChange={e => setSfxOn(e.target.checked)} className="accent-amber-500 w-4 h-4" />
            </div>

            {/* Hisob sinxronlash (telefon <-> noutbuk) */}
            <div className="p-3 rounded-xl bg-[#151C28] border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white">Qurilmalar o&apos;rtasida sinxronlash</div>
              {isTelegram ? (
                <p className="text-[11px] text-slate-400 leading-relaxed">Telegram hisobingiz orqali progress (XP, so&apos;zlar, baraban, VIP) barcha qurilmalarda avtomatik bir xil bo&apos;ladi. Telegram ichida (ilova/Desktop/Web) oching.</p>
              ) : (
                <>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Brauzerda ochgan bo&apos;lsangiz, boshqa qurilmadagi hisobni ulash uchun shu kodni u yerda kiriting. Yaxshisi, ilovani har ikki qurilmada ham Telegram ichida oching.</p>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 text-[11px] bg-[#0E1524] border border-slate-800 rounded-lg px-2 py-2 text-amber-300 break-all">{accountId}</code>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(accountId); setLinkMsg('Kod nusxalandi'); }} className="px-3 py-2 rounded-lg bg-slate-800 text-xs font-semibold">Nusxalash</button>
                  </div>
                  <button type="button" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/?link=${accountId}`); setLinkMsg('Havola nusxalandi — uni boshqa qurilmada oching, hisob avtomatik ulanadi'); }} className="w-full py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold">Ulash havolasini nusxalash (eng oson usul)</button>
                  <div className="flex gap-2">
                    <input value={linkCode} onChange={e => setLinkCode(e.target.value)} placeholder="Boshqa qurilmadagi kod" className="flex-1 bg-[#0E1524] border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                    <button type="button" onClick={() => { if (!linkAccount(linkCode)) setLinkMsg("Kod noto'g'ri"); }} className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold">Ulash</button>
                  </div>
                </>
              )}
              {linkMsg && <p className="text-[11px] text-amber-300">{linkMsg}</p>}
              {!rtOn && <p className="text-[11px] text-rose-300">Bulut ulanmagan (VITE_FIREBASE_DB_URL), sinxronlash ishlamaydi.</p>}
            </div>

            {/* Reset Data Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Barcha saqlangan so'zlar va test natijalarini tozalashni xohlaysizmi?")) {
                    resetProgress();
                    setShowSettingsModal(false);
                  }
                }}
                className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Barcha progressni qayta o&apos;rnatish (Reset)</span>
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 pb-safe">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              Saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
