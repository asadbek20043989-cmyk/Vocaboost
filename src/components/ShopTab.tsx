import React, { useState, useRef, useEffect } from 'react';
import {
  Coins,
  Diamond,
  Zap,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  BookOpen,
  Music,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Download,
  Flame,
  Award,
  Crown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShopItem, ShopCategory, TopBook, LofiTrack } from '../types';
import { triggerHaptic } from '../services/telegram';
import { sfx } from '../services/sound';

export const ShopTab: React.FC = () => {
  const {
    profile,
    shopItems,
    books,
    lofiTracks,
    buyShopItem,
    isDoubleXpActive,
    doubleXpTimeLeft,
    updateProfile,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all');
  const [selectedBook, setSelectedBook] = useState<TopBook | null>(null);
  const [mysteryPrize, setMysteryPrize] = useState<{ type: string; text: string } | null>(null);
  const [showMysteryModal, setShowMysteryModal] = useState(false);
  const [lofiPlayerOpen, setLofiPlayerOpen] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingLofi, setIsPlayingLofi] = useState(false);
  const [lofiMuted, setLofiMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio setup for Lo-Fi player
  const currentTrack: LofiTrack | undefined = lofiTracks[currentTrackIndex] || lofiTracks[0];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = lofiMuted;
    }
  }, [lofiMuted]);

  const togglePlayLofi = () => {
    if (!audioRef.current && currentTrack) {
      audioRef.current = new Audio(currentTrack.src);
      audioRef.current.loop = true;
    }
    if (!audioRef.current) return;

    if (isPlayingLofi) {
      audioRef.current.pause();
      setIsPlayingLofi(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingLofi(true)).catch(() => {});
    }
    triggerHaptic('light');
  };

  const nextTrack = () => {
    if (lofiTracks.length <= 1) return;
    const nextIdx = (currentTrackIndex + 1) % lofiTracks.length;
    setCurrentTrackIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = new Audio(lofiTracks[nextIdx].src);
      audioRef.current.loop = true;
      if (isPlayingLofi) {
        audioRef.current.play().catch(() => {});
      }
    }
    triggerHaptic('selection');
  };

  const categories: { id: ShopCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Barchasi', icon: '✨' },
    { id: 'boosters', label: 'Kuchaytirgich', icon: '⚡' },
    { id: 'cosmetics', label: 'Bezaklar', icon: '🎨' },
    { id: 'titles_themes', label: 'Unvon & Mavzu', icon: '👑' },
    { id: 'learning', label: 'Kitob & Lug‘at', icon: '📚' },
    { id: 'special', label: 'Maxsus', icon: '🎁' },
  ];

  const filteredItems = shopItems.filter(item => {
    if (item.isActive === false) return false;
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const inventory = profile.inventory || [];

  const handlePurchase = (item: ShopItem, currency: 'coins' | 'xp') => {
    // If it's permanent and already owned, activate directly
    if (item.itemType === 'permanent' && inventory.includes(item.id)) {
      if (item.id === 'frame_golden') {
        updateProfile({ activeFrame: profile.activeFrame === 'golden' ? '' : 'golden' });
        triggerHaptic('selection');
      } else if (item.id === 'frame_fire') {
        updateProfile({ activeFrame: profile.activeFrame === 'fire' ? '' : 'fire' });
        triggerHaptic('selection');
      } else if (item.id === 'frame_crystal') {
        updateProfile({ activeFrame: profile.activeFrame === 'crystal' ? '' : 'crystal' });
        triggerHaptic('selection');
      } else if (item.id.startsWith('custom_title_')) {
        const titleName = item.title.replace('Maxsus unvon: ', '').replace(/«|»/g, '');
        updateProfile({ activeTitle: profile.activeTitle === titleName ? '' : titleName });
        triggerHaptic('selection');
      } else if (item.id === 'leaderboard_crown') {
        updateProfile({ hasCrown: !profile.hasCrown });
        triggerHaptic('selection');
      } else if (item.id === 'gradient_nick') {
        updateProfile({ hasGlowingNick: !profile.hasGlowingNick });
        triggerHaptic('selection');
      } else if (item.id === 'vip_badge') {
        updateProfile({ hasVipCheck: !profile.hasVipCheck });
        triggerHaptic('selection');
      } else if (item.id === 'top_books') {
        setSelectedBook(books[0] || null);
      } else if (item.id === 'lofi_music') {
        setLofiPlayerOpen(true);
      }
      return;
    }

    const res = buyShopItem(item, currency);
    if (res.ok && res.prize) {
      setMysteryPrize(res.prize);
      setShowMysteryModal(true);
      sfx.win(true);
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-md mx-auto">
      {/* Do'kon sarlavhasi va Balans kartochkasi */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1A2333] via-[#151C28] to-[#0E1524] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">VocaBoost Do‘koni</h2>
              <p className="text-[11px] text-slate-400">Tangalar sarflab kuchaytirgich va maxsus sovg‘alar oling</p>
            </div>
          </div>
        </div>

        {/* Balans: Tanga va XP */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#0B0F17]/80 border border-amber-500/30 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
              🪙
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Tangalar</div>
              <div className="text-lg font-black text-white tabular-nums">
                {(profile.coins ?? 50).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0B0F17]/80 border border-sky-500/30 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-sky-500/20">
              💎
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Jami XP</div>
              <div className="text-lg font-black text-white tabular-nums">
                {profile.xp.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Faol 2x XP booster taymeri */}
        {isDoubleXpActive && (
          <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-1.5 font-bold animate-pulse">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              2x XP kuchaytirgich faol!
            </span>
            <span className="font-extrabold tabular-nums bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30 text-amber-200">
              ⏳ {doubleXpTimeLeft}
            </span>
          </div>
        )}
      </div>

      {/* Lo-Fi Music Widget Shortcut (if unlocked or available) */}
      <div className="p-3 rounded-2xl bg-[#151C28] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Lo-Fi Study Player</span>
              {isPlayingLofi && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[190px]">
              {currentTrack?.title || 'Fokus uchun musiqalar'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={togglePlayLofi}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
              isPlayingLofi ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isPlayingLofi ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-200" />}
            <span>{isPlayingLofi ? 'Pauza' : 'Ijro'}</span>
          </button>
          <button
            type="button"
            onClick={nextTrack}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
            title="Keyingi musiqa"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kategoriyalar filtri */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveCategory(c.id);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === c.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[#151C28] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Mahsulotlar ro'yxati */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredItems.map(item => {
          const isOwned = item.itemType === 'permanent' && inventory.includes(item.id);
          const isEquipped = (() => {
            if (!isOwned) return false;
            if (item.id === 'frame_golden' && profile.activeFrame === 'golden') return true;
            if (item.id === 'frame_fire' && profile.activeFrame === 'fire') return true;
            if (item.id === 'frame_crystal' && profile.activeFrame === 'crystal') return true;
            if (item.id === 'leaderboard_crown' && profile.hasCrown) return true;
            if (item.id === 'gradient_nick' && profile.hasGlowingNick) return true;
            if (item.id === 'vip_badge' && profile.hasVipCheck) return true;
            if (item.id.startsWith('custom_title_')) {
              const titleName = item.title.replace('Maxsus unvon: ', '').replace(/«|»/g, '');
              return profile.activeTitle === titleName;
            }
            return false;
          })();

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                isEquipped
                  ? 'bg-gradient-to-br from-amber-500/10 via-[#151C28] to-[#151C28] border-amber-500/50 shadow-lg shadow-amber-500/5'
                  : 'bg-[#151C28] border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Badge */}
              {item.badge && (
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/30 text-[10px] font-black text-amber-300">
                  {item.badge}
                </span>
              )}

              <div>
                {/* Icon & Title */}
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-11 h-11 rounded-2xl bg-[#0E1524] border border-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {item.icon || '🛍️'}
                  </div>
                  <div className="min-w-0 pr-12">
                    <h3 className="text-sm font-bold text-white truncate leading-snug">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price & Action button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                  <span>🪙 {item.priceCoins}</span>
                  {item.priceXp && (
                    <span className="text-[10px] text-slate-500 font-semibold">yoki {item.priceXp} XP</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isOwned ? (
                    <button
                      type="button"
                      onClick={() => handlePurchase(item, 'coins')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                        isEquipped
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500 text-slate-950 shadow-sm'
                      }`}
                    >
                      {isEquipped ? '✓ O‘rnatilgan' : 'O‘rnatish'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePurchase(item, 'coins')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-amber-500/20"
                    >
                      Olish
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mystery Box Reveal Modal */}
      {showMysteryModal && mysteryPrize && (
        <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#1C2538] to-[#0E1524] border border-amber-500/50 p-6 text-center space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30 animate-bounce">
              🎁
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Tabriklaymiz!</h3>
              <p className="text-xs text-slate-400 mt-1">Sirli quti ochildi va sizga sovrin berildi:</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-2xl font-black text-amber-300">
              {mysteryPrize.text}
            </div>
            <p className="text-[11px] text-slate-400">
              Sovrin balansingizga shu zahoti qo‘shildi!
            </p>
            <button
              type="button"
              onClick={() => setShowMysteryModal(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
              Qabul qilish 🚀
            </button>
          </div>
        </div>
      )}

      {/* Book Reader Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-[125] bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
          <div className="w-full max-w-lg max-h-[85vh] rounded-3xl bg-[#151C28] border border-slate-700 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">{selectedBook.title}</h3>
                <p className="text-xs text-slate-400">{selectedBook.author} · Daraja: {selectedBook.level}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-200 leading-relaxed font-serif">
              <p className="text-xs text-amber-400 font-sans font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                📖 {selectedBook.desc}
              </p>
              <div className="whitespace-pre-line text-slate-300 bg-[#0E1524] p-4 rounded-2xl border border-slate-800">
                {selectedBook.content || "Kitob matni tez kunda to'liq yuklanadi."}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-[#0E1524]">
              {selectedBook.readUrl ? (
                <a
                  href={selectedBook.readUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" /> To‘liq kitobni ochish
                </a>
              ) : <div />}
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
