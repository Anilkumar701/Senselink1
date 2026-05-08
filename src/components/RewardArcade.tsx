import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Star, RefreshCw, Box, Layout, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

enum AppMode {
  IDLE = 'IDLE',
  AUTISM = 'AUTISM',
  ADHD = 'ADHD',
  AUDHD = 'AUDHD'
}

interface RewardArcadeProps {
  mode: AppMode;
  stars: number;
  onSpend: (stars: number, prize: string) => void;
  ownedPrizes: string[];
  reducedMotion?: boolean;
}

const ALL_PRIZES = [
  { id: 'cat', name: 'Magic Cat', icon: '🐱', cost: 10, category: 'Animals' },
  { id: 'dog', name: 'Space Dog', icon: '🐶', cost: 10, category: 'Animals' },
  { id: 'bear', name: 'Golden Bear', icon: '🧸', cost: 20, category: 'Animals' },
  { id: 'ufo', name: 'Neon UFO', icon: '🛸', cost: 30, category: 'Space' },
  { id: 'rocket', title: 'Rocket Ship', icon: '🚀', cost: 25, category: 'Space' },
  { id: 'robot', name: 'Helping Robot', icon: '🤖', cost: 15, category: 'Tools' },
  { id: 'hammer', name: 'Magic Hammer', icon: '🔨', cost: 12, category: 'Tools' },
  { id: 'rainbow', name: 'Rainbow Prize', icon: '🌈', cost: 50, category: 'Rare' },
  { id: 'diamond', name: 'Cosmic Gem', icon: '💎', cost: 100, category: 'Rare' }
];

export default function RewardArcade({ mode, stars, onSpend, ownedPrizes, reducedMotion = false }: RewardArcadeProps) {
  const isADHD = mode === AppMode.ADHD;
  const isAutism = mode === AppMode.AUTISM;
  const isAuDHD = mode === AppMode.AUDHD;

  const [revealing, setRevealing] = useState<string | null>(null);

  const handlePurchase = (prize: any) => {
    if (stars >= prize.cost && !ownedPrizes.includes(prize.id)) {
      onSpend(prize.cost, prize.id);
      setRevealing(prize.icon);
      setTimeout(() => setRevealing(null), 2000);
    }
  };

  return (
    <div className="w-full min-h-[70vh] flex flex-col gap-10">
      <header className="flex justify-between items-center bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/20">
         <div>
            <h2 className="text-4xl font-display font-black text-theme">Reward Arcade</h2>
            <p className="text-theme/50 font-bold uppercase tracking-widest">
                {isADHD ? "Win big with your stars!" : 
                 isAutism ? "Collect and organize your prizes." : 
                 "Trade for rare treasures."}
            </p>
         </div>
         <div className="flex items-center gap-4 bg-yellow-400 px-8 py-4 rounded-3xl shadow-xl">
            <Star className="text-slate-900 fill-slate-900" size={32} />
            <span className="text-4xl font-black text-slate-900">{stars}</span>
         </div>
      </header>

      <div className="grow">
        <AnimatePresence mode="wait">
          {isADHD && (
            <ADHDView key="adhd" stars={stars} onWin={handlePurchase} ownedPrizes={ownedPrizes} reducedMotion={reducedMotion} />
          )}
          {isAutism && (
            <AutismView key="autism" stars={stars} onPick={handlePurchase} ownedPrizes={ownedPrizes} reducedMotion={reducedMotion} />
          )}
          {isAuDHD && (
            <AuDHDView key="audhd" stars={stars} onTrade={handlePurchase} ownedPrizes={ownedPrizes} reducedMotion={reducedMotion} />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {revealing && (
          <motion.div 
            initial={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: -20 }}
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { scale: 2, opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/40 backdrop-blur-lg pointer-events-none"
          >
             <div className="text-[15rem] mb-8">{revealing}</div>
             <motion.div animate={reducedMotion ? {} : { scale: [1, 1.2, 1] }} transition={reducedMotion ? {} : { repeat: Infinity }} className="text-5xl font-black text-white">NEW PRIZE!</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ADHDView({ stars, onWin, ownedPrizes, reducedMotion }: any) {
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (stars < 10 || spinning) return;
    setSpinning(true);
    setTimeout(() => {
      const eligible = ALL_PRIZES.filter(p => !ownedPrizes.includes(p.id));
      if (eligible.length > 0) {
        const win = eligible[Math.floor(Math.random() * eligible.length)];
        onWin({ ...win, cost: 10 }); // fixed cost for spin
      }
      setSpinning(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-12 py-10">
      <div className="relative">
         <motion.div 
           animate={spinning ? { rotate: reducedMotion ? [0, 5, -5, 0] : 1080 } : { rotate: 0 }}
           transition={spinning && reducedMotion ? { repeat: Infinity, duration: 0.5 } : { duration: 2, ease: "circOut" }}
           className="w-80 h-80 rounded-full border-[16px] border-yellow-400 bg-theme/5 relative shadow-2xl flex items-center justify-center text-7xl"
         >
            {spinning ? '🎲' : <Gift size={120} className="text-yellow-400" />}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-4 h-12 bg-red-500 rounded-full" />
         </motion.div>
      </div>

      <div className="flex flex-col items-center">
        <button 
          onClick={spin}
          disabled={stars < 10 || spinning}
          className={cn(
             "px-16 py-8 rounded-[40px] font-black text-3xl shadow-2xl transition-all border-b-8",
             stars >= 10 ? cn("bg-active-primary text-white border-active-shadow active:border-b-0 active:translate-y-2", !reducedMotion && "hover:scale-105") : "bg-slate-300 text-slate-500 border-slate-400 border-b-4 cursor-not-allowed"
          )}
        >
          {spinning ? 'SPINNING...' : 'SPIN FOR 10 STARS! 🎰'}
        </button>
        <p className="mt-8 text-theme/40 font-bold uppercase tracking-widest italic">Claw Machine Mode: ACTIVE</p>
      </div>
    </div>
  );
}

function AutismView({ stars, onPick, ownedPrizes, reducedMotion }: any) {
  const categories = ['Animals', 'Space', 'Tools', 'Rare'];
  const [selectedCat, setSelectedCat] = useState('Animals');

  return (
    <div className="flex flex-col gap-12 py-4">
      <div className="flex justify-center gap-4">
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => setSelectedCat(c)}
            className={cn(
               "px-8 py-3 rounded-2xl font-black transition-all",
               selectedCat === c ? "bg-primary-theme text-white shadow-lg" : "bg-white/40 text-theme/60 hover:bg-white/60"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {ALL_PRIZES.filter(p => !ownedPrizes.includes(p.id) && p.category === selectedCat).map(p => (
           <motion.button
             key={p.id}
             whileHover={reducedMotion ? {} : { scale: 1.05 }}
             onClick={() => onPick(p)}
             className={cn(
                "p-8 rounded-[32px] glass-card border-2 border-white/50 flex flex-col items-center gap-4 group transition-all",
                stars >= p.cost ? "opacity-100" : "opacity-40 grayscale"
             )}
           >
             <div className="text-6xl group-hover:scale-125 transition-transform">{p.icon}</div>
             <div className="text-center font-bold text-theme">{p.name || (p as any).title}</div>
             <div className="bg-yellow-100 text-yellow-700 px-4 py-1 rounded-full text-sm font-black flex items-center gap-2">
                <Star size={14} fill="currentColor" /> {p.cost}
             </div>
           </motion.button>
        ))}
      </div>
    </div>
  );
}

function AuDHDView({ stars, onTrade, ownedPrizes, reducedMotion }: any) {
  const [discountActive, setDiscountActive] = useState(false);

  // Simple "AI Trade Bot" logic
  const tradeBotMessage = useMemo(() => {
    if (stars > 80) return "Psst! I have some Rare items for a bulk discount today!";
    if (stars < 20) return "Keep playing games to earn more stars for my treasures!";
    return "Welcome to the Cosmic Gallery. What catches your eye?";
  }, [stars]);

  return (
    <div className="flex flex-col gap-10 py-4">
      <div className="bg-mixed-primary/10 border border-mixed-primary/20 p-8 rounded-[40px] flex items-start gap-6">
         <div className="bg-mixed-primary p-4 rounded-full text-white shadow-lg">
            <MessageSquare size={32} />
         </div>
         <div>
            <p className="text-lg font-bold text-theme mb-2">Cosmic Trader</p>
            <p className="text-2xl font-black text-theme/70 tracking-tight leading-snug">"{tradeBotMessage}"</p>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
        {ALL_PRIZES.filter(p => !ownedPrizes.includes(p.id)).slice(0, 6).map(p => {
           const finalCost = discountActive ? Math.floor(p.cost * 0.8) : p.cost;
           return (
             <motion.button
               key={p.id}
               whileHover={reducedMotion ? {} : { y: -10 }}
               onClick={() => onTrade({...p, cost: finalCost})}
               className="p-10 rounded-[48px] bg-white/40 border border-white/50 shadow-xl flex flex-col items-center gap-6 relative group overflow-hidden"
             >
                {discountActive && <div className="absolute top-4 left-4 bg-red-400 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">20% OFF</div>}
                <div className="text-7xl group-hover:scale-110 transition-transform">
                   {p.icon}
                </div>
                <div className="text-center font-black text-2xl text-theme">{p.name || (p as any).title}</div>
                <div className="bg-mixed-primary text-white px-8 py-3 rounded-full font-black flex items-center gap-2 shadow-lg group-hover:bg-mixed-secondary transition-colors">
                   <Star size={20} fill="currentColor" /> {finalCost}
                </div>
             </motion.button>
           );
        })}
      </div>

      <button 
        onClick={() => setDiscountActive(!discountActive)}
        className="mx-auto flex items-center gap-4 bg-white/10 hover:bg-white/20 transition-all px-10 py-4 rounded-full border border-white/20 text-theme font-black"
      >
        <RefreshCw size={24} className={cn(discountActive && !reducedMotion && "animate-spin")} />
        Negotiate Price
      </button>
    </div>
  );
}
