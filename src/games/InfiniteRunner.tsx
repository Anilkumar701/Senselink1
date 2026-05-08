import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Timer, Sparkles, AlertCircle } from 'lucide-react';

enum AppMode {
  IDLE = 'IDLE',
  AUTISM = 'AUTISM',
  ADHD = 'ADHD',
  AUDHD = 'AUDHD'
}

interface InfiniteRunnerProps {
  mode: AppMode;
  onComplete: (stars: number, badge: string) => void;
  ddaMultiplier?: number;
  onLoss?: () => void;
  reducedMotion?: boolean;
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function InfiniteRunnerGame({ 
  mode, onComplete, ddaMultiplier = 1.0, onLoss, reducedMotion = false 
}: InfiniteRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'COUNTDOWN' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [time, setTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [patternCount, setPatternCount] = useState(0);

  // Constants based on mode
  const isADHD = mode === AppMode.ADHD;
  const isAutism = mode === AppMode.AUTISM;
  const isAuDHD = mode === AppMode.AUDHD;

  const playerRef = useRef({
    lane: 1, // 0, 1, 2
    targetX: 0,
    x: 0,
    y: 0,
    jump: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0
  });

  const obstaclesRef = useRef<any[]>([]);
  const coinsRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const lastSpawnRef = useRef(0);
  const animationRef = useRef<number>(0);
  const speedRef = useRef(isAutism ? 6 : 8);

  const LANES = 3;
  const LANE_WIDTH = 120;
  
  const resetGame = useCallback(() => {
    setScore(0);
    setCoins(0);
    setTime(0);
    setPatternCount(0);
    setIsSlowMode(false);
    playerRef.current = { lane: 1, targetX: 0, x: 0, y: 0, jump: 0, isJumping: false, isSliding: false, slideTimer: 0 };
    obstaclesRef.current = [];
    coinsRef.current = [];
    particlesRef.current = [];
    speedRef.current = isAutism ? 6 : 8;
  }, [isAutism]);

  const handleStart = () => {
    resetGame();
    if (isAutism) {
      setGameState('COUNTDOWN');
      setCountdown(3);
    } else {
      setGameState('PLAYING');
    }
  };

  useEffect(() => {
    if (gameState === 'COUNTDOWN' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'COUNTDOWN' && countdown === 0) {
      setGameState('PLAYING');
    }
  }, [gameState, countdown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft') playerRef.current.lane = Math.max(0, playerRef.current.lane - 1);
      if (e.key === 'ArrowRight') playerRef.current.lane = Math.min(2, playerRef.current.lane + 1);
      if (e.key === 'ArrowUp' && !playerRef.current.isJumping) {
        playerRef.current.isJumping = true;
        playerRef.current.jump = 15;
      }
      if (e.key === 'ArrowDown') {
        playerRef.current.isSliding = true;
        playerRef.current.slideTimer = 30;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Update
    if (gameState === 'PLAYING') {
      setTime(prev => prev + 1 / 60);
      
      // Dynamic Speed with DDA
      if (isADHD) {
        speedRef.current = Math.min(12, 8 + time / 10) * ddaMultiplier;
      } else if (isAuDHD) {
        let base = isSlowMode ? 4 : 8;
        if (!isSlowMode && time > 30) base = 12;
        speedRef.current = base * ddaMultiplier;
      } else {
        speedRef.current = (isAutism ? 6 : 8) * ddaMultiplier;
      }

      // Player Movement
      playerRef.current.targetX = (playerRef.current.lane - 1) * LANE_WIDTH;
      playerRef.current.x += (playerRef.current.targetX - playerRef.current.x) * 0.2;

      if (playerRef.current.isJumping) {
        playerRef.current.y += playerRef.current.jump;
        playerRef.current.jump -= 0.8;
        if (playerRef.current.y <= 0) {
          playerRef.current.y = 0;
          playerRef.current.isJumping = false;
        }
      }

      if (playerRef.current.isSliding) {
        playerRef.current.slideTimer--;
        if (playerRef.current.slideTimer <= 0) playerRef.current.isSliding = false;
      }

      // Spawning
      if (timestamp - lastSpawnRef.current > (1500 / (speedRef.current / 8))) {
        // Spawn Coin or Obstacle
        const lane = Math.floor(Math.random() * 3);
        if (Math.random() > 0.3) {
          coinsRef.current.push({ x: (lane - 1) * LANE_WIDTH, z: height + 100, lane });
        } else {
          obstaclesRef.current.push({ 
            x: (lane - 1) * LANE_WIDTH, 
            z: height + 100, 
            lane, 
            type: Math.random() > 0.5 ? 'JUMP' : 'SLIDE' 
          });
        }
        lastSpawnRef.current = timestamp;
      }

      // Move Items
      coinsRef.current.forEach(c => c.z -= speedRef.current);
      obstaclesRef.current.forEach(o => o.z -= speedRef.current);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
      });

      // Collision
      coinsRef.current = coinsRef.current.filter(c => {
        const dist = Math.sqrt(Math.pow(c.x - playerRef.current.x, 2) + Math.pow(c.z - 100, 2));
        if (dist < 40 && playerRef.current.y < 30) {
          setCoins(prev => prev + 1);
          // Sparkle burst for ADHD
          if (isADHD && !reducedMotion) {
            for (let i = 0; i < 10; i++) {
              particlesRef.current.push({
                x: width / 2 + c.x,
                y: height - 100 - playerRef.current.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                color: '#FFD700'
              });
            }
          }
          if (isAutism) {
              setPatternCount(p => p + 1);
          }
          return false;
        }
        return c.z > -50;
      });

      obstaclesRef.current = obstaclesRef.current.filter(o => {
        const dist = Math.sqrt(Math.pow(o.x - playerRef.current.x, 2) + Math.pow(o.z - 100, 2));
        if (dist < 50) {
          const hit = (o.type === 'JUMP' && !playerRef.current.isJumping) || 
                      (o.type === 'SLIDE' && !playerRef.current.isSliding);
          
          if (hit) {
             if (!isADHD) { // ADHD has no punishment for missing/hitting? "no punishment for missing coins" - implies obstacles might still hit or be avoided.
               // For kids, let's just stumble them instead of instant game over if in Autism mode
               if (isAutism) {
                 speedRef.current = 2; // slow down significantly
               } else {
                 setGameState('GAMEOVER');
                 if (onLoss) onLoss();
               }
             }
          }
        }
        return o.z > -50;
      });

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Win Condition Check
      if (isADHD && coins >= 50) {
        onComplete(15, 'Rocket Runner');
        setGameState('IDLE');
      }
      if (isAutism && patternCount >= 10) {
        onComplete(10, 'Pattern Runner');
        setGameState('IDLE');
      }
      if (isAuDHD && time >= 60) {
        onComplete(20, 'Time Master');
        setGameState('IDLE');
      }
    }

    // DRAWING
    ctx.clearRect(0, 0, width, height);

    // Floor Patterns (Autism)
    if (isAutism) {
        const segmentH = 200;
        const offset = (time * speedRef.current * 10) % (segmentH * 2);
        ctx.save();
        for (let i = -1; i < 5; i++) {
           ctx.fillStyle = i % 2 === 0 ? '#9DC8E866' : '#F9E4B766';
           ctx.fillRect(0, height - (i * segmentH) + offset, width, segmentH);
        }
        ctx.restore();
    }

    // Lanes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.setLineDash([10, 10]);
    for (let i = 1; i < LANES; i++) {
      const x = width / 2 + (i - 1.5) * LANE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const centerX = width / 2;
    const centerY = height - 100;

    // Obstacles
    obstaclesRef.current.forEach(o => {
      ctx.fillStyle = o.type === 'JUMP' ? '#FF6B6B' : '#4A90E2';
      const x = centerX + o.x;
      const y = centerY - (o.z - 100);
      if (y > 0 && y < height) {
        const size = Math.max(10, (o.z / height) * 60);
        ctx.fillRect(x - size/2, y - size, size, size);
        // Visual indicator for Autism
        if (isAutism && o.z < 400) {
           ctx.strokeStyle = 'white';
           ctx.lineWidth = 4;
           ctx.strokeRect(x - size/2 - 5, y - size - 5, size + 10, size + 10);
        }
      }
    });

    // Coins
    ctx.fillStyle = '#FFD700';
    coinsRef.current.forEach(c => {
       const x = centerX + c.x;
       const y = centerY - (c.z - 100);
       if (y > 0 && y < height) {
          ctx.beginPath();
          ctx.arc(x, y - 20, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#D4AC0D';
          ctx.lineWidth = 2;
          ctx.stroke();
       }
    });

    // Particles
    particlesRef.current.forEach(p => {
       ctx.globalAlpha = p.life;
       ctx.fillStyle = p.color;
       ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Player
    ctx.save();
    ctx.translate(centerX + playerRef.current.x, centerY - playerRef.current.y);
    if (playerRef.current.isSliding) {
       ctx.scale(1.5, 0.5);
    }
    
    // Aesthetic for player
    ctx.fillStyle = isADHD ? '#FFB347' : isAutism ? '#A7D0CD' : '#6C5CE7';
    if (!reducedMotion) {
      ctx.shadowBlur = isADHD ? 20 : 5;
      ctx.shadowColor = ctx.fillStyle;
    }
    
    ctx.beginPath();
    ctx.roundRect(-25, -60, 50, 60, 10);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-10, -45, 5, 0, Math.PI * 2);
    ctx.arc(10, -45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, isADHD, isAutism, isAuDHD, isSlowMode, coins, time, onComplete, patternCount]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameLoop]);

  return (
    <div className="relative w-full max-w-2xl h-[600px] bg-slate-800 rounded-[56px] overflow-hidden shadow-2xl border-8 border-white/10 group">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={600} 
        className="w-full h-full cursor-pointer"
        onClick={() => {
           if (gameState === 'IDLE' || gameState === 'GAMEOVER') handleStart();
        }}
      />

      {/* UI Overlays */}
      <div className="absolute top-8 left-8 flex gap-4">
        <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full font-black text-white border border-white/20">
          🪙 {coins}
        </div>
        {isAuDHD && (
          <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full font-black text-white border border-white/20">
            ⏳ {Math.floor(60 - time)}s
          </div>
        )}
        {isAutism && (
          <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full font-black text-white border border-white/20">
            🧩 {patternCount}/10
          </div>
        )}
      </div>

      <AnimatePresence>
        {gameState === 'IDLE' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-10 text-center"
          >
            <Zap size={80} className="text-yellow-400 mb-6" />
            <h2 className="text-5xl font-display font-black text-white mb-4">Cosmic Runner</h2>
            <p className="text-white/60 text-xl mb-10 max-w-sm">
              {isAutism ? "Follow the pattern and safe path." : isADHD ? "Go fast and collect shiny gems!" : "Master time and survive the cosmos."}
            </p>
            <button 
              onClick={handleStart}
              className="bg-yellow-400 text-slate-900 px-12 py-5 rounded-3xl font-black text-2xl shadow-xl hover:scale-105 transition-all"
            >
              LET'S GO! 🚀
            </button>
          </motion.div>
        )}

        {gameState === 'COUNTDOWN' && (
          <motion.div 
            initial={reducedMotion ? { opacity: 0 } : { scale: 2, opacity: 0 }} 
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }} 
            exit={reducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-[12rem] font-black text-white drop-shadow-2xl">{countdown}</div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div 
            initial={reducedMotion ? { opacity: 0 } : { scale: 1.1, opacity: 0 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-10 text-center backdrop-blur-sm"
          >
            <AlertCircle size={80} className="text-white mb-6" />
            <h2 className="text-5xl font-black text-white mb-8">OUCH!</h2>
            <button 
              onClick={handleStart}
              className="bg-white text-red-500 px-12 py-5 rounded-3xl font-black text-2xl shadow-xl hover:scale-105 transition-all"
            >
              TRY AGAIN 🔄
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AuDHD Special Mechanic */}
      {isAuDHD && gameState === 'PLAYING' && (
        <div className="absolute bottom-10 right-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSlowMode(!isSlowMode)}
            className={cn(
               "w-24 h-24 rounded-full shadow-2xl flex items-center justify-center border-4",
               isSlowMode ? "bg-blue-500 border-blue-300 text-white animate-pulse" : "bg-purple-500 border-purple-300 text-white"
            )}
          >
            {isSlowMode ? <Timer size={40} /> : <Zap size={40} />}
          </motion.button>
        </div>
      )}

      {/* Autism Visual Pattern shown in corner */}
      {isAutism && gameState === 'PLAYING' && (
        <div className="absolute bottom-10 left-10 p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
          <div className="flex gap-2 text-3xl">
             <div className="w-8 h-8 rounded-full bg-[#9DC8E8]" />
             <div className="w-8 h-8 rounded-full bg-[#F9E4B7]" />
             <div className="w-8 h-8 rounded-full bg-[#9DC8E8]" />
             <div className="w-8 h-8 rounded-full bg-[#F9E4B7]" />
          </div>
        </div>
      )}
    </div>
  );
}
