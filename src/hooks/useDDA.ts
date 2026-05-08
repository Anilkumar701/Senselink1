import { useState, useEffect, useCallback } from 'react';

export type GameResult = 'WIN' | 'LOSS';

interface GameAttempt {
  gameId: string;
  result: GameResult;
  timestamp: number;
  reactionTime?: number;
  mode?: string;
}

export function useDDA() {
  const [history, setHistory] = useState<GameAttempt[]>([]);
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1.0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showPracticePrompt, setShowPracticePrompt] = useState(false);
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [ddaTriggerCount, setDdaTriggerCount] = useState(0);

  // Load history and stats from local storage
  useEffect(() => {
    const saved = localStorage.getItem('senselink-dda-history');
    const savedCount = localStorage.getItem('senselink-dda-trigger-count');
    if (saved) setHistory(JSON.parse(saved));
    if (savedCount) setDdaTriggerCount(parseInt(savedCount));
  }, []);

  // Save history and analyze patterns
  useEffect(() => {
    localStorage.setItem('senselink-dda-history', JSON.stringify(history));
    localStorage.setItem('senselink-dda-trigger-count', ddaTriggerCount.toString());

    if (history.length === 0) return;

    const recent = history.slice(-5);
    const lastThree = history.slice(-3);

    // Rule: 3 consecutive fails
    if (lastThree.length === 3 && lastThree.every(h => h.result === 'LOSS')) {
      if (difficultyMultiplier > 0.7) {
        setDifficultyMultiplier(0.7); // Reduce speed by 30%
        setShowPracticePrompt(true);
        setDdaTriggerCount(c => c + 1);
        logDDAEvent('DIFFICULTY_REDUCED', { reason: '3_CONSECUTIVE_LOSSES', newMultiplier: 0.7 });
      }
    }

    // Rule: 5 consecutive wins
    if (recent.length === 5 && recent.every(h => h.result === 'WIN')) {
      if (difficultyMultiplier < 1.2) {
        setDifficultyMultiplier(1.1); // Increase difficulty slightly
        setIsChallengeMode(true);
        logDDAEvent('DIFFICULTY_INCREASED', { reason: '5_CONSECUTIVE_WINS', newMultiplier: 1.1 });
      }
    }
  }, [history]);

  const logDDAEvent = (type: string, data: any) => {
    console.log(`[DDA Analytics] ${type}:`, { ...data, timestamp: Date.now() });
    // In a real app, this would send to a server or analytics provider
  };

  const recordAttempt = useCallback((gameId: string, result: GameResult, mode?: string, reactionTime?: number) => {
    const attempt: GameAttempt = { gameId, result, timestamp: Date.now(), mode, reactionTime };
    setHistory(prev => [...prev, attempt]);
    logDDAEvent('GAME_ATTEMPT', attempt);
  }, []);

  const resetDifficulty = () => {
    setDifficultyMultiplier(1.0);
    setIsPracticeMode(false);
    setIsChallengeMode(false);
    setShowPracticePrompt(false);
  };

  return {
    difficultyMultiplier,
    isPracticeMode,
    setIsPracticeMode,
    showPracticePrompt,
    setShowPracticePrompt,
    isChallengeMode,
    recordAttempt,
    resetDifficulty,
    ddaTriggerCount,
    history
  };
}
