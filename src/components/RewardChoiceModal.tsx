import React from 'react';
import { motion } from 'motion/react';
import { Gift, Archive, Star, Award } from 'lucide-react';
import { cn } from '../lib/utils';

enum AppMode {
  IDLE = 'IDLE',
  AUTISM = 'AUTISM',
  ADHD = 'ADHD',
  AUDHD = 'AUDHD'
}

interface RewardChoiceModalProps {
  mode: AppMode;
  reward: { type: string; value: string | number };
  onOpenNow: () => void;
  onSaveLater: () => void;
  starsCollectedToday: number;
  reducedMotion?: boolean;
}

export default function RewardChoiceModal({ mode, reward, onOpenNow, onSaveLater, starsCollectedToday, reducedMotion = false }: RewardChoiceModalProps) {
  const isADHD = mode === AppMode.ADHD;

  const targetStars = mode === AppMode.AUTISM ? 5 : 3;
  const progress = Math.min(100, (starsCollectedToday / targetStars) * 100);

  const rewardHeading =
    reward.type === 'star'
      ? `${reward.value} Cosmic Stars!`
      : `New Badge: ${reward.value}`;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-choice-title"
    >
      <motion.div 
        initial={reducedMotion ? { opacity: 0 } : { scale: 0.8, y: 50 }}
        animate={reducedMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
        className="bg-white rounded-[56px] overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col items-center ring-4 ring-slate-900/10"
      >
        {/* Header */}
        <div className="w-full bg-slate-100 p-12 flex flex-col items-center gap-6 border-b-2 border-slate-300">
          <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center shadow-xl">
             {reward.type === 'star' ? <Star size={64} className="text-amber-300 fill-amber-300" strokeWidth={1.75} /> : <Award size={64} className="text-amber-300" strokeWidth={1.75} />}
          </div>
          <h2 id="reward-choice-title" className="text-4xl md:text-[2.65rem] font-display font-black text-slate-900 text-center leading-tight px-4">
            {rewardHeading}
          </h2>
          <p className="text-slate-600 font-bold text-center text-lg">
            Tap <span className="text-slate-900">Open Now</span> to celebrate, or <span className="text-slate-900">Save for Later</span> to tuck it away.
          </p>
        </div>

        {/* Choices */}
        <div className="p-10 w-full flex flex-col md:flex-row gap-6">
          <button 
            onClick={onOpenNow}
            className={cn(
              "flex-1 group bg-gradient-to-br from-orange-400 to-orange-600 text-white p-8 rounded-[40px] flex flex-col items-center gap-4 shadow-xl border-b-[8px] border-orange-800 active:border-b-0 active:translate-y-2 transition-all",
              !reducedMotion && "hover:scale-[1.02]"
            )}
            type="button"
          >
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Gift size={32} />
             </div>
             <span className="text-2xl font-black uppercase tracking-tight">Open Now</span>
             <p className="text-white/95 text-sm font-bold">See your reward right away!</p>
          </button>

          <button 
            onClick={onSaveLater}
            className={cn(
              "flex-1 group bg-white text-slate-900 p-8 rounded-[40px] flex flex-col items-center gap-4 border-[3px] border-slate-300 shadow-md hover:bg-slate-50 hover:border-slate-500 transition-all",
              !reducedMotion && "hover:scale-[1.02]"
            )}
            type="button"
          >
             <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center border-2 border-slate-800/10">
                <Archive size={32} className="text-slate-800" />
             </div>
             <span className="text-2xl font-black uppercase tracking-tight">Save for Later</span>
             <p className="text-slate-600 text-sm font-bold text-center px-2">Add to My Treasures vault</p>
          </button>
        </div>

        {/* Progress */}
        <div className="w-full bg-slate-50 p-8 flex flex-col items-center border-t-2 border-slate-300">
          {isADHD ? (
            <div className="w-full max-w-md">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Next Mega Reward</span>
                 <span className="text-lg font-black text-slate-900 tabular-nums">{starsCollectedToday}/3 ★</span>
              </div>
              <div className="w-full h-4 bg-slate-300 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   transition={reducedMotion ? { duration: 0 } : {}}
                   className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                 />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-3xl border-2 border-slate-300 shadow-sm">
                <div className="flex -space-x-2">
                   {[...Array(targetStars)].map((_, i) => (
                     <div 
                       key={i} 
                       className={cn(
                         "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center",
                         i < starsCollectedToday ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500"
                       )}
                     >
                       <Star size={14} fill={i < starsCollectedToday ? "currentColor" : "none"} />
                     </div>
                   ))}
                </div>
                <div className="h-8 w-px bg-slate-300" />
                <span className="text-xl font-black text-slate-900 tabular-nums">
                  Stars today: <span className="text-amber-700">{starsCollectedToday}</span> / {targetStars}
                </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
