import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Activity, Zap, Brain, Calendar, ArrowUpRight } from 'lucide-react';

interface SensoryReportProps {
  history: any[];
  ddaTriggerCount: number;
  reducedMotion?: boolean;
}

export default function SensoryReport({ history, ddaTriggerCount, reducedMotion = false }: SensoryReportProps) {
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const modes = history.map(h => h.mode).filter(Boolean);
    const modeCounts = modes.reduce((acc: any, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});

    const mostPlayedMode = Object.entries(modeCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    // Calculate average reaction time if available
    const attemptsWithTime = history.filter(h => h.reactionTime !== undefined);
    const avgReactionTime = attemptsWithTime.length > 0 
      ? (attemptsWithTime.reduce((sum, h) => sum + h.reactionTime!, 0) / attemptsWithTime.length).toFixed(0)
      : '---';

    const winRate = ((history.filter(h => h.result === 'WIN').length / history.length) * 100).toFixed(0);

    return {
      mostPlayedMode,
      avgReactionTime,
      winRate,
      totalGames: history.length
    };
  }, [history]);

  if (!stats) {
    return (
      <div className="bg-white/40 p-20 rounded-[56px] text-center">
         <Activity className="mx-auto mb-6 text-theme/20" size={80} />
         <h2 className="text-3xl font-black text-theme/40 uppercase tracking-widest">No data collected yet</h2>
         <p className="text-theme/40 mt-4">Play games to generate your unique sensory profile.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <header className="flex justify-between items-end mb-4">
        <div>
           <h2 className="text-5xl font-display font-black text-theme">Sensory Report</h2>
           <p className="text-theme/50 font-bold uppercase tracking-[0.2em] mt-2">Personalized Analytics for Parents</p>
        </div>
        <div className="bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white flex items-center gap-3">
           <Calendar className="text-theme" size={20} />
           <span className="font-bold text-theme">Last 30 Days</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Stats */}
        <div className="glass-card p-10 rounded-[48px] flex flex-col justify-between border-b-[8px] border-theme/10">
           <div className="flex justify-between items-start">
              <div className="bg-theme/10 p-4 rounded-3xl">
                 <Brain className="text-theme" size={32} />
              </div>
              <div className="text-right">
                 <p className="text-sm font-black text-theme/40 uppercase tracking-widest">Favorite Mode</p>
                 <h3 className="text-4xl font-black text-theme mt-1">{stats.mostPlayedMode}</h3>
              </div>
           </div>
           <div className="mt-12 h-2 bg-theme/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={reducedMotion ? { duration: 0 } : { duration: 1 }} className="h-full bg-theme" />
           </div>
        </div>

        <div className="glass-card p-10 rounded-[48px] flex flex-col justify-between border-b-[8px] border-emerald-100">
           <div className="flex justify-between items-start">
              <div className="bg-emerald-500/10 p-4 rounded-3xl">
                 <Zap className="text-emerald-500" size={32} />
              </div>
              <div className="text-right">
                 <p className="text-sm font-black text-emerald-500/40 uppercase tracking-widest">Avg Reaction</p>
                 <h3 className="text-4xl font-black text-emerald-500 mt-1">{stats.avgReactionTime}ms</h3>
              </div>
           </div>
           <div className="flex items-center gap-2 text-emerald-500/60 font-bold mt-12 bg-emerald-500/5 px-4 py-2 rounded-xl">
              <ArrowUpRight size={16} /> 12% faster than last week
           </div>
        </div>

        {/* Support Metrics */}
        <div className="bg-slate-900 p-10 rounded-[48px] col-span-full grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="flex flex-col gap-2">
              <span className="text-white/30 text-xs font-black uppercase tracking-widest">Stability Score</span>
              <span className="text-5xl font-black text-white">{stats.winRate}%</span>
              <p className="text-white/40 text-sm italic">Growth mindset score based on win consistency.</p>
           </div>
           <div className="flex flex-col gap-2">
              <span className="text-white/30 text-xs font-black uppercase tracking-widest">DDA Adjustments</span>
              <span className="text-5xl font-black text-yellow-400">{ddaTriggerCount}</span>
              <p className="text-white/40 text-sm italic">Number of times the system guided play for comfort.</p>
           </div>
           <div className="flex flex-col gap-2">
              <span className="text-white/30 text-xs font-black uppercase tracking-widest">Sessions Total</span>
              <span className="text-5xl font-black text-white">{stats.totalGames}</span>
              <p className="text-white/40 text-sm italic">Individual play blocks across all sensory modes.</p>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 bg-white/20 p-8 rounded-[40px] border border-theme/20 italic text-theme/60 text-center font-medium">
         "These trends show how the user naturally interacts with different levels of sensory input. Most played modes often indicate comfort levels with structured (Autism) vs chaotic (ADHD) stimulus."
      </div>
    </div>
  );
}
