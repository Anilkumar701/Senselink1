/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, 
  Zap, 
  RefreshCw, 
  Gamepad2, 
  BookOpen, 
  Video, 
  ArrowLeft, 
  Star, 
  Award, 
  Moon, 
  Sun,
  Layout,
  Gift,
  CheckCircle2,
  XCircle,
  Shapes,
  Palette,
  Timer,
  Waves,
  Settings,
  ZapOff,
  Trophy,
  Shield,
  Sparkles,
  CloudRain,
  Archive,
  Eye,
  BarChart3
} from 'lucide-react';
import InfiniteRunnerGame from './games/InfiniteRunner';
import RacingGame from './games/RacingGame';
import RewardArcade from './components/RewardArcade';
import { useDDA } from './hooks/useDDA';
import RewardChoiceModal from './components/RewardChoiceModal';
import { rewardService, UnopenedReward } from './services/rewardService';
import { playCelebrationSound } from './lib/sounds';
import SensoryReport from './components/SensoryReport';
import { cn } from './lib/utils';

// --- Types & Constants ---

enum AppMode {
  IDLE = 'IDLE',
  AUTISM = 'AUTISM',
  ADHD = 'ADHD',
  AUDHD = 'AUDHD'
}

enum SubPage {
  HOME = 'HOME',
  GAMES = 'GAMES',
  STORIES = 'STORIES',
  VIDEOS = 'VIDEOS',
  GAME_DETAIL = 'GAME_DETAIL',
  QUIZ = 'QUIZ',
  ARCADE = 'ARCADE',
  REPORT = 'REPORT'
}

enum StyleState {
  CALM = 'CALM',
  ACTIVE = 'ACTIVE'
}

const YOUTUBE_STORIES = [
  { 
    id: '75NQK-Sm1YY', 
    title: "The Very Hungry Caterpillar", 
    description: "Follow the hungry caterpillar on his journey to become a butterfly after eating a big red apple.", 
    hotwords: ["hungry", "caterpillar", "butterfly", "apple", "red"],
    quizzes: {
      hungry: { q: "What does he do when hungry?", a: ["Eat", "Sleep", "Dance"], c: 0 },
      caterpillar: { q: "What does it become?", a: ["Worm", "Butterfly", "Bird"], c: 1 },
      butterfly: { q: "Do butterflies fly?", a: ["Yes", "No", "Maybe"], c: 0 },
      apple: { q: "Is an apple a fruit?", a: ["Yes", "No"], c: 0 },
      red: { q: "What else is red?", a: ["Strawberry", "Grass", "Sky"], c: 0 }
    }
  },
  { 
    id: 's8sUPpPc8Ws', 
    title: "The Gruffalo", 
    description: "A clever mouse walks through the deep dark wood and meets a scary creature called the Gruffalo.", 
    hotwords: ["mouse", "wood", "gruffalo", "scary", "creature"],
    quizzes: {
      mouse: { q: "Is the mouse big or small?", a: ["Big", "Small"], c: 1 },
      wood: { q: "Where is the mouse walking?", a: ["A beach", "A wood", "A city"], c: 1 },
      gruffalo: { q: "What is a Gruffalo?", a: ["A monster", "A cat", "A dog"], c: 0 },
      scary: { q: "Is the mouse scared of the snake?", a: ["Yes", "No"], c: 1 }
    }
  },
  { 
    id: 'QFORvXhub28', 
    title: "The Rainbow Fish", 
    description: "A beautiful fish with shiny scales lives in the deep blue sea.", 
    hotwords: ["fish", "shiny", "scales", "blue", "sea"],
    quizzes: {
      fish: { q: "Where do fish live?", a: ["Trees", "Water", "Clouds"], c: 1 },
      shiny: { q: "Are his scales shiny?", a: ["Yes", "No"], c: 0 },
      blue: { q: "What else is blue?", a: ["Sun", "Sky", "Fire"], c: 1 },
      sea: { q: "Is the sea big?", a: ["Yes", "No"], c: 0 }
    }
  },
  {
    id: 'QYWodTneq-Q',
    title: "The Snowy Day",
    description: "Peter wakes up to fresh snow, puts on his red snowsuit, and steps outside for a cozy winter adventure and quiet footprints.",
    hotwords: ["snow", "winter", "red", "footprints", "adventure"],
    quizzes: {
      snow: { q: "What is on the ground in the morning?", a: ["Sand", "Snow", "Leaves"], c: 1 },
      winter: { q: "This story mostly happens in which season?", a: ["Winter", "Summer", "Fall"], c: 0 },
      red: { q: "Peter wears something red. What part of his outfit is it?", a: ["Snowsuit", "Hat only", "Scarf only"], c: 0 },
      footprints: { q: "Peter makes marks in the snow with his…", a: ["Handprints only", "Footprints", "Drawing"], c: 1 },
      adventure: { q: "How does exploring the snow feel to Peter?", a: ["Quiet and playful", "Scary and loud"], c: 0 }
    }
  },
  {
    id: 'N4Y3fMbpsgs',
    title: "How Chipmunk Got His Stripes",
    description: "A bear and chipmunk meet in the forest. A witty story explains how stripes can appear from a dusty surprise.",
    hotwords: ["bear", "chipmunk", "forest", "story", "stripes"],
    quizzes: {
      bear: { q: "Who is bigger in the tale?", a: ["The bear", "The chipmunk"], c: 0 },
      chipmunk: { q: "The small furry friend lives where?", a: ["In the forest", "Under the sea"], c: 0 },
      forest: { q: "Many trees grow together here.", a: ["City", "Forest", "Desert"], c: 1 },
      story: { q: "This book is mainly a …", a: ["Story tale", "Math sheet"], c: 0 },
      stripes: { q: "What shows up after the dusty surprise?", a: ["Dots", "Stripes", "Spots"], c: 1 }
    }
  },
  {
    id: 'tAwqiwXxYYE',
    title: "Swimmy",
    description: "A clever little fish helps friends swim together, stay brave, and outsmart dangers in the big blue ocean.",
    hotwords: ["fish", "ocean", "together", "brave", "teamwork"],
    quizzes: {
      fish: { q: "Swimmy is a tiny …", a: ["Bird", "Fish", "Crab"], c: 1 },
      ocean: { q: "Where does Swimmy swim?", a: ["In the ocean", "In a bathtub"], c: 0 },
      together: { q: "Friends move best when they go …", a: ["Together", "Alone forever"], c: 0 },
      brave: { q: "Brave means facing something with …", a: ["Giving up fast", "Courage", "Ignoring friends"], c: 1 },
      teamwork: { q: "The group idea that helps Swimmy?", a: ["Teamwork", "Arguing"], c: 0 }
    }
  }
];

const YOUTUBE_VIDEOS = [
  { id: '7t099KIWVVs', title: 'Planet Song · Eight Planets' },
  { id: 'zMCDl1Asm_c', title: 'Meet Jupiter · Planet Fun' },
  { id: 'DR-cfDsHCGA', title: 'Count to 10 · Sing Along' },
  { id: 'Aq4UAss33qA', title: 'Count and Move · Numbers to 20' },
  { id: '75p-N9YKqNo', title: 'ABC Song · Alphabet' },
  { id: 'hq3yfQnllfQ', title: 'Phonics Song · Letters & Words' },
  { id: 'YyFLBTTAbSE', title: 'What Color Is It? · Many Colors' },
  { id: 'xPWZu4LDmQM', title: 'The Colors Song · Rainbow Words' },
  { id: 'zEk48QQSPo4', title: 'Feelings & Emotions Chant' },
  { id: 'l4WNrvVjiTw', title: "If You're Happy · Actions & Faces" },
  { id: 'aAT1wDSHcxU', title: 'Where Do Animals Live? · Habitats' },
  { id: 'DTp_YFZcvoU', title: 'Animal Homes · Habitat Song' },
  { id: '9GFEjNL0XXw', title: 'What Shape Is It? · Eight Shapes' }
];

type RelatedVideoItem = { id: string; title: string; focus: string; source: string };
type ModeAwareVideos = Record<AppMode, Partial<Record<SubPage, RelatedVideoItem[]>>>;

const RELATED_PROJECT_VIDEOS_BY_MODE: ModeAwareVideos = {
  [AppMode.AUTISM]: {
    [SubPage.GAMES]: [
      { id: 'x7X9w_GIm1s', title: 'Calm Memory Card Game Project', focus: 'Simple loops, matching logic, and clear feedback', source: 'YouTube public tutorial' },
      { id: 'ZniVgo8U7ek', title: 'Scratch Maze Game for Beginners', focus: 'Predictable interactions and step-by-step game flow', source: 'Scratch education tutorial' },
      { id: 'XqZsoesa55w', title: 'Accessible Game UI Basics', focus: 'Sensory-friendly colors and readable controls', source: 'YouTube accessibility tutorial' },
      { id: 'j48LtUkZRjU', title: 'How to Make Your First Video Game', focus: 'Engine basics explained in gentle steps', source: 'Brackeys archive' },
      { id: 'W6NZfCO5SIk', title: 'JavaScript Game Foundations', focus: 'DOM games with simple loops and controls', source: 'YouTube public tutorial' }
    ],
    [SubPage.STORIES]: [
      { id: '3nQNiWdeH2Q', title: 'Build a Story Reader Interface', focus: 'Large readable cards and guided reading UX', source: 'YouTube public tutorial' },
      { id: 'dGcsHMXbSOA', title: 'React Components for Story Apps', focus: 'Modular content screens and calm transitions', source: 'YouTube public tutorial' },
      { id: 'yfoY53QXEnI', title: 'Beginner Friendly UI Project', focus: 'Soft visuals and structured content layout', source: 'YouTube public tutorial' },
      { id: 'G3e-cpL7ofc', title: 'Responsive Story Layouts', focus: 'Typography and whitespace for reading', source: 'YouTube public tutorial' },
      { id: 'TNhaISOUy6Q', title: 'Multi-Section Landing Page Build', focus: 'Carousel-style story blocks on the web', source: 'YouTube tutorial' }
    ],
    [SubPage.VIDEOS]: [
      { id: 'N8DCz7MNx7Q', title: 'Video Gallery Project in React', focus: 'Clean media layout and reliable embedded playback', source: 'YouTube public tutorial' },
      { id: 'G3e-cpL7ofc', title: 'Responsive Website Project', focus: 'Clear spacing and learner-friendly visual hierarchy', source: 'YouTube public tutorial' },
      { id: 'bMknfKXIFA8', title: 'React Real-World App Patterns', focus: 'Reusable sections and stable component design', source: 'YouTube public tutorial' },
      { id: 'UB1O30fjRqk', title: 'HTML & CSS Crash Course', focus: 'Structure, layout, and readable pages', source: 'YouTube public tutorial' },
      { id: 'IJ85kCdqWao', title: 'React + Tailwind for Beginners', focus: 'Fast UI styling with components', source: 'freeCodeCamp' },
      { id: 'x4rFhThSX04', title: 'Learn React (Full Modern Course)', focus: 'Projects, hooks, and real exercises', source: 'freeCodeCamp' }
    ]
  },
  [AppMode.ADHD]: {
    [SubPage.GAMES]: [
      { id: 'W6NZfCO5SIk', title: 'Fast JavaScript Game Build', focus: 'Quick interactions, score loops, and dopamine feedback', source: 'YouTube public tutorial' },
      { id: 'jBmrduvKl5w', title: 'Action Game From Scratch', focus: 'Motion-heavy mechanics and instant reward loops', source: 'YouTube public tutorial' },
      { id: '3EMxBkqC4z0', title: 'React Challenge Game Project', focus: 'Dynamic cards and timing-based gameplay', source: 'YouTube public tutorial' },
      { id: 'j48LtUkZRjU', title: 'Build a Game Episode 1', focus: 'High-energy pacing with clear milestones', source: 'Brackeys archive' },
      { id: 'N8DCz7MNx7Q', title: 'Game Menus & Score Screens in React', focus: 'Responsive HUD patterns you can riff on', source: 'YouTube public tutorial' }
    ],
    [SubPage.STORIES]: [
      { id: 'RGo4z8wMZ-c', title: 'Interactive Story App UI', focus: 'Attention-grabbing cards and modern visual rhythm', source: 'YouTube public tutorial' },
      { id: 'Ke90Tje7VS0', title: 'Build a Content App in React', focus: 'Rapid component patterns for engaging screens', source: 'YouTube public tutorial' },
      { id: '4UZrsTqkcW4', title: 'UI/UX Project Walkthrough', focus: 'High-contrast accents and attention anchors', source: 'YouTube public tutorial' },
      { id: 'dGcsHMXbSOA', title: 'Component Libraries for Narrative UX', focus: 'Reusable story tiles and overlays', source: 'YouTube public tutorial' },
      { id: 'yfoY53QXEnI', title: 'Fast Story Feed Prototypes', focus: 'Quick iteration for kinetic readers', source: 'YouTube public tutorial' }
    ],
    [SubPage.VIDEOS]: [
      { id: 'N8DCz7MNx7Q', title: 'Modern React Video Gallery', focus: 'Punchy cards, fast browse flow, and embedded media', source: 'YouTube public tutorial' },
      { id: 'bMknfKXIFA8', title: 'React Crash Course Projects', focus: 'Hands-on app building with energetic pacing', source: 'YouTube public tutorial' },
      { id: 'PkZNo7MFNFg', title: 'JavaScript Fundamentals Project Path', focus: 'Real project journey from beginner to builder', source: 'YouTube public tutorial' },
      { id: 'x4rFhThSX04', title: 'Learn React · Full Hands-On Course', focus: 'Build multiple apps with modern React', source: 'freeCodeCamp' },
      { id: 'IJ85kCdqWao', title: 'React + Tailwind Project Lab', focus: 'High-energy UI builds and motion-friendly layouts', source: 'freeCodeCamp' },
      { id: 'u6gSSpfsoOQ', title: 'JavaScript Framework Projects', focus: 'Three guided projects in one course', source: 'freeCodeCamp' }
    ]
  },
  [AppMode.AUDHD]: {
    [SubPage.GAMES]: [
      { id: 'jBmrduvKl5w', title: 'Balanced Game Project Architecture', focus: 'Mix calm structure with exciting feedback loops', source: 'YouTube public tutorial' },
      { id: '3EMxBkqC4z0', title: 'React Game UI + Logic', focus: 'Structured state with playful interaction', source: 'YouTube public tutorial' },
      { id: 'W6NZfCO5SIk', title: 'DOM Interaction Game Build', focus: 'Fast actions with understandable code flow', source: 'YouTube public tutorial' },
      { id: 'j48LtUkZRjU', title: 'From Zero to Playable Scene', focus: 'Tutorial beats that work in calm or excited sessions', source: 'Brackeys archive' },
      { id: 'x7X9w_GIm1s', title: 'Calm Puzzle Code Along', focus: 'Quiet logic puzzles versus fast action stacks', source: 'YouTube public tutorial' }
    ],
    [SubPage.STORIES]: [
      { id: 'RGo4z8wMZ-c', title: 'Story Experience Design in React', focus: 'Blend clarity with modern animation patterns', source: 'YouTube public tutorial' },
      { id: 'Ke90Tje7VS0', title: 'Component-Driven Content App', focus: 'Reusable, predictable, and expressive sections', source: 'YouTube public tutorial' },
      { id: '4UZrsTqkcW4', title: 'Accessible UI Case Study', focus: 'Inclusive interaction design for mixed sensory needs', source: 'YouTube public tutorial' },
      { id: '3nQNiWdeH2Q', title: 'Calm Reading Layout Lab', focus: 'Pair soft typography with bolder motion layers', source: 'YouTube public tutorial' },
      { id: 'TNhaISOUy6Q', title: 'Scroll-Linked Story Sections', focus: 'Multiple beats on one friendly page', source: 'YouTube tutorial' }
    ],
    [SubPage.VIDEOS]: [
      { id: 'N8DCz7MNx7Q', title: 'React Video UX Project', focus: 'Reliable embeds with polished browsing behavior', source: 'YouTube public tutorial' },
      { id: 'bMknfKXIFA8', title: 'Production React Patterns', focus: 'Scalable UI while keeping interactions playful', source: 'YouTube public tutorial' },
      { id: 'G3e-cpL7ofc', title: 'Complete Website Build', focus: 'Visual consistency and practical project delivery', source: 'YouTube public tutorial' },
      { id: 'UB1O30fjRqk', title: 'HTML & CSS Foundations', focus: 'Balanced markup and styling habits', source: 'YouTube public tutorial' },
      { id: 'x4rFhThSX04', title: 'Learn React with Guided Projects', focus: 'Practice mode + harder challenges', source: 'freeCodeCamp' },
      { id: 'IJ85kCdqWao', title: 'React UI with Tailwind', focus: 'Calm layouts that can switch to bolder themes', source: 'freeCodeCamp' }
    ]
  },
  [AppMode.IDLE]: {}
};

function getModeAwareVideos(mode: AppMode, section: SubPage): RelatedVideoItem[] {
  return RELATED_PROJECT_VIDEOS_BY_MODE[mode]?.[section] || [];
}

const ALL_prizes_dict: Record<string, { icon: string, name: string }> = {
  'cat': { name: 'Magic Cat', icon: '🐱' },
  'dog': { name: 'Space Dog', icon: '🐶' },
  'bear': { name: 'Golden Bear', icon: '🧸' },
  'ufo': { name: 'Neon UFO', icon: '🛸' },
  'rocket': { name: 'Rocket Ship', icon: '🚀' },
  'robot': { name: 'Helping Robot', icon: '🤖' },
  'hammer': { name: 'Magic Hammer', icon: '🔨' },
  'rainbow': { name: 'Rainbow Prize', icon: '🌈' },
  'diamond': { name: 'Cosmic Gem', icon: '💎' }
};

// --- Utilities ---

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

function toCssToken(value: string) {
  return value.replace(/[^a-z0-9]/gi, '');
}

// --- Components ---

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [subPage, setSubPage] = useState<SubPage>(SubPage.HOME);
  const [style, setStyle] = useState<StyleState>(StyleState.CALM);
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [ownedPrizes, setOwnedPrizes] = useState<string[]>([]); // New persistence for Arcade items
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const [showReward, setShowReward] = useState<{ type: string, value: string | number } | null>(null);
  const [rewardQueue, setRewardQueue] = useState<{ type: string, value: string | number }[]>([]);
  const pendingReward = rewardQueue[0] || null;
  const [unopenedRewards, setUnopenedRewards] = useState<UnopenedReward[]>([]);
  const [starsCollectedToday, setStarsCollectedToday] = useState(0);
  
  // DDA Engine
  const dda = useDDA();

  // Accessibility
  const systemReducedMotion = useReducedMotion();
  const [manualSensorySafety, setManualSensorySafety] = useState(false);
  const reducedMotion = systemReducedMotion || manualSensorySafety || dda.difficultyMultiplier < 1;

  // Persistence & Reward Service
  useEffect(() => {
    rewardService.init().then(() => {
      loadUnopened();
    });

    const saved = localStorage.getItem('senselink-data');
    if (saved) {
      const { stars, badges, sensorySafety, ownedPrizes, starsToday } = JSON.parse(saved);
      setStars(stars || 0);
      setBadges(badges || []);
      setManualSensorySafety(!!sensorySafety);
      setOwnedPrizes(ownedPrizes || []);
      setStarsCollectedToday(starsToday || 0);
    }
  }, []);

  const loadUnopened = async () => {
    const rewards = await rewardService.getRewards();
    setUnopenedRewards(rewards);
  };

  useEffect(() => {
    localStorage.setItem('senselink-data', JSON.stringify({ 
      stars, 
      badges, 
      sensorySafety: manualSensorySafety,
      ownedPrizes,
      starsToday: starsCollectedToday
    }));
  }, [stars, badges, manualSensorySafety, ownedPrizes, starsCollectedToday]);

  // Handle Mode Selection
  const selectMode = (newMode: AppMode) => {
    setMode(newMode);
    setSubPage(SubPage.HOME);
    if (newMode === AppMode.AUTISM) setStyle(StyleState.CALM);
    if (newMode === AppMode.ADHD) setStyle(StyleState.ACTIVE);
    if (newMode === AppMode.AUDHD) setStyle(StyleState.CALM);
  };

  const addReward = (type: 'star' | 'badge', value: string | number) => {
    setRewardQueue(prev => [...prev, { type, value }]);
  };

  const handleOpenNow = () => {
    if (!pendingReward) return;
    const { type, value } = pendingReward;
    
    if (type === 'star') {
      setStars(prev => prev + (value as number));
      setStarsCollectedToday(prev => prev + (value as number));
    }
    if (type === 'badge' && !badges.includes(value as string)) {
      setBadges(prev => [...prev, value as string]);
    }

    // Adaptive Feedback
    playCelebrationSound(mode);
    if (mode === AppMode.AUTISM) {
      if ('vibrate' in navigator) navigator.vibrate(200);
    }
    
    setShowReward({ type, value });
    setRewardQueue(prev => prev.slice(1));
    setTimeout(() => setShowReward(null), 3000);
  };

  const handleSaveLater = async () => {
    if (!pendingReward) return;
    const reward: UnopenedReward = {
      id: Math.random().toString(36).substr(2, 9),
      type: pendingReward.type as 'star' | 'badge',
      value: pendingReward.value,
      timestamp: Date.now()
    };
    await rewardService.saveReward(reward);
    await loadUnopened();
    setRewardQueue(prev => prev.slice(1));
  };

  const openTreasure = async (reward: UnopenedReward) => {
    if (reward.type === 'star') {
      setStars(prev => prev + (reward.value as number));
      setStarsCollectedToday(prev => prev + (reward.value as number));
    }
    if (reward.type === 'badge' && !badges.includes(reward.value as string)) {
      setBadges(prev => [...prev, reward.value as string]);
    }
    
    await rewardService.removeReward(reward.id);
    await loadUnopened();
    playCelebrationSound(mode);
    setShowReward({ type: reward.type, value: reward.value });
    setTimeout(() => setShowReward(null), 3000);
  };

  const resetToMenu = () => {
    setMode(AppMode.IDLE);
    setSubPage(SubPage.HOME);
    setSelectedGame(null);
  };

  const currentThemeClass =
    mode === AppMode.AUDHD
      ? (style === StyleState.CALM ? 'theme-calm' : 'theme-active')
      : style === StyleState.CALM
        ? 'theme-calm'
        : 'theme-active';

  return (
    <div className={cn(
      "min-h-screen font-sans transition-all duration-500 relative overflow-hidden",
      currentThemeClass,
      mode === AppMode.AUTISM && "mode-autism",
      mode === AppMode.ADHD && "mode-adhd",
      mode === AppMode.AUDHD && "mode-audhd",
      "bg-canvas"
    )}>
      <FloatingBackground style={style} mode={mode} reducedMotion={reducedMotion} />
      
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroScreen key="intro" onComplete={() => setShowIntro(false)} reducedMotion={reducedMotion} />
        )}

        {!showIntro && mode === AppMode.IDLE && (
          <MainMenu key="menu" onSelect={selectMode} reducedMotion={reducedMotion} />
        )}

        {!showIntro && mode !== AppMode.IDLE && (
          <ModeDashboard 
            key="dashboard"
            mode={mode}
            subPage={subPage}
            style={style}
            stars={stars}
            badges={badges}
            unopenedRewards={unopenedRewards}
            openTreasure={openTreasure}
            onSetSubPage={setSubPage}
            onToggleStyle={() => setStyle(prev => prev === StyleState.CALM ? StyleState.ACTIVE : StyleState.CALM)}
            onBack={resetToMenu}
            addReward={(s: number, b: string, rt?: number) => {
              addReward('star', s);
              if (b) addReward('badge', b);
              if (selectedGame) dda.recordAttempt(selectedGame, 'WIN', mode, rt);
            }}
            onLoss={() => dda.recordAttempt(selectedGame || 'unknown', 'LOSS', mode)}
            dda={dda}
            setStars={setStars}
            ownedPrizes={ownedPrizes}
            setOwnedPrizes={setOwnedPrizes}
            selectedGame={selectedGame}
            setSelectedGame={setSelectedGame}
            reducedMotion={reducedMotion}
            manualSensorySafety={manualSensorySafety}
            onToggleSensorySafety={() => setManualSensorySafety(p => !p)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReward && (
          <RewardCelebration 
            type={showReward.type} 
            value={showReward.value} 
            reducedMotion={reducedMotion}
            mode={mode}
            style={style}
            onClose={() => setShowReward(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dda.showPracticePrompt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[56px] p-12 max-w-lg w-full text-center shadow-2xl border-b-[12px] border-emerald-100"
             >
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                   <Shield size={48} className="text-emerald-500" />
                </div>
                <h2 className="text-4xl font-display font-black text-slate-800 mb-4">Hard time?</h2>
                <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
                   We noticed things are a bit tricky. We've slowed the game down for you. Would you like to enter <b>Practice Mode</b>?
                </p>
                <div className="flex flex-col gap-4">
                   <button 
                     onClick={() => { dda.setIsPracticeMode(true); dda.setShowPracticePrompt(false); }}
                     className="bg-emerald-500 text-white px-10 py-5 rounded-[32px] font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                   >
                     YES, SLOW DOWN! 🧘‍♂️
                   </button>
                   <button 
                     onClick={() => dda.setShowPracticePrompt(false)}
                     className="text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors"
                   >
                     I'll keep trying!
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingReward && (
          <RewardChoiceModal 
            mode={mode}
            reward={pendingReward}
            onOpenNow={handleOpenNow}
            onSaveLater={handleSaveLater}
            starsCollectedToday={starsCollectedToday}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingBackground({ style, mode, reducedMotion }: { style: StyleState, mode?: AppMode, reducedMotion: boolean }) {
  const isAutismVisual = mode === AppMode.AUTISM || (mode === AppMode.AUDHD && style === StyleState.CALM);
  const isADHDVisual = mode === AppMode.ADHD || (mode === AppMode.AUDHD && style === StyleState.ACTIVE);
  const isPaused = reducedMotion; // DDA already affects reducedMotion
  
  const shapes = useMemo(() => Array.from({ length: reducedMotion ? 5 : 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * (reducedMotion ? 150 : 300) + 100,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 15 + 15,
    delay: Math.random() * 5,
    opacity: isAutismVisual ? Math.random() * 0.2 + 0.1 : Math.random() * 0.15 + 0.05,
    color: isAutismVisual 
      ? ['#B4E4D3', '#D6B4E4', '#9DC8E8', '#F9E4B7'][Math.floor(Math.random() * 4)]
      : null
  })), [isAutismVisual, reducedMotion]);

  const stars = useMemo(() => Array.from({ length: reducedMotion ? 10 : 40 }).map((_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
  })), [reducedMotion]);

  const shapeStyles = useMemo(() => shapes.map((s) => {
    const baseColor = s.color ? `background-color:${s.color};` : '';
    return `.floating-shape-${s.id}{width:${s.size}px;height:${s.size}px;top:${s.top}%;left:${s.left}%;${baseColor}}`;
  }).join('\n'), [shapes]);

  const starStyles = useMemo(() => stars.map((star) =>
    `.floating-star-${star.id}{top:${star.top}%;left:${star.left}%;width:${star.size}px;height:${star.size}px;animation-delay:${star.delay}s;opacity:0.6;}`
  ).join('\n'), [stars]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <style>{`${shapeStyles}\n${starStyles}`}</style>
      {/* Background Dots Pattern for Autism/Calm */}
      {isAutismVisual && <div className="absolute inset-0 bg-dots" />}

      {/* Background Blobs */}
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className={cn(
            `floating-shape-${s.id} absolute rounded-full blur-[80px]`,
            isAutismVisual ? "" : "bg-primary-theme"
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={reducedMotion ? {
             scale: 1,
             opacity: s.opacity
          } : { 
            scale: [1, 1.1, 1], 
            opacity: s.opacity,
            y: [0, -40, 0],
            x: [0, 20, 0]
          }}
          transition={reducedMotion ? { duration: 1.5 } : {
            scale: { duration: s.duration, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 2 },
            y: { duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: s.delay },
            x: { duration: s.duration * 1.2, repeat: Infinity, ease: "easeInOut", delay: s.delay }
          }}
        />
      ))}

      {/* Tiny Twinkling Stars for Mixed/ADHD modes */}
      {isADHDVisual && stars.map((star) => (
        <div
          key={star.id}
          className={cn(`floating-star-${star.id} absolute bg-white rounded-full`, !reducedMotion && "animate-twinkle")}
        />
      ))}
    </div>
  );
}

function RewardCelebration({ type, value, reducedMotion, onClose, mode, style }: any) {
  const isCalmProfile = mode === AppMode.AUTISM || (mode === AppMode.AUDHD && style === StyleState.CALM);
  const isActiveProfile = mode === AppMode.ADHD || (mode === AppMode.AUDHD && style === StyleState.ACTIVE);
  const headline = isCalmProfile ? "Calm Reward Unlocked" : isActiveProfile ? "MEGA REWARD UNLOCKED! ⚡" : "Awesome Balance! 🌈";
  const cta = isCalmProfile ? "Continue Calmly" : isActiveProfile ? "Next Challenge!" : "Keep Exploring";
  
  const particles = useMemo(() => Array.from({ length: reducedMotion ? 10 : (isActiveProfile ? 80 : 40) }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A7D0CD', '#6C5CE7'][Math.floor(Math.random() * 5)],
    delay: Math.random() * 0.5,
    duration: isCalmProfile ? (Math.random() * 5 + 5) : (Math.random() * 2 + 1),
    size: Math.random() * 8 + (isActiveProfile ? 12 : 8)
  })), [reducedMotion, isActiveProfile, isCalmProfile]);

  const balloons = useMemo(
    () =>
      isActiveProfile
        ? Array.from({ length: reducedMotion ? 3 : 9 }).map((_, i) => ({
            id: i,
            left: 8 + i * 10 + Math.random() * 8,
            delay: Math.random() * 0.6
          }))
        : [],
    [isActiveProfile, reducedMotion]
  );

  const particleStyles = useMemo(() => particles.map((p) =>
    `.celebration-particle-${p.id}{width:${p.size}px;height:${p.size}px;background-color:${p.color};}`
  ).join('\n'), [particles]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <style>{particleStyles}</style>
      {/* Explosive effect for ADHD/Active profile */}
      {!isCalmProfile && particles.map(p => (
        <motion.div 
          key={p.id} 
          className={cn(`celebration-particle-${p.id} absolute rounded-sm pointer-events-none`)} 
          initial={{ top: '50%', left: '50%', rotate: 0, scale: 0 }}
          animate={reducedMotion ? {
            top: '80%',
            opacity: [0, 1, 0]
          } : { 
            top: [`${50 + (Math.random() - 0.5) * 10}%`, `${Math.random() * 120}%`], 
            left: [`${50 + (Math.random() - 0.5) * 10}%`, `${Math.random() * 100}%`],
            rotate: 720,
            scale: [0, 1, 0.5],
            opacity: [0, 1, 0]
          }}
          transition={reducedMotion ? { duration: 2, delay: p.delay } : { 
            duration: p.duration, 
            delay: p.delay, 
            ease: "easeOut"
          }}
        />
      ))}

      {/* Balloon pop effect for ADHD/Active profile */}
      {isActiveProfile && balloons.map((b) => (
        <motion.div
          key={`balloon-${b.id}`}
          initial={{ opacity: 0, y: 40, x: 0, scale: 0.7 }}
          animate={reducedMotion ? { opacity: 0.85, y: -20 } : { opacity: [0, 1, 1, 0], y: [60, -40, -120], x: [0, (Math.random() - 0.5) * 40], scale: [0.8, 1.1, 1] }}
          transition={{ duration: reducedMotion ? 1.8 : 2.8, delay: b.delay, ease: "easeOut" }}
          className="absolute bottom-0 text-4xl pointer-events-none"
          style={{ left: `${b.left}%` }}
        >
          🎈
        </motion.div>
      ))}

      {/* Gentle fade for calm profile */}
      {isCalmProfile && (
         <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
           className="absolute inset-0 bg-theme/5 pointer-events-none"
         />
      )}
      
      <motion.div
        initial={isCalmProfile ? { opacity: 0, scale: 0.9 } : { scale: 0, rotate: -20 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, y: 100, opacity: 0 }}
        transition={isCalmProfile ? { duration: 1.5 } : { type: "spring", damping: 12, stiffness: 200 }}
        className={cn(
          "rounded-[48px] p-12 flex flex-col items-center gap-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative border-b-[12px]",
          isCalmProfile ? "bg-white border-[#A7D0CD]" : "bg-[#0B1226] border-[#60A5FA] text-white"
        )}
      >
        <motion.div
          animate={isCalmProfile ? { 
            scale: [1, 1.02, 1],
            opacity: [1, 0.8, 1]
          } : { 
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ repeat: Infinity, duration: isCalmProfile ? 4 : 2 }}
          className="bg-yellow-50 p-10 rounded-full"
        >
          {type === 'star' ? <Star size={100} className="text-yellow-500 fill-yellow-500" /> : <Award size={100} className="text-orange-500" />}
        </motion.div>
        
        <div className="text-center px-4">
          <p className={cn(
            "font-black uppercase tracking-[0.2em] mb-3 text-xs",
            isCalmProfile ? "text-slate-600" : "text-blue-200"
          )}>
            Reward Earned
          </p>
          <h2 className={cn(
            "text-5xl font-display font-black tracking-tight",
            isCalmProfile ? "text-slate-900" : "text-white"
          )}>
            {headline}
          </h2>
          <p className={cn(
            "text-2xl font-bold mt-4 font-sans max-w-xl mx-auto",
            isCalmProfile ? "text-slate-800" : "text-blue-50"
          )}>
            {type === 'star' ? (
              <>
                Congratulations! You earned <strong className="text-amber-600">{value}</strong> stars.
              </>
            ) : (
              <>
                New badge earned: <strong className={isCalmProfile ? "text-orange-700" : "text-amber-200"}>{value}</strong>
              </>
            )}
          </p>
        </div>

        <motion.button
          whileHover={reducedMotion ? {} : { scale: 1.05 }}
          whileTap={reducedMotion ? {} : { scale: 0.95 }}
          className="bg-theme text-white px-10 py-4 rounded-3xl font-bold text-xl shadow-lg mt-2"
          onClick={onClose}
        >
          {cta}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function IntroScreen({ onComplete, reducedMotion }: { onComplete: () => void, reducedMotion: boolean, key?: string }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, reducedMotion ? 1500 : 3500);
    return () => clearTimeout(timer);
  }, [onComplete, reducedMotion]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.1, filter: reducedMotion ? "none" : "blur(10px)" }}
      onClick={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDF8F3] cursor-pointer"
    >
      {/* Decorative Bubbles */}
      {!reducedMotion && (
        <>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
            transition={{ repeat: Infinity, duration: 8 }}
            className="absolute top-20 left-20 w-32 h-32 bg-[#A7D0CD]/30 rounded-full blur-xl" 
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], x: [0, -40, 0] }}
            transition={{ repeat: Infinity, duration: 10 }}
            className="absolute bottom-40 right-20 w-48 h-48 bg-[#FFB347]/30 rounded-full blur-2xl" 
          />
        </>
      )}

      <div className="relative group">
        {!reducedMotion && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-tr from-[#A7D0CD] to-[#FFB347] rounded-full opacity-20 group-hover:opacity-40 blur-3xl scale-150"
          />
        )}
        
        <motion.h1 
          initial={reducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={reducedMotion ? { duration: 0.5 } : { 
            type: "spring", 
            stiffness: 200, 
            damping: 12 
          }}
          className="text-8xl md:text-[10rem] font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-[#4A5D5E] to-[#A7D0CD] tracking-tighter"
        >
          SenseLink
        </motion.h1>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0.2 : 1 }}
        className={cn("mt-8 text-2xl font-bold text-[#A7D0CD]", !reducedMotion && "animate-pulse-soft")}
      >
        Click to Start your Adventure!
      </motion.p>
    </motion.div>
  );
}

function MainMenu({ onSelect, reducedMotion }: { onSelect: (m: AppMode) => void, reducedMotion: boolean, key?: string }) {
  return (
    <motion.div 
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen"
    >
      <motion.h2 
        initial={reducedMotion ? { opacity: 0 } : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-5xl md:text-6xl font-display font-black text-theme mb-16 text-center tracking-tight"
      >
        Hello Friend! 👋 <br/>
        <span className="text-3xl md:text-4xl text-theme/60">How shall we play today?</span>
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl p-4">
        <MenuCard 
          title="Autism Mode" 
          icon={<Puzzle size={64} />} 
          color="bg-[#A7D0CD]"
          onClick={() => onSelect(AppMode.AUTISM)}
          description="Soft colors, calm sounds, and clear steps for peaceful discovery."
          badge="Calm & Sweet"
          reducedMotion={reducedMotion}
        />
        <MenuCard 
          title="ADHD Mode" 
          icon={<Zap size={64} />} 
          color="bg-[#FFB347]"
          onClick={() => onSelect(AppMode.ADHD)}
          description="High energy, fun challenges, and super fast-paced excitement!"
          badge="Fast & Fun"
          reducedMotion={reducedMotion}
        />
        <MenuCard 
          title="AuDHD Mode" 
          icon={<RefreshCw size={64} />} 
          color="bg-[#4A90E2]"
          onClick={() => onSelect(AppMode.AUDHD)}
          description="The perfect mix of pattern magic and energetic adventure."
          badge="Super Combo"
          reducedMotion={reducedMotion}
        />
      </div>
    </motion.div>
  );
}

function MenuCard({ title, icon, color, onClick, description, badge, reducedMotion }: any) {
  return (
    <motion.button
      whileHover={reducedMotion ? {} : { y: -15, scale: 1.02 }}
      whileTap={reducedMotion ? {} : { scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center p-12 rounded-[56px] shadow-2xl text-white transition-all group relative overflow-hidden text-center",
        color
      )}
    >
      <div className="absolute top-6 right-8 bg-white/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
        {badge}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Decorative pulse ring */}
      {!reducedMotion && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-4 border-white/5 rounded-full group-hover:scale-150 transition-transform duration-1000" />}
      
      <motion.div 
        animate={reducedMotion ? {} : { 
          rotate: [0, 5, -5, 0],
          scale: [1, 1.1, 1] 
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="mb-10 z-10 p-8 rounded-full bg-white/10 ring-8 ring-white/5 shadow-2xl"
      >
        {icon}
      </motion.div>
      
      <h3 className="text-3xl font-display font-black mb-4 z-10 tracking-tight drop-shadow-sm">{title}</h3>
      <p className="text-white/90 text-center text-base leading-relaxed z-10 font-medium">
        {description}
      </p>
      
      <motion.div 
        whileHover={reducedMotion ? {} : { scale: 1.05 }}
        className="mt-8 z-10 w-full py-4 bg-white/10 rounded-3xl font-bold group-hover:bg-white/20 transition-all border border-white/20 backdrop-blur-sm"
      >
        Enter Portal 🚀
      </motion.div>
    </motion.button>
  );
}

function ModeDashboard({ 
  mode, subPage, style, stars, badges, onSetSubPage, onToggleStyle, onBack, addReward, onLoss, selectedGame, setSelectedGame, 
  reducedMotion, manualSensorySafety, onToggleSensorySafety, setStars, ownedPrizes, setOwnedPrizes, dda,
  unopenedRewards = [], openTreasure
}: any) {
  const isCalm = style === StyleState.CALM;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-screen flex flex-col">
      {/* Header - Glassmorphic and Sharp */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 glass-card p-6 rounded-[32px] border-white/50">
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={reducedMotion ? {} : { x: -5 }}
            onClick={subPage === SubPage.HOME ? onBack : () => onSetSubPage(SubPage.HOME)}
            className="flex items-center gap-2 p-4 bg-theme/5 rounded-2xl hover:bg-theme/10 transition-all text-theme font-black"
          >
            <ArrowLeft size={28} />
          </motion.button>
          
          <div>
            <h1 className="text-3xl font-display font-black text-theme tracking-tight">
              {subPage === SubPage.HOME ? `Welcome back! ✨` : subPage}
            </h1>
            <p className="text-theme/50 font-bold text-sm uppercase tracking-widest">{mode} Journey</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Sensory Safety Toggle */}
          <motion.button
            whileHover={reducedMotion ? {} : { scale: 1.05 }}
            whileTap={reducedMotion ? {} : { scale: 0.95 }}
            onClick={onToggleSensorySafety}
            className={cn(
               "flex items-center gap-3 px-5 py-3 rounded-2xl font-black transition-all border-b-4",
               manualSensorySafety 
                 ? "bg-slate-700 text-white border-slate-900" 
                 : "bg-white text-slate-400 border-slate-200"
            )}
            title="Sensory Safety Mode"
          >
            {manualSensorySafety ? <ZapOff size={24} /> : <Settings size={24} />}
            <span className="hidden sm:inline">{manualSensorySafety ? 'Safety ON' : 'Safety'}</span>
          </motion.button>

          {mode === AppMode.AUDHD && (
            <motion.button 
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              onClick={onToggleStyle}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black transition-all shadow-lg border-b-4 ring-4",
                isCalm 
                  ? "bg-calm-primary text-white border-calm-primary/30 ring-calm-primary/30 shadow-[0_0_30px_rgba(136,204,238,0.45)]" 
                  : style === StyleState.ACTIVE 
                    ? "bg-active-primary text-white border-active-primary/30 ring-active-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.45)]"
                    : "bg-mixed-primary text-white border-mixed-primary/30 ring-mixed-primary/30"
              )}
              title="Switch between Autism and ADHD style"
            >
              {isCalm ? <Moon size={24} /> : <Sun size={24} />}
              <span>{isCalm ? 'Autism Style' : 'ADHD Style'}</span>
            </motion.button>
          )}

          <div className="flex items-center gap-4 rounded-2xl p-2 pr-6 border-2 border-slate-900/10 bg-white/95 shadow-inner">
            <div className="bg-amber-400 p-2 rounded-xl shadow-lg">
               <Star size={24} className="text-amber-950 fill-amber-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black text-slate-900 leading-none tabular-nums">{stars}</span>
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Stars</span>
            </div>
          </div>
          
          <button 
            onClick={() => onSetSubPage(SubPage.REPORT)}
            title="Open sensory report"
            aria-label="Open sensory report"
            className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-all mr-2"
          >
            <BarChart3 size={28} />
          </button>
          
          <button 
            onClick={() => onSetSubPage(SubPage.ARCADE)}
            title="Open reward arcade"
            aria-label="Open reward arcade"
            className="p-4 bg-theme text-white rounded-2xl shadow-xl hover:scale-105 transition-all"
          >
            <Gift size={28} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow">
        <AnimatePresence mode="wait">
          {subPage === SubPage.HOME && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <FeatureCard 
                id="games"
                title="Play Zone" 
                icon={<Gamepad2 />} 
                onClick={() => onSetSubPage(SubPage.GAMES)}
                isCalm={isCalm}
                index={0}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="runner"
                title="Cosmic Runner" 
                icon={<Zap />} 
                onClick={() => { setSelectedGame('runner'); onSetSubPage(SubPage.GAME_DETAIL); }}
                isCalm={isCalm}
                index={1}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="stories"
                title="Story World" 
                icon={<BookOpen />} 
                onClick={() => onSetSubPage(SubPage.STORIES)}
                isCalm={isCalm}
                index={2}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="videos"
                title="Discovery" 
                icon={<Video />} 
                onClick={() => onSetSubPage(SubPage.VIDEOS)}
                isCalm={isCalm}
                index={3}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="racing"
                title="Cosmic GP" 
                icon={<Trophy />} 
                onClick={() => { setSelectedGame('racing'); onSetSubPage(SubPage.GAME_DETAIL); }}
                isCalm={isCalm}
                index={4}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="treasures"
                title="My Treasures" 
                icon={<Gift />} 
                onClick={() => onSetSubPage(SubPage.ARCADE)}
                isCalm={isCalm}
                index={5}
                mode={mode}
                reducedMotion={reducedMotion}
              />
            </motion.div>
          )}

          {subPage === SubPage.GAMES && (
            <div className="space-y-10">
              <GameList 
                mode={mode} 
                isCalm={isCalm} 
                reducedMotion={reducedMotion}
                onSelect={(g: string) => { setSelectedGame(g); onSetSubPage(SubPage.GAME_DETAIL); }} 
              />
              <RelatedVideosSection
                title="Related Real-World Project Videos"
                videos={getModeAwareVideos(mode, SubPage.GAMES)}
                mode={mode}
                reducedMotion={reducedMotion}
              />
            </div>
          )}

          {subPage === SubPage.GAME_DETAIL && selectedGame && (
            <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
              {/* DDA Status Indicator */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-white/5 backdrop-blur-sm px-8 py-4 rounded-[32px] border border-white/10"
              >
                 <div className="flex items-center gap-4 text-theme">
                    {dda.difficultyMultiplier < 1 ? (
                      <div className="flex items-center gap-3 text-emerald-500 font-black uppercase text-xs tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full">
                        <Shield size={16} /> Guided Mode
                      </div>
                    ) : dda.isChallengeMode ? (
                      <div className="flex items-center gap-3 text-yellow-500 font-black uppercase text-xs tracking-widest bg-yellow-500/10 px-4 py-2 rounded-full">
                        <Sparkles size={16} /> Challenge Mode
                      </div>
                    ) : (
                      <div className="text-theme/40 font-black uppercase text-xs tracking-widest">Normal Pace</div>
                    )}
                 </div>
                 {dda.difficultyMultiplier !== 1 && (
                   <button 
                     onClick={dda.resetDifficulty}
                     className="text-[10px] font-black uppercase text-theme/20 hover:text-theme transition-colors flex items-center gap-2"
                   >
                     <RefreshCw size={12} /> Reset to Default
                   </button>
                 )}
              </motion.div>

              <div className="glass-card p-12 rounded-[56px] min-h-[60vh] flex items-center justify-center relative overflow-hidden">
                <GamePlayer 
                  gameId={selectedGame} 
                  isCalm={isCalm} 
                  mode={mode}
                  reducedMotion={reducedMotion}
                  ddaMultiplier={dda.difficultyMultiplier}
                  onComplete={(s: number, b: string, rt?: number) => { 
                    addReward(s, b); 
                    if (selectedGame) dda.recordAttempt(selectedGame, 'WIN', mode, rt);
                    onSetSubPage(SubPage.HOME); 
                  }} 
                  onLoss={() => {
                    if (selectedGame) dda.recordAttempt(selectedGame, 'LOSS', mode);
                    onLoss();
                    onSetSubPage(SubPage.HOME);
                  }}
                />
              </div>
            </div>
          )}

          {(subPage === SubPage.STORIES || subPage === SubPage.VIDEOS) && (
            <VideoGallery 
              items={subPage === SubPage.STORIES ? YOUTUBE_STORIES : YOUTUBE_VIDEOS} 
              isCalm={isCalm} 
              reducedMotion={reducedMotion}
              onSetStars={(num: number) => addReward('star', num)}
              section={subPage}
              mode={mode}
            />
          )}

          {subPage === SubPage.ARCADE && (
            <RewardArcade 
              mode={mode} 
              stars={stars} 
              ownedPrizes={ownedPrizes}
              reducedMotion={reducedMotion}
              onSpend={(cost: number, prizeId: string) => {
                setStars((s: number) => s - cost);
                setOwnedPrizes((p: string[]) => [...p, prizeId]);
              }}
            />
          )}

          {subPage === SubPage.REPORT && (
            <SensoryReport 
              history={dda.history}
              ddaTriggerCount={dda.ddaTriggerCount}
              reducedMotion={reducedMotion}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Rewards Showcase - High-End Trophy Room */}
      <footer className="mt-24 pt-12 border-t border-theme/5">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-display font-black text-theme tracking-tight flex items-center gap-4">
              <div className="p-3 bg-secondary-theme/20 rounded-2xl">
                <Gift size={32} className="text-theme" />
              </div> 
              Your Collection
            </h3>
            <span className="bg-theme/5 px-4 py-2 rounded-xl text-sm font-black text-theme/60 uppercase tracking-widest border border-theme/10">
              {badges.length + ownedPrizes.length + unopenedRewards.length} Rewards Earned
            </span>
         </div>

         {/* Unopened Treasures Section */}
         {unopenedRewards.length > 0 && (
           <div className="mb-12">
             <div className="flex items-center gap-4 mb-6">
                <Archive size={24} className="text-active-primary" />
                <h4 className="text-xl font-black text-theme uppercase tracking-tighter">My Treasures ({unopenedRewards.length})</h4>
             </div>
             <div className="flex gap-6 overflow-x-auto pb-4 mask-fade-right no-scrollbar">
                {unopenedRewards.map((r: any) => (
                  <motion.button
                    key={r.id}
                    whileHover={reducedMotion ? {} : { scale: 1.05 }}
                    whileTap={reducedMotion ? {} : { scale: 0.95 }}
                    onClick={() => openTreasure(r)}
                    className="flex-shrink-0 w-48 h-48 bg-white rounded-[40px] shadow-xl border-4 border-active-highlight/20 flex flex-col items-center justify-center gap-3 group"
                  >
                     <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-theme group-hover:text-white transition-all">
                        <Gift size={28} />
                     </div>
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Unopened</span>
                     <div className="flex items-center gap-2 text-active-primary">
                        <Eye size={14} />
                        <span className="text-xs font-bold">Tap to Reveal</span>
                     </div>
                  </motion.button>
                ))}
             </div>
           </div>
         )}
         
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
           {badges.length === 0 && ownedPrizes.length === 0 && (
             <div className="col-span-full py-12 glass-card rounded-[32px] flex flex-col items-center justify-center border-dashed border-2 opacity-40">
                < Award size={48} className="mb-4 text-theme" />
                <p className="font-bold text-theme">Play games to fill your trophy room!</p>
             </div>
           )}
           {badges.map((b: string, i: number) => (
             <motion.div 
               key={b}
               initial={{ scale: 0, rotate: -20 }}
               animate={{ scale: 1, rotate: 0 }}
               transition={{ delay: i * 0.1, type: "spring" }}
               className="glass-card p-6 rounded-[32px] flex flex-col items-center gap-4 group hover:bg-white transition-all shadow-theme"
             >
               <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-400 rounded-2xl shadow-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                 <Award size={32} className="text-white" />
               </div>
               <span className="font-black text-xs text-theme uppercase tracking-wider text-center">{b}</span>
             </motion.div>
           ))}
           {ownedPrizes.map((p: string, i: number) => {
             const prize = ALL_prizes_dict[p] || { icon: '🎁', name: 'Prize' };
             return (
               <motion.div 
                 key={p}
                 initial={{ scale: 0, scaleY: 0.5 }}
                 animate={{ scale: 1, scaleY: 1 }}
                 transition={{ delay: (badges.length + i) * 0.1, type: "spring" }}
                 className="glass-card p-6 rounded-[32px] flex flex-col items-center gap-4 group hover:bg-white transition-all shadow-theme"
               >
                 <div className="text-5xl group-hover:scale-110 transition-transform">
                   {prize.icon}
                 </div>
                 <span className="font-black text-xs text-theme uppercase tracking-wider text-center">{prize.name}</span>
               </motion.div>
             );
           })}
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, icon, onClick, isCalm, index, mode, reducedMotion, id }: any) {
  const calmAccents = ['#88CCEE', '#AADDCC', '#FFEECC', '#D6B4E4'];
  
  let accent = isCalm ? calmAccents[index % calmAccents.length] : 'var(--current-primary)';
  const accentToken = toCssToken(String(accent));
  const featureStyles = isCalm ? `
    .feature-overlay-${accentToken} { background-image: linear-gradient(to bottom right, ${accent}30, transparent); }
    .feature-icon-${accentToken} { background-color: ${accent}20; }
    .feature-line-${accentToken} { background-color: ${accent}; }
  ` : `
    .feature-line-${accentToken} { background-color: ${accent}; }
  `;
  
  // Task 6.1: Adaptive icons for games
  if (id === 'runner' || id === 'racing') {
    if (mode === AppMode.AUTISM) accent = '#88CCEE';
    else if (mode === AppMode.ADHD) accent = '#FFB347';
    else if (mode === AppMode.AUDHD) accent = '#6C5CE7';
  }

  return (
    <>
      <style>{featureStyles}</style>
      <motion.button
      whileHover={reducedMotion ? {} : (isCalm ? { y: -10, scale: 1.02 } : { scale: 1.05, rotate: [0, -1, 1, 0], y: -5 })}
      whileTap={reducedMotion ? {} : { scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-12 rounded-[48px] transition-all group relative overflow-hidden",
        "glass-card border-2 h-full min-h-[320px]",
        isCalm ? "border-white/50 text-theme" : "border-white text-theme shadow-active-shadow"
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br transition-opacity opacity-0 group-hover:opacity-10",
        isCalm ? `feature-overlay-${accentToken}` : "from-active-primary to-active-secondary"
      )} />
      
      <motion.div 
        animate={reducedMotion ? {} : { y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className={cn(
          "mb-8 p-10 rounded-full shadow-inner-lg transition-transform group-hover:scale-110",
          "bg-canvas",
          isCalm && `feature-icon-${accentToken}`
        )}
      >
         {React.cloneElement(icon, { size: 64, color: accent })}
      </motion.div>
      
      <h3 className="text-4xl font-display font-black tracking-tight">{title}</h3>
      <div 
        className={cn("mt-4 w-12 h-1.5 rounded-full opacity-30 group-hover:w-24 transition-all", `feature-line-${accentToken}`)} 
      />
      </motion.button>
    </>
  );
}

function GameList({ mode, isCalm, onSelect, reducedMotion }: any) {
  const games = useMemo(() => {
    if (mode === AppMode.AUTISM) {
      return [
        { id: 'colors', title: 'Sort by Color', icon: <Palette size={32} />, accent: '#AADDCC', reward: '+15 ⭐ · Color Hero · 10 levels · 8 colors' },
        { id: 'pattern', title: 'Complete Patterns', icon: <Layout size={32} />, accent: '#FFEECC', reward: '+12 ⭐ · Pattern Pro · 8 levels' },
        { id: 'emotions', title: 'Emotion Match', icon: <CheckCircle2 size={32} />, accent: '#B4E4D3', reward: '+10 ⭐ · Friend Finder · 8 rounds' },
        { id: 'sensory', title: 'Magical Sand', icon: <Waves size={32} />, accent: '#FFD700', reward: '+10 ⭐ · Sand Artist' },
        { id: 'runner', title: 'Cosmic Runner', icon: <Zap size={32} />, accent: '#FF6B6B', reward: '+3 ⭐ · Runner badge' },
        { id: 'racing', title: 'Cosmic Grand Prix', icon: <Trophy size={32} />, accent: '#EAB8E4', reward: '+3 ⭐ · Racer badge' }
      ];
    }
    if (mode === AppMode.ADHD) {
      return [
        { id: 'runner', title: 'Cosmic Runner', icon: <Zap size={32} />, accent: '#FFB347', reward: '+3 ⭐ + Runner badge' },
        { id: 'racing', title: 'Cosmic Grand Prix', icon: <Trophy size={32} />, accent: '#FF8F8F', reward: '+3 ⭐ + Racer badge' },
        { id: 'kitchen', title: 'Kitchen Mess', icon: <Gift size={32} />, accent: '#4ECDC4', reward: '+10 ⭐ Chef Chaos' },
        { id: 'popper', title: 'Pet Popper', icon: <Zap size={32} />, accent: '#FFE66D', reward: '+10 ⭐ Bubble Popper' },
        { id: 'rocket', title: 'Rocket Blast', icon: <Zap size={32} />, accent: '#FF6B6B', reward: '+10 ⭐ Rocket Ace' },
        { id: 'speed', title: 'Rapid Tap', icon: <Timer size={32} />, accent: '#A29BFE', reward: 'Up to +10 ⭐ Turbo Fingers' },
        { id: 'glow', title: 'Glow Doodle', icon: <Palette size={32} />, accent: '#F06292', reward: '+10 ⭐ Glow Artist' },
        { id: 'whack', title: 'Mole Mash', icon: <Layout size={32} />, accent: '#9575CD', reward: '+10 ⭐ Mole Masher' }
      ];
    }
    return [
      { id: 'dollhouse', title: 'Digital Dollhouse', icon: <Layout size={32} />, accent: '#6C5CE7', reward: '+15 ⭐ Master Decorator' },
      { id: 'musiclab', title: 'Music Lab', icon: <Video size={32} />, accent: '#A29BFE', reward: '+15 ⭐ Music Maker' },
      { id: 'stars', title: 'Star Builder', icon: <Star size={32} />, accent: '#FDCB6E', reward: '+15 ⭐ Master Astronomer' },
      { id: 'blocks', title: 'Gravity Blocks', icon: <Shapes size={32} />, accent: '#00CEC9', reward: '+15 ⭐ Tower Builder' },
      { id: 'runner', title: 'Cosmic Runner', icon: <Zap size={32} />, accent: '#FF7675', reward: '+3 ⭐ + Runner badge' },
      { id: 'racing', title: 'Cosmic Grand Prix', icon: <Trophy size={32} />, accent: '#636E72', reward: '+3 ⭐ + Racer badge' }
    ];
  }, [mode]);

  const gameStyles = useMemo(() => games.map((g: any) => {
    const token = toCssToken(g.accent);
    const alpha = isCalm ? '40' : '15';
    return `.game-accent-${token}{background-color:${g.accent}${alpha};}`;
  }).join('\n'), [games, isCalm]);

  return (
    <motion.div 
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-grid"
    >
      <style>{gameStyles}</style>
      {games.map(g => (
        <motion.button 
          key={g.id}
          whileHover={reducedMotion ? {} : { scale: 1.03, y: -5 }}
          whileTap={reducedMotion ? {} : { scale: 0.97 }}
          onClick={() => onSelect(g.id)}
          className={cn(
            "p-8 rounded-[32px] glass-card flex flex-col items-center justify-center gap-6 text-center group transition-all",
            !isCalm && !reducedMotion && "animate-wiggle"
          )}
        >
          <div 
            className={cn(
              "p-6 rounded-3xl transition-all shadow-inner",
              !isCalm && "border-2 border-white backdrop-blur-sm",
              `game-accent-${toCssToken(g.accent)}`
            )}
          >
            {React.cloneElement(g.icon as React.ReactElement<{ color?: string; strokeWidth?: number }>, { 
              color: g.accent, 
              strokeWidth: isCalm ? 2 : 2.5 
            })}
          </div>
          <span className="text-2xl font-bold tracking-tight text-theme">{g.title}</span>
          <span className="text-xs font-black uppercase tracking-wide text-slate-900 bg-amber-100 border border-amber-300 px-3 py-2 rounded-2xl max-w-[95%]">
            Reward · {g.reward}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}

// --- Mini Games Implementation ---

function GamePlayer({ gameId, isCalm, onComplete, mode, ddaMultiplier = 1.0, onLoss, reducedMotion }: any) {
  const commonProps = { 
    isCalm, 
    onComplete: (s: number, b: string, rt?: number) => onComplete(s, b, rt), 
    ddaMultiplier, 
    onLoss, 
    reducedMotion 
  };
  
  switch (gameId) {
    case 'colors': return <SortColorsGame {...commonProps} />;
    case 'pattern': return <PatternGame {...commonProps} />;
    case 'emotions': return <EmotionMatchGame {...commonProps} />;
    case 'sensory': return <SensorySandGame {...commonProps} />;
    case 'kitchen': return <KitchenMessGame {...commonProps} />;
    case 'popper': return <PetPopperGame {...commonProps} />;
    case 'rocket': return <RocketBlastGame {...commonProps} />;
    case 'speed': return <RapidTapGame {...commonProps} />;
    case 'glow': return <GlowDoodleGame {...commonProps} />;
    case 'whack': return <MoleMashGame {...commonProps} />;
    case 'dollhouse': return <DollhouseGame {...commonProps} />;
    case 'musiclab': return <MusicLabGame {...commonProps} />;
    case 'stars': return <StarBuilderGame {...commonProps} />;
    case 'blocks': return <GravityBlocksGame {...commonProps} />;
    case 'runner': return <InfiniteRunnerGame mode={mode} ddaMultiplier={ddaMultiplier} onComplete={onComplete} onLoss={onLoss} reducedMotion={reducedMotion} />;
    case 'racing': return <RacingGame mode={mode} ddaMultiplier={ddaMultiplier} onComplete={onComplete} onLoss={onLoss} reducedMotion={reducedMotion} />;
    default: return <div className="text-center p-20">Game coming soon!</div>;
  }
}

// Sensory Sand Game
function SensorySandGame({ onComplete, reducedMotion }: any) {
  const [points, setPoints] = useState<any[]>([]);
  const [cleaning, setCleaning] = useState(false);
  const pointStyles = useMemo(() => points.map((p, i) =>
    `.sand-point-${i}{left:${p.x}px;top:${p.y}px;}`
  ).join('\n'), [points]);

  useEffect(() => {
    if (points.length > 200 && !cleaning) {
       onComplete(10, 'Sand Artist');
       setCleaning(true);
    }
  }, [points, onComplete, cleaning]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <style>{pointStyles}</style>
      <h2 className="text-3xl font-bold text-theme">Draw in the Magic Sand</h2>
      <div 
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPoints(p => [...p.slice(-300), { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        }}
        className="w-full h-[50vh] bg-[#F4D03F] rounded-[48px] relative overflow-hidden cursor-crosshair shadow-inner border-8 border-white/20"
      >
        <div className="absolute inset-0 bg-dots opacity-20" />
        {points.map((p, i) => (
          <div 
            key={i} 
            className={cn(`sand-point-${i} absolute rounded-full bg-[#D4AC0D]/40 blur-md w-10 h-10 -translate-x-1/2 -translate-y-1/2`)}
          />
        ))}
      </div>
      <p className="text-theme/50 italic">Move your hand to make patterns...</p>
    </div>
  );
}

// Rapid Tap Game (ADHD)
function RapidTapGame({ onComplete, reducedMotion }: any) {
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (started && timeLeft === 0) {
      onComplete(Math.floor(taps / 5), taps > 30 ? 'Turbo Fingers' : 'Fast Tapper');
    }
  }, [started, timeLeft, taps, onComplete]);

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="text-4xl font-black text-theme uppercase">Tap Fast! ⚡</h2>
      <div className="text-6xl font-black text-theme bg-white shadow-xl px-12 py-6 rounded-full">
        {timeLeft}s
      </div>
      <div className="text-center">
        <div className="text-8xl font-black text-primary-theme mb-4">{taps}</div>
        <p className="text-theme/40 font-bold uppercase tracking-widest">Taps</p>
      </div>
      {!started ? (
        <button onClick={() => setStarted(true)} className="bg-active-primary text-white px-12 py-6 rounded-3xl font-black text-2xl shadow-xl">START!</button>
      ) : (
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setTaps(t => t + 1)}
          className="w-48 h-48 bg-active-highlight rounded-full shadow-[0_15px_0_#D4AC0D] active:shadow-none active:translate-y-2 flex items-center justify-center text-4xl"
        >
          👆
        </motion.button>
      )}
    </div>
  );
}

// Mole Mash Game (ADHD)
function MoleMashGame({ onComplete, reducedMotion }: any) {
  const [score, setScore] = useState(0);
  const [activeMole, setActiveMole] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMole(Math.floor(Math.random() * 9));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (score >= 10) onComplete(10, 'Mole Masher');
  }, [score, onComplete]);

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="text-3xl font-bold text-theme">Mash 10 Moles! {score}/10</h2>
      <div className="grid grid-cols-3 gap-6 bg-theme/5 p-8 rounded-[48px]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-24 h-24 bg-theme/10 rounded-full relative overflow-hidden">
            <AnimatePresence>
              {activeMole === i && (
                <motion.button
                  initial={reducedMotion ? { opacity: 0 } : { y: 100 }}
                  animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { y: 100 }}
                  onClick={() => { setScore(s => s + 1); setActiveMole(null); }}
                  className="absolute inset-0 flex items-center justify-center text-5xl cursor-pointer"
                >
                  🐹
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// Gravity Blocks Game (AuDHD)
function GravityBlocksGame({ onComplete, reducedMotion }: any) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const blockStyles = useMemo(() => blocks.map((b) =>
    `.gravity-block-${b.id}{background-color:${b.color};}`
  ).join('\n'), [blocks]);

  const addBlock = () => {
    setBlocks(b => [...b, { 
      id: Date.now(), 
      x: Math.random() * 80 + 10, 
      color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A7D0CD'][Math.floor(Math.random() * 4)] 
    }]);
  };

  useEffect(() => {
    if (blocks.length >= 12) onComplete(15, 'Tower Builder');
  }, [blocks, onComplete]);

  return (
    <div className="flex flex-col items-center gap-8 w-full h-full">
      <style>{blockStyles}</style>
      <h2 className="text-3xl font-bold text-theme">Stack 12 Blocks!</h2>
      <div className="relative w-full max-w-md h-[400px] border-b-8 border-theme/20 flex flex-col-reverse items-center overflow-visible">
        {blocks.map((b, i) => (
          <motion.div
            key={b.id}
            initial={reducedMotion ? { opacity: 0 } : { y: -500, rotate: 10 }}
            animate={reducedMotion ? { opacity: 1 } : { y: 0, rotate: 0 }}
            className={cn(`gravity-block-${b.id} w-32 h-12 rounded-lg border-2 border-white shadow-lg flex items-center justify-center font-bold text-white mb-[-4px]`)}
          >
            BLOCK
          </motion.div>
        ))}
      </div>
      <button 
        onClick={addBlock}
        className="mt-10 bg-primary-theme text-white px-10 py-4 rounded-3xl font-black shadow-lg"
      >
        DROP BLOCK! 🏗️
      </button>
    </div>
  );
}
// 2. Sort by Color — multi-level palette (fixed hex colors so swatches always render)
const SORT_COLOR_HEX: Record<string, string> = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#ca8a04',
  orange: '#ea580c',
  purple: '#9333ea',
  pink: '#db2777',
  teal: '#0d9488'
};

function sortColorLabel(colorKey: string) {
  return colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
}

function SortColorsGame({ onComplete, reducedMotion }: any) {
  const levels = useMemo(() => ([
    { sequence: ['red', 'blue', 'green', 'blue', 'red'], choices: ['red', 'blue', 'green', 'yellow', 'orange'] as string[] },
    { sequence: ['yellow', 'purple', 'yellow', 'purple'], choices: ['yellow', 'purple', 'pink', 'teal'] },
    { sequence: ['orange', 'teal', 'orange', 'teal', 'orange'], choices: ['orange', 'teal', 'green', 'blue'] },
    { sequence: ['pink', 'purple', 'blue', 'pink'], choices: ['pink', 'purple', 'blue', 'red', 'teal'] },
    { sequence: ['green', 'yellow', 'red', 'yellow', 'green'], choices: ['green', 'yellow', 'red', 'orange', 'pink', 'blue'] },
    { sequence: ['teal', 'purple', 'teal', 'orange', 'teal'], choices: ['teal', 'purple', 'orange', 'yellow'] },
    { sequence: ['blue', 'pink', 'green', 'pink', 'blue', 'green'], choices: ['blue', 'pink', 'green', 'red', 'yellow', 'teal'] },
    { sequence: ['purple', 'red', 'orange', 'purple', 'red'], choices: ['purple', 'red', 'orange', 'blue'] },
    { sequence: ['yellow', 'teal', 'pink', 'teal', 'yellow', 'pink'], choices: ['yellow', 'teal', 'pink', 'purple', 'green'] },
    { sequence: ['orange', 'blue', 'green', 'blue', 'orange', 'green', 'blue'], choices: ['orange', 'blue', 'green', 'red', 'yellow', 'purple', 'pink', 'teal'] }
  ]), []);
  const [levelIdx, setLevelIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const totalLevels = levels.length;
  const level = levels[levelIdx];
  const target = level.sequence[stepIdx];
  const seqLen = level.sequence.length;

  const handlePick = (picked: string) => {
    if (picked !== target) return;
    if (stepIdx >= seqLen - 1) {
      if (levelIdx >= totalLevels - 1) {
        onComplete(15, 'Color Hero');
        return;
      }
      setLevelIdx((l) => l + 1);
      setStepIdx(0);
      return;
    }
    setStepIdx((s) => s + 1);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto px-2">
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 bg-amber-100 border border-amber-300 px-4 py-2 rounded-full">
        <span className="whitespace-nowrap">Color stage {levelIdx + 1}/{totalLevels}</span>
        <span className="hidden sm:inline text-slate-500">•</span>
        <span className="tabular-nums whitespace-nowrap">
          Tap {sortColorLabel(target)} · Step {stepIdx + 1}/{seqLen}
        </span>
      </div>
      <p className="text-center text-slate-700 font-bold text-sm max-w-md">
        Eight colors • Ten stages • Buttons always include the answer plus friendly distractors.
      </p>
      <h2 className="text-3xl font-bold text-theme">Sort by Color!</h2>
      <motion.div
        key={`${levelIdx}-${stepIdx}-${target}`}
        initial={reducedMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.35 }}
        className="w-36 h-36 sm:w-40 sm:h-40 rounded-[32px] shadow-2xl mb-10 ring-4 ring-white border-4 border-slate-200"
        style={{ backgroundColor: SORT_COLOR_HEX[target] }}
        role="img"
        aria-label={`Match color ${sortColorLabel(target)}`}
      />
      <div className="flex flex-wrap gap-4 justify-center">
        {level.choices.map((c) => (
          <motion.button
            key={`${levelIdx}-${stepIdx}-${c}`}
            type="button"
            title={sortColorLabel(c)}
            aria-label={`Choose ${sortColorLabel(c)}`}
            whileTap={reducedMotion ? {} : { scale: 0.9 }}
            onClick={() => handlePick(c)}
            className="w-14 h-14 sm:w-[4.75rem] sm:h-[4.75rem] rounded-2xl border-[3px] border-slate-800/10 shadow-xl ring-2 ring-white hover:brightness-105 transition-all"
            style={{ backgroundColor: SORT_COLOR_HEX[c] }}
          />
        ))}
      </div>
    </div>
  );
}

// 3. Pattern Game (multi-level)
type PatternLevelDef = { seq: string[]; answer: string; options: string[] };

function PatternGame({ onComplete, reducedMotion }: any) {
  const levels = useMemo<PatternLevelDef[]>(() => [
    { seq: ['🔴', '🟡', '🔴', '🟡'], answer: '🔴', options: ['🔴', '🟡', '🔵'] },
    { seq: ['⭐️', '🌙', '⭐️', '🌙'], answer: '⭐️', options: ['🌙', '⭐️', '☁️'] },
    { seq: ['🟩', '🟩', '🟨', '🟩', '🟩'], answer: '🟨', options: ['🟨', '🟩', '🟪'] },
    { seq: ['1️⃣', '2️⃣', '1️⃣', '2️⃣'], answer: '1️⃣', options: ['1️⃣', '3️⃣', '2️⃣'] },
    { seq: ['🍎', '🍌', '🍎', '🍌'], answer: '🍎', options: ['🍇', '🍎', '🍌'] },
    { seq: ['▲', '■', '▲', '■'], answer: '▲', options: ['▼', '▲', '●'] },
    { seq: ['🦊', '🐰', '🦊', '🐰'], answer: '🦊', options: ['🐻', '🦊', '🐰'] },
    { seq: ['⬛️', '⬜️', '⬜️', '⬛️', '⬜️', '⬜️'], answer: '⬛️', options: ['⬜️', '🟧', '⬛️'] }
  ], []);
  const [levelIdx, setLevelIdx] = useState(0);
  const total = levels.length;
  const level = levels[levelIdx];

  const pick = (opt: string) => {
    if (opt !== level.answer) return;
    if (levelIdx >= total - 1) {
      onComplete(12, 'Pattern Pro');
      return;
    }
    setLevelIdx((i) => i + 1);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-slate-700 bg-amber-100 border border-amber-300 px-4 py-2 rounded-full">
        <span>Pattern level</span>
        <span className="tabular-nums">{levelIdx + 1}</span>
        <span className="text-slate-500">/</span>
        <span className="tabular-nums">{total}</span>
        <span className="hidden sm:inline text-slate-600 normal-case tracking-normal ml-2">Finish all · +12 Stars</span>
      </div>
      <h2 className="text-3xl font-bold text-theme mb-4 text-center">What comes next?</h2>
      <div className="text-5xl sm:text-6xl flex flex-wrap justify-center gap-3 mb-12">
        {level.seq.map((p, i) => (
          <span key={`${levelIdx}-${i}`}>{p}</span>
        ))}
        <span className="border-b-4 border-theme w-16 text-center self-end">?</span>
      </div>
      <div className="flex flex-wrap gap-6 justify-center">
        {level.options.map((o) => (
          <button
            key={`${levelIdx}-${o}`}
            type="button"
            onClick={() => pick(o)}
            className={cn(
              "text-5xl bg-white p-6 rounded-3xl shadow-lg ring-2 ring-slate-900/10 transition-transform",
              !reducedMotion && "hover:scale-110 active:scale-95"
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// 4. Kitchen Mess (ADHD)
function KitchenMessGame({ onComplete, reducedMotion }: any) {
  const foods = ['🍎', '🍕', '🥯', '🥦', '🍦'];
  const [inBlender, setInBlender] = useState<string[]>([]);
  
  const addFood = (f: string) => {
     setInBlender(p => [...p, f]);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className={cn("text-4xl font-black text-theme uppercase italic", !reducedMotion && "animate-wiggle")}>Kitchen Mess! 🌪️</h2>
      <div className="relative w-64 h-80 bg-blue-100/50 rounded-b-full border-x-8 border-b-8 border-blue-400 flex flex-col items-center justify-end p-4">
          <div className="flex flex-wrap justify-center gap-2">
            {inBlender.map((f, i) => (
              <motion.span 
                animate={reducedMotion ? {} : { rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }} 
                key={i} 
                className="text-4xl"
              >
                {f}
              </motion.span>
            ))}
          </div>
          {inBlender.length > 5 && (
            <button onClick={() => onComplete(10, 'Chef Chaos')} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-full font-black animate-pulse">BLEND!!!</button>
          )}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {foods.map(f => <button key={f} onClick={() => addFood(f)} className="text-5xl hover:scale-150 transition-transform">{f}</button>)}
      </div>
    </div>
  );
}

// 5. Pet Popper (ADHD)
function PetPopperGame({ onComplete, reducedMotion }: any) {
  const [pops, setPops] = useState(0);
  const bubbles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: Math.random() * 80 + 10,
    top: Math.random() * 60 + 20,
    size: Math.random() * 40 + 40
  })), []);
  const [poppedIds, setPoppedIds] = useState<number[]>([]);
  const bubbleStyles = useMemo(() => bubbles.map((b) =>
    `.bubble-${b.id}{left:${b.left}%;top:${b.top}%;width:${b.size}px;height:${b.size}px;}`
  ).join('\n'), [bubbles]);

  const pop = (id: number) => {
    if (!poppedIds.includes(id)) {
      setPoppedIds(p => [...p, id]);
      setPops(p => p + 1);
      if (pops + 1 >= 10) setTimeout(() => onComplete(10, 'Bubble Popper'), 500);
    }
  };

  return (
    <div className="relative h-[60vh] w-full overflow-hidden">
        <style>{bubbleStyles}</style>
        <h2 className="text-center text-4xl font-black text-theme">Pop 10 Bubbles! {pops}/10</h2>
        {bubbles.map(b => !poppedIds.includes(b.id) && (
            <motion.button
              key={b.id}
              initial={reducedMotion ? { opacity: 0 } : { scale: 0 }}
              animate={reducedMotion ? { opacity: 1 } : { scale: 1 }}
              whileTap={reducedMotion ? {} : { scale: 1.5, opacity: 0 }}
              onClick={() => pop(b.id)}
              title="Pop bubble"
              aria-label="Pop bubble"
              className={cn(`bubble-${b.id} absolute bg-blue-300/40 border-2 border-white rounded-full shadow-inner`)}
            />
        ))}
    </div>
  );
}

// 6. Crazy Dress Up
function DressUpGame({ onComplete, reducedMotion }: any) {
  const accessories = ['🤠', '🕶️', '👑', '🎀', '🎧'];
  const [applied, setApplied] = useState<string[]>([]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-48 h-64 bg-secondary-theme rounded-full flex flex-col items-center justify-center">
          <div className="text-8xl">👶</div>
          <div className="absolute inset-0 flex flex-wrap justify-center items-center pointer-events-none">
             {applied.map((a, i) => <span key={i} className="text-5xl">{a}</span>)}
          </div>
      </div>
      <div className="flex gap-4">
        {accessories.map(a => (
          <button key={a} onClick={() => setApplied(p => [...p, a])} className={cn("text-4xl bg-white p-4 rounded-full shadow-lg h-20 w-20 flex items-center justify-center transition-transform", !reducedMotion && "hover:scale-125")}>
            {a}
          </button>
        ))}
      </div>
      {applied.length > 2 && (
        <button onClick={() => onComplete(5, 'Speed Star')} className="bg-primary-theme text-white px-8 py-3 rounded-full font-black text-xl">Looks Awesome!</button>
      )}
    </div>
  );
}

// 7. Dollhouse (AuDHD)
function DollhouseGame({ onComplete, isCalm, reducedMotion }: any) {
  const [items, setItems] = useState([
    { id: 1, char: '🧸', x: 20, y: 20 },
    { id: 2, char: '🪴', x: 70, y: 30 },
    { id: 3, char: '🐱', x: 40, y: 60 }
  ]);

  const move = (id: number) => {
     setItems(prev => prev.map(item => item.id === id ? { ...item, x: Math.random() * 80 + 10, y: Math.random() * 60 + 10 } : item));
  };
  const itemStyles = useMemo(() => items.map((item) =>
    `.dollhouse-item-${item.id}{left:${item.x}%;top:${item.y}%;}`
  ).join('\n'), [items]);

  return (
     <div className="relative h-[60vh] bg-white rounded-[40px] shadow-2xl border-8 border-primary-theme overflow-hidden">
        <style>{itemStyles}</style>
        <div className="absolute top-4 left-4 p-4 bg-canvas rounded-2xl font-bold text-theme">Living Room</div>
        {items.map(item => (
          <motion.button
            key={item.id}
            drag
            dragMomentum={!isCalm && !reducedMotion}
            onDragEnd={() => move(item.id)}
            animate={{ left: `${item.x}%`, top: `${item.y}%` }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: isCalm ? 100 : 300 }}
            className={cn(`dollhouse-item-${item.id} absolute text-7xl select-none cursor-grab active:cursor-grabbing`)}
          >
            {item.char}
          </motion.button>
        ))}
        <button onClick={() => onComplete(15, 'Master Decorator')} className="absolute bottom-6 right-6 bg-primary-theme text-white p-4 rounded-full shadow-lg">Done Playing</button>
     </div>
  );
}


// 3c. Emotion Match (multi-round)
function EmotionMatchGame({ onComplete, reducedMotion }: any) {
  const rounds = useMemo(() => ([
    { target: 'Happy', options: [{ label: 'Happy', emoji: '😊' }, { label: 'Sad', emoji: '😢' }, { label: 'Angry', emoji: '😠' }] },
    { target: 'Sad', options: [{ label: 'Sleepy', emoji: '😴' }, { label: 'Sad', emoji: '😢' }, { label: 'Surprised', emoji: '😮' }] },
    { target: 'Angry', options: [{ label: 'Calm', emoji: '😌' }, { label: 'Angry', emoji: '😠' }, { label: 'Happy', emoji: '😊' }] },
    { target: 'Sleepy', options: [{ label: 'Sad', emoji: '😢' }, { label: 'Sleepy', emoji: '😴' }, { label: 'Excited', emoji: '🤩' }] },
    { target: 'Surprised', options: [{ label: 'Surprised', emoji: '😮' }, { label: 'Bored', emoji: '😐' }, { label: 'Worried', emoji: '😟' }] },
    { target: 'Excited', options: [{ label: 'Calm', emoji: '😌' }, { label: 'Silly', emoji: '😜' }, { label: 'Excited', emoji: '🤩' }] },
    { target: 'Worried', options: [{ label: 'Brave', emoji: '😤' }, { label: 'Happy', emoji: '😊' }, { label: 'Worried', emoji: '😟' }] },
    { target: 'Calm', options: [{ label: 'Calm', emoji: '😌' }, { label: 'Angry', emoji: '😠' }, { label: 'Surprised', emoji: '😮' }] }
  ]), []);
  const [roundIdx, setRoundIdx] = useState(0);
  const round = rounds[roundIdx];

  const pick = (label: string) => {
    if (label !== round.target) return;
    if (roundIdx >= rounds.length - 1) {
      onComplete(10, 'Friend Finder');
      return;
    }
    setRoundIdx((i) => i + 1);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-slate-700 bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-full">
        <span>Emotion round</span>
        <span className="tabular-nums">{roundIdx + 1}</span>
        <span className="text-slate-500">/</span>
        <span className="tabular-nums">{rounds.length}</span>
        <span className="hidden sm:inline normal-case tracking-normal ml-2 text-slate-600">Tap the matching face</span>
      </div>
      <h2 className="text-3xl font-black text-theme text-center">
        FIND THE{' '}
        <span className="text-emerald-800 underline decoration-emerald-300 decoration-4 underline-offset-4">
          {round.target.toUpperCase()}
        </span>
        {' '}FACE!
      </h2>
      <div className="flex flex-wrap gap-6 justify-center max-w-xl">
        {round.options.map((o) => (
          <motion.button 
            key={`${roundIdx}-${o.label}`}
            whileTap={reducedMotion ? {} : { scale: 0.92 }}
            onClick={() => pick(o.label)}
            className={cn(
              "text-8xl bg-white p-8 rounded-[40px] shadow-xl ring-2 ring-slate-900/10 transition-transform",
              !reducedMotion && "hover:scale-110"
            )}
            type="button"
            aria-label={o.label}
          >
            {o.emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// 6b. Rocket Blast (ADHD)
function RocketBlastGame({ onComplete, reducedMotion }: any) {
  const [power, setPower] = useState(0);
  
  useEffect(() => {
    if (power >= 100) onComplete(10, 'Rocket Ace');
  }, [power, onComplete]);

  return (
    <div className="flex flex-col items-center justify-end h-[60vh] gap-10">
       <motion.div 
         animate={{ y: power > 0 ? -power * 4 : 0 }} 
         className="text-9xl relative"
       >
         🚀
         {power > 80 && <motion.div animate={reducedMotion ? { opacity: 0.8 } : { opacity: [0, 1, 0] }} transition={reducedMotion ? {} : { repeat: Infinity }} className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-4xl">🔥</motion.div>}
       </motion.div>
       <div className="w-64 h-8 bg-canvas border-4 border-white rounded-full overflow-hidden">
          <motion.div animate={{ width: `${power}%` }} className="h-full bg-red-500" />
       </div>
       <button 
         onClick={() => setPower(p => p + 5)}
         className={cn("bg-active-highlight text-theme font-black p-10 rounded-full shadow-2xl text-2xl uppercase", !reducedMotion && "animate-bounce")}
       >
         Tap to Launch!
       </button>
    </div>
  );
}

// 6c. Glow Doodle (ADHD)
function GlowDoodleGame({ onComplete, reducedMotion }: any) {
  const [points, setPoints] = useState<any[]>([]);
  const pointStyles = useMemo(() => points.map((p, i) =>
    `.glow-point-${i}{left:${p.x}px;top:${p.y}px;}`
  ).join('\n'), [points]);
  
  return (
    <div className="flex flex-col items-center gap-8">
       <style>{pointStyles}</style>
       <div 
         onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPoints(p => [...p.slice(-50), { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
         }}
         className="w-full h-[50vh] bg-slate-900 rounded-[40px] relative overflow-hidden cursor-crosshair border-8 border-active-highlight shadow-[0_0_50px_rgba(255,230,109,0.3)]"
       >
          {points.map((p, i) => (
            <motion.div 
              key={i} 
              initial={reducedMotion ? { opacity: 0 } : { scale: 0 }} 
              animate={reducedMotion ? { opacity: 1 } : { scale: [1, 0] }} 
              className={cn(`glow-point-${i} absolute w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_20px_#4ECDC4] -translate-x-1/2 -translate-y-1/2`)}
            />
          ))}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-bold text-xl pointer-events-none">Wiggle your mouse!</div>
       </div>
       <button onClick={() => onComplete(10, 'Glow Artist')} className="bg-active-highlight text-theme px-8 py-3 rounded-full font-black">I done my art!</button>
    </div>
  );
}

// 8. Music Lab (AuDHD)
function MusicLabGame({ isCalm, onComplete, reducedMotion }: any) {
  const pads = [
    { sound: 'Ping', color: 'bg-blue-400' },
    { sound: 'Ting', color: 'bg-green-400' },
    { sound: 'Pong', color: 'bg-purple-400' },
    { sound: 'Boop', color: 'bg-red-400' }
  ];

  return (
    <div className="flex flex-col items-center gap-10">
       <h2 className="text-4xl font-black text-theme">Make some Noise! 🎵</h2>
       <div className="grid grid-cols-2 gap-8">
         {pads.map((p, i) => (
           <motion.button
             key={i}
             whileHover={reducedMotion ? {} : { scale: 1.1 }}
             whileTap={reducedMotion ? {} : { scale: 0.9, rotate: isCalm ? 0 : 15 }}
             className={cn("w-40 h-40 rounded-[40px] shadow-2xl flex items-center justify-center text-white font-black text-2xl", p.color)}
           >
             {p.sound}
           </motion.button>
         ))}
       </div>
       <button onClick={() => onComplete(15, 'Music Maker')} className="bg-primary-theme text-white px-10 py-4 rounded-full font-bold">Finish Concert</button>
    </div>
  );
}

// 9. Star Builder (AuDHD)
function StarBuilderGame({ isCalm, onComplete, reducedMotion }: any) {
  const [stars, setStars] = useState<{ x: number, y: number }[]>([]);
  const starStyles = useMemo(() => stars.map((s, i) =>
    `.astro-star-${i}{left:${s.x}px;top:${s.y}px;}`
  ).join('\n'), [stars]);

  return (
    <div className="flex flex-col items-center gap-8">
       <style>{starStyles}</style>
       <div 
         onClick={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           setStars(s => [...s, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
         }}
         className="w-full h-[50vh] bg-slate-800 rounded-[40px] relative cursor-pointer border-4 border-white/20"
       >
          <svg className="absolute inset-0 w-full h-full">
            {stars.map((s, i) => i > 0 && (
              <line key={i} x1={stars[i-1].x} y1={stars[i-1].y} x2={s.x} y2={s.y} stroke="white" strokeWidth="2" strokeDasharray={isCalm ? "5,5" : "0"} />
            ))}
          </svg>
          {stars.map((s, i) => (
            <motion.div 
              key={i} 
              initial={reducedMotion ? { opacity: 0 } : { scale: 0 }} 
              animate={reducedMotion ? { opacity: 1 } : { scale: 1 }} 
              className={cn(`astro-star-${i} absolute -translate-x-1/2 -translate-y-1/2 text-yellow-300 text-2xl`)}
            >
              ⭐
            </motion.div>
          ))}
          <div className="absolute top-4 left-4 text-white text-sm opacity-50">Tap to draw a constellation!</div>
       </div>
       <button onClick={() => onComplete(15, 'Master Astronomer')} className="bg-primary-theme text-white px-8 py-3 rounded-full font-black">All Done!</button>
    </div>
  );
}


function VideoGallery({ items, isCalm, reducedMotion, onSetStars, section, mode }: any) {
  const [activeQuiz, setActiveQuiz] = useState<any>(null);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-grid"
      >
        {items.map((v: any) => (
          <motion.div 
            key={v.id} 
            whileHover={reducedMotion ? {} : { y: -8 }}
            className={cn(
              "glass-card p-6 rounded-[40px] transition-all flex flex-col group",
              !isCalm && !reducedMotion && "hover:rotate-1"
            )}
          >
            <div className="aspect-video mb-6 overflow-hidden rounded-[32px] bg-slate-900 shadow-inner group-hover:shadow-2xl transition-all relative">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&controls=1`}
                title={v.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 pointer-events-none border-4 border-white/10 rounded-[32px]" />
            </div>
            
            <h4 className="text-2xl font-display font-black text-theme mb-3 px-2 tracking-tight group-hover:text-primary-theme transition-colors">
              {v.title}
            </h4>
            
            {v.description && (
              <div className="mb-6 grow">
                 <InteractiveText 
                   text={v.description} 
                   hotwords={v.hotwords || []} 
                   isCalm={isCalm} 
                   reducedMotion={reducedMotion}
                   onWordClick={(word: string) => {
                     const clean = word.replace(/[.,]/g, '').toLowerCase();
                     if (v.quizzes && v.quizzes[clean]) {
                       setActiveQuiz(v.quizzes[clean]);
                     }
                   }}
                 />
              </div>
            )}

            <div className="flex items-center justify-between px-2 pt-4 border-t border-theme/5">
               <div className="flex gap-2">
                 {isCalm ? (
                   <span className="text-[10px] uppercase font-black tracking-widest text-theme/40 bg-theme/5 px-3 py-1 rounded-full">Calm Viewing</span>
                 ) : (
                   <button className="text-[10px] uppercase font-black tracking-widest bg-active-primary/20 text-active-text px-3 py-1 rounded-full group-hover:bg-active-primary/30 transition-all">
                     Turbo Mode
                   </button>
                 )}
               </div>
               <CheckCircle2 size={24} className="text-primary-theme opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <RelatedVideosSection
        title="Related Real-World Project Videos"
        videos={getModeAwareVideos(mode, section)}
        mode={mode}
        reducedMotion={reducedMotion}
      />

      <AnimatePresence>
        {activeQuiz && (
          <WordQuizPopup 
            quiz={activeQuiz} 
            isCalm={isCalm} 
            onClose={() => setActiveQuiz(null)} 
            onCorrect={() => onSetStars(2)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function RelatedVideosSection({
  title,
  videos,
  mode,
  reducedMotion
}: {
  title: string;
  videos: RelatedVideoItem[];
  mode: AppMode;
  reducedMotion: boolean;
}) {
  if (!videos?.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12"
    >
      <div className="flex items-center gap-3 mb-5">
        <Video size={22} className="text-theme" />
        <h3 className="text-2xl font-display font-black text-theme tracking-tight">{title}</h3>
      </div>
      <p className="text-sm text-theme/60 mb-6">
        Curated for <b>{mode}</b> learners using publicly accessible YouTube videos from established tutorial channels.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {videos.map((video) => (
          <motion.article
            key={video.id}
            whileHover={reducedMotion ? {} : { y: -6 }}
            className="glass-card p-5 rounded-[28px] border border-white/30"
          >
            <div className="aspect-video mb-4 overflow-hidden rounded-2xl bg-slate-900">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1&playsinline=1&controls=1`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <h4 className="text-base font-black text-theme mb-2 leading-snug">{video.title}</h4>
            <p className="text-sm text-theme/60">{video.focus}</p>
            <p className="text-[11px] text-theme/40 mt-2 uppercase tracking-wider">{video.source}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function InteractiveText({ text, hotwords, isCalm, reducedMotion, onWordClick }: { text: string, hotwords: string[], isCalm: boolean, reducedMotion: boolean, onWordClick?: (w: string) => void }) {
  const words = text.split(' ');
  
  return (
    <p className="text-theme/70 text-sm leading-relaxed px-2">
      {words.map((word, i) => {
        const cleanWord = word.replace(/[.,]/g, '').toLowerCase();
        const isHot = hotwords.includes(cleanWord);
        
        if (isHot) {
          return (
            <motion.span 
              key={i}
              whileTap={reducedMotion ? {} : { scale: 1.4, rotate: isCalm ? 0 : 10 }}
              onClick={() => onWordClick?.(word)}
              className={cn(
                "inline-block font-bold cursor-pointer rounded px-1 transition-all mx-0.5",
                isCalm 
                  ? "text-[#A7D0CD] hover:bg-[#A7D0CD]/10 active:shadow-[0_0_15px_rgba(167,208,205,0.5)]" 
                  : "text-[#FF6B6B] hover:bg-[#FF6B6B]/10 underline decoration-wavy decoration-[#FF6B6B]/50 active:shadow-[0_0_20px_rgba(255,107,107,0.6)]"
              )}
              title="Touch me!"
            >
              {word}
            </motion.span>
          );
        }
        return <span key={i}>{word} </span>;
      })}
    </p>
  );
}

function WordQuizPopup({ quiz, isCalm, onClose, onCorrect }: any) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    setIsAnswered(true);
    if (idx === quiz.c) {
      onCorrect();
    }
    setTimeout(onClose, isCalm ? 2000 : 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={cn(
          "max-w-md w-full p-8 rounded-[40px] shadow-2xl relative",
          isCalm ? "bg-white" : "bg-active-highlight border-4 border-white"
        )}
      >
        <h3 className={cn("text-2xl font-bold mb-8 text-center", isCalm ? "text-slate-900" : "text-slate-900")}>{quiz.q}</h3>
        <div className="space-y-4">
          {quiz.a.map((opt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={cn(
                "w-full p-4 rounded-2xl text-lg font-bold transition-all flex items-center justify-between border-2",
                selected === idx
                  ? idx === quiz.c ? "bg-emerald-500 text-white border-emerald-700" : "bg-red-500 text-white border-red-700"
                  : isAnswered && idx === quiz.c ? "bg-emerald-200 text-emerald-900 border-emerald-500" : "bg-white text-slate-900 hover:bg-slate-50 border-slate-300"
              )}
            >
              {opt}
              {isAnswered && idx === quiz.c && <CheckCircle2 size={24} />}
              {isAnswered && selected === idx && idx !== quiz.c && <XCircle size={24} />}
            </button>
          ))}
        </div>
        {isAnswered && selected === quiz.c && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="mt-6 flex flex-col items-center gap-2"
          >
             <Star className="text-yellow-500 fill-yellow-500 animate-bounce" size={40} />
             <p className="font-black text-slate-900 text-xl uppercase italic">Correct! +2 Stars</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
