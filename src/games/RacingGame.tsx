import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Gauge, CloudRain, Sun, Shield, Zap } from 'lucide-react';

enum AppMode {
  IDLE = 'IDLE',
  AUTISM = 'AUTISM',
  ADHD = 'ADHD',
  AUDHD = 'AUDHD'
}

interface RacingGameProps {
  mode: AppMode;
  onComplete: (stars: number, badge: string) => void;
  ddaMultiplier?: number;
  onLoss?: () => void;
  reducedMotion?: boolean;
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function RacingGame({ 
  mode, onComplete, ddaMultiplier = 1.0, onLoss, reducedMotion: propReducedMotion = false 
}: RacingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'RACING' | 'FINISHED'>('IDLE');
  const [lap, setLap] = useState(1);
  const [place, setPlace] = useState(4);
  const [weather, setWeather] = useState<'SUNNY' | 'RAINY'>('SUNNY');
  const [tireType, setTireType] = useState<'SPEED' | 'GRIP'>('SPEED');
  const [nitroActive, setNitroActive] = useState(false);
  const [calmMiles, setCalmMiles] = useState(0);
  const [distanceStatus, setDistanceStatus] = useState<'GOOD' | 'TOO_CLOSE' | 'TOO_FAR'>('TOO_FAR');
  const [screenShake, setScreenShake] = useState(0);
  const [opponentBehavior, setOpponentBehavior] = useState<'CALM' | 'ACTIVE'>('CALM');
  const [particles, setParticles] = useState<any[]>([]);
  
  const isADHD = mode === AppMode.ADHD;
  const isAutism = mode === AppMode.AUTISM;
  const isAuDHD = mode === AppMode.AUDHD;
  const reducedMotion = propReducedMotion || ddaMultiplier < 1;

  const playerRef = useRef({
    x: 300,
    y: 500,
    speed: 0,
    targetSpeed: isAutism ? 5 : isADHD ? 12 : 8,
    angle: 0,
    drift: 0,
    shield: false,
    calmTimer: 0
  });

  const opponentsRef = useRef<any[]>([]);
  const roadRef = useRef(0);
  const trackCurveRef = useRef(0);
  const lastTrackChangeRef = useRef(0);
  const animationRef = useRef<number>(0);

  // Initialize Opponents
  useEffect(() => {
    opponentsRef.current = [
      { id: 1, x: 200, y: -500, speed: 7, color: '#FF4D4D', laneOffset: 0 },
      { id: 2, x: 300, y: -1000, speed: 6.5, color: '#4DFF4D', laneOffset: 0 },
      { id: 3, x: 400, y: -1500, speed: 7.5, color: '#4D4DFF', laneOffset: 0 }
    ];
  }, []);

  const handleStart = () => {
    playerRef.current = { 
      x: 300, y: 500, speed: 0, targetSpeed: (isAutism ? 6 : isADHD ? 14 : 9) * ddaMultiplier, 
      angle: 0, drift: 0, shield: false, calmTimer: 0 
    };
    setLap(1);
    setPlace(4);
    setCalmMiles(0);
    setGameState('RACING');
  };

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    if (gameState === 'RACING') {
      const p = playerRef.current;
      
      // Screen Shake Decay
      if (screenShake > 0) setScreenShake(prev => Math.max(0, prev - 1));

      // Track Morphing (AuDHD)
      if (isAuDHD && timestamp - lastTrackChangeRef.current > 20000) {
        trackCurveRef.current = (Math.random() - 0.5) * 4;
        lastTrackChangeRef.current = timestamp;
      }

      // Speed logic
      let maxSpeed = p.targetSpeed;
      if (isADHD && place === 4) {
         maxSpeed = 20; 
         setNitroActive(true);
      } else {
         setNitroActive(false);
      }

      if (isAuDHD) {
        if (weather === 'RAINY' && tireType !== 'GRIP') maxSpeed *= 0.6;
        if (weather === 'SUNNY' && tireType === 'SPEED') maxSpeed *= 1.2;
        if (Math.random() < 0.002) setWeather(prev => prev === 'SUNNY' ? 'RAINY' : 'SUNNY');
      }

      p.speed += (maxSpeed - p.speed) * 0.05;
      roadRef.current += p.speed;

      // Opponents AI
      let closestAhead: any = null;
      let minDistance = 9999;

      opponentsRef.current.forEach(o => {
          const behaviorMultiplier = isAuDHD && opponentBehavior === 'CALM' ? 0.2 : isADHD ? 2.5 : 1;
          const oldY = o.y;
          o.y += p.speed - o.speed;
          
          // Pattern-based pathing
          const swirl = isAutism 
            ? Math.sin(roadRef.current / 200 + o.id) * 10
            : Math.sin(roadRef.current / 50 + o.id) * 30 * behaviorMultiplier;
          
          o.x = (width/2 - 100 + (o.id % 3) * 100) + swirl;
          
          if (o.y > height + 200 && oldY <= height + 200) {
            o.y = -height;
            if (isADHD && !reducedMotion) {
              setScreenShake(15);
              // ADHD Confetti Burst
              const newParticles = Array.from({ length: 15 }).map(() => ({
                x: o.x, y: height,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 15,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                life: 1
              }));
              setParticles(prev => [...prev.slice(-30), ...newParticles]);
            }
          }

          // Distance tracking for Bubble Mechanic
          if (o.y < p.y && p.y - o.y < minDistance) {
            minDistance = p.y - o.y;
            closestAhead = o;
          }
      });

      // Update Particles
      if (particles.length > 0) {
        setParticles(prev => prev.map(pt => ({
          ...pt,
          x: pt.x + pt.vx,
          y: pt.y + pt.vy,
          vy: pt.vy + 0.5, // Gravity
          life: pt.life - 0.02
        })).filter(pt => pt.life > 0));
      }

      // Bubble Logic
      if (closestAhead) {
        const dist = p.y - closestAhead.y;
        if (dist >= 50 && dist <= 150) {
          setDistanceStatus('GOOD');
          p.calmTimer += 1/60;
          if (p.calmTimer >= 3) {
            setCalmMiles(prev => prev + 1);
            p.calmTimer = 0;
          }
        } else if (dist < 50) {
          setDistanceStatus('TOO_CLOSE');
          p.calmTimer = 0;
        } else {
          setDistanceStatus('TOO_FAR');
          p.calmTimer = 0;
        }
      }

      const ahead = opponentsRef.current.filter(o => o.y < 500).length;
      setPlace(ahead + 1);

      if (roadRef.current > 15000) {
        if (lap >= 2 && isAutism) {
           onComplete(10 + calmMiles, 'Patient Driver');
           setGameState('FINISHED');
        } else if (lap >= 3) {
           let badge = 'Grand Prix Ace';
           if (isADHD) badge = 'Speed Demon';
           if (isAuDHD && place === 1) badge = 'Grand Prix Champion';
           onComplete(Math.max(10, 30 - place * 5 + calmMiles), badge);
           setGameState('FINISHED');
        } else {
           setLap(l => l + 1);
           roadRef.current = 0;
           opponentsRef.current.forEach(o => o.y -= 15000);
        }
      }
    }

    // DRAW
    ctx.save();
    if (screenShake > 0) ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
    ctx.clearRect(0, 0, width, height);

    // Grass & Track
    ctx.fillStyle = isADHD && nitroActive ? '#330033' : '#2D5A27';
    ctx.fillRect(0, 0, width, height);

    const roadX = width / 2;
    const roadTrackWidth = 400;
    ctx.fillStyle = isAutism ? '#E3F2FD' : '#333';
    
    // Curved Road Effect
    const curve = isAuDHD ? Math.sin(roadRef.current / 500) * 100 : 0;
    ctx.fillRect(roadX - roadTrackWidth / 2 + curve, 0, roadTrackWidth, height);
    
    // Markings
    ctx.strokeStyle = 'white';
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -roadRef.current;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadX + curve, 0);
    ctx.lineTo(roadX + curve, height);
    ctx.stroke();

    // Draw Particles
    particles.forEach(pt => {
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 6, 6);
    });
    ctx.globalAlpha = 1;

    // Bubble Mechanic Visual
    if (gameState === 'RACING') {
      ctx.beginPath();
      ctx.arc(playerRef.current.x, playerRef.current.y, 100, 0, Math.PI * 2);
      ctx.strokeStyle = distanceStatus === 'GOOD' ? 'rgba(76, 175, 80, 0.6)' : 'rgba(108, 92, 231, 0.3)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Actors
    opponentsRef.current.forEach(o => {
       ctx.fillStyle = o.color;
       ctx.fillRect(o.x - 20, o.y - 30, 40, 60);
    });

    // Player
    ctx.save();
    ctx.translate(playerRef.current.x, playerRef.current.y);
    ctx.fillStyle = isADHD ? '#FFD700' : isAutism ? '#9DC8E8' : '#6C5CE7';
    if (!reducedMotion && nitroActive) { ctx.shadowBlur = 40; ctx.shadowColor = '#00FFFF'; }
    ctx.fillRect(-25, -40, 50, 80);
    ctx.restore();
    ctx.restore();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, isADHD, isAutism, isAuDHD, place, weather, tireType, lap, nitroActive, opponentBehavior, distanceStatus, calmMiles, screenShake, onComplete]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameLoop]);

  // Controls
  const steer = (dir: number) => {
    if (gameState !== 'RACING') return;
    playerRef.current.x += dir * 20;
    playerRef.current.x = Math.max(150, Math.min(450, playerRef.current.x));
  };

  return (
    <div className="relative w-full max-w-2xl h-[650px] bg-slate-900 rounded-[56px] overflow-hidden shadow-2xl border-8 border-white/10 group">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={650} 
        className="w-full h-full"
      />

      {/* UI HUD */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center pointer-events-none">
        <div className="flex gap-4">
          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/20">
             <Trophy className="text-yellow-400" />
             <span className="text-3xl font-black text-white">{place}</span>
             <span className="text-xs text-white/40 uppercase">Position</span>
          </div>
          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/20">
             <span className="text-2xl font-black text-white">Lap {lap}</span>
          </div>
          {calmMiles > 0 && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="bg-blue-500/80 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 border border-blue-400/50"
            >
               <Zap className="text-blue-200" />
               <span className="text-2xl font-black text-white">{calmMiles} CALM MILES</span>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="bg-black/60 backdrop-blur-md px-8 py-3 rounded-2xl flex items-center gap-4 border border-white/20">
             <Gauge className={cn("transition-colors", nitroActive ? "text-cyan-400 animate-pulse" : "text-white/40")} />
             <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${(playerRef.current.speed / 20) * 100}%` }} className="h-full bg-gradient-to-r from-blue-400 to-cyan-400" />
             </div>
          </div>

          {/* Autism Distance Meter */}
          {gameState === 'RACING' && (
            <div className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all shadow-lg",
              distanceStatus === 'GOOD' ? "bg-green-500 text-white" : 
              distanceStatus === 'TOO_CLOSE' ? "bg-red-500 text-white animate-pulse" : "bg-slate-700 text-white/40"
            )}>
              {distanceStatus === 'GOOD' ? 'Perfect Distance!' : distanceStatus === 'TOO_CLOSE' ? 'Too Close! Back up!' : 'Target Ahead'}
            </div>
          )}
        </div>
      </div>

      {/* Controls Overlay */}
      {gameState === 'RACING' && (
        <div className="absolute inset-0 flex">
           <div 
             className="w-1/2 h-full cursor-pointer hover:bg-white/5 transition-colors" 
             onMouseDown={() => steer(-1)}
             onTouchStart={() => steer(-1)}
           />
           <div 
             className="w-1/2 h-full cursor-pointer hover:bg-white/5 transition-colors" 
             onMouseDown={() => steer(1)}
             onTouchStart={() => steer(1)}
           />
        </div>
      )}

      {/* Mode Specific Extras */}
      {gameState === 'RACING' && (
        <div className="absolute bottom-10 left-10 right-10 flex justify-between pointer-events-none">
           <div className="flex flex-col gap-4">
             {isAuDHD && (
               <div className="flex items-center gap-4 bg-black/60 p-4 rounded-[32px] backdrop-blur border border-white/20">
                 {weather === 'SUNNY' ? <Sun className="text-yellow-400" size={32} /> : <CloudRain className="text-blue-400" size={32} />}
                 <span className="text-white font-black">{weather}</span>
               </div>
             )}
             
             {isAuDHD && (
               <motion.button
                 whileTap={{ scale: 0.9 }}
                 onClick={() => setOpponentBehavior(prev => prev === 'CALM' ? 'ACTIVE' : 'CALM')}
                 className={cn(
                   "pointer-events-auto flex items-center gap-4 px-8 py-5 rounded-[40px] font-black shadow-2xl transition-all border-b-8",
                   opponentBehavior === 'CALM' 
                    ? "bg-emerald-500 text-white border-emerald-700" 
                    : "bg-orange-500 text-white border-orange-700"
                 )}
               >
                 {opponentBehavior === 'CALM' ? <Shield size={28} /> : <Zap size={28} />}
                 <span>{opponentBehavior === 'CALM' ? 'CHILL MODE' : 'CHAOS MODE'}</span>
               </motion.button>
             )}
           </div>
           
           <div className="flex gap-4 pointer-events-auto items-end">
             {isAuDHD && (
               <>
                 <button 
                   onClick={() => setTireType('SPEED')}
                   className={cn(
                     "px-6 py-4 rounded-2xl font-black transition-all border-b-4",
                     tireType === 'SPEED' ? "bg-yellow-400 text-black border-yellow-600" : "bg-white/20 text-white border-black/20"
                   )}
                 >
                   Speed Tires
                 </button>
                 <button 
                   onClick={() => setTireType('GRIP')}
                   className={cn(
                     "px-6 py-4 rounded-2xl font-black transition-all border-b-4",
                     tireType === 'GRIP' ? "bg-blue-400 text-white border-blue-600" : "bg-white/20 text-white border-black/20"
                   )}
                 >
                   Grip Tires
                 </button>
               </>
             )}
           </div>
        </div>
      )}

      <AnimatePresence>
        {gameState === 'IDLE' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center mb-8 shadow-2xl">
               <Trophy size={64} className="text-slate-900" />
            </div>
            <h2 className="text-6xl font-display font-black text-white mb-6">Cosmic Grand Prix</h2>
            <div className="bg-white/10 p-8 rounded-[40px] mb-12 border border-white/10 max-w-lg">
                <p className="text-white text-2xl font-bold mb-4">
                   {isAutism ? "Therapeutic Focus: Safe Distances" : isADHD ? "Mission: High-Speed Overtaking" : "Strategy Challenge: Dynamic Conditions"}
                </p>
                <p className="text-white/60 text-lg leading-relaxed italic">
                   {isAutism ? "Stay in the blue bubble (50-150px) behind other cars to earn 'Calm Miles'. No rush, just focus." : 
                    isADHD ? "Use the speed boost when in 4th place to rocket ahead! Collect 5 overtakes for bonus stars." : 
                    "Adapt your tires to the weather. Use the Strategy Switch to manage opponent chaos."}
                </p>
            </div>
            <button 
              onClick={handleStart}
              className="bg-white text-slate-900 px-16 py-6 rounded-[32px] font-black text-3xl shadow-2xl hover:scale-105 transition-all"
            >
              START RACE 🏁
            </button>
          </motion.div>
        )}

        {gameState === 'FINISHED' && (
          <motion.div 
            initial={reducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }} 
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-yellow-400 flex flex-col items-center justify-center p-12 text-center"
          >
            <Trophy size={120} className="text-slate-900 mb-8" />
            <h2 className="text-7xl font-black text-slate-900 mb-4">FINISH!</h2>
            <p className="text-2xl font-bold text-slate-700 mb-12">You finished in position #{place}!</p>
            <button 
              onClick={() => onComplete(20, 'Grand Prix Ace')}
              className="bg-slate-900 text-white px-16 py-6 rounded-[32px] font-black text-3xl shadow-2xl hover:scale-105 transition-all"
            >
              CLAIM REWARD 🎁
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
