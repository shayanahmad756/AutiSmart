/**
 * PatternBuilderGame.jsx
 * Autism-friendly pattern recognition game for children aged 8–10.
 * 15 levels: ABAB (easy) → ABCABC (medium) → AAB/ABB/AABB/ABBC (hard).
 * No timers, no pressure. Gentle feedback, hint system, reward stars, free play mode.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import '../styles/patternBuilder.css';

// ─── Shape / color token definitions ────────────────────────────────────────
// Each token has a unique id, an emoji for display, and a label for accessibility.
const TOKENS = [
  { id: 'red-circle',    emoji: '🔴', label: 'Red Circle' },
  { id: 'blue-circle',   emoji: '🔵', label: 'Blue Circle' },
  { id: 'yellow-circle', emoji: '🟡', label: 'Yellow Circle' },
  { id: 'green-square',  emoji: '🟩', label: 'Green Square' },
  { id: 'orange-square', emoji: '🟧', label: 'Orange Square' },
  { id: 'purple-circle', emoji: '🟣', label: 'Purple Circle' },
  { id: 'star',          emoji: '⭐', label: 'Star' },
  { id: 'heart',         emoji: '💜', label: 'Heart' },
  { id: 'triangle',      emoji: '🔺', label: 'Red Triangle' },
  { id: 'blue-diamond',  emoji: '🔷', label: 'Blue Diamond' },
  { id: 'white-circle',  emoji: '⬜', label: 'White Square' },
  { id: 'brown-circle',  emoji: '🟤', label: 'Brown Circle' },
];

// Helper: get token by id
const token = (id) => TOKENS.find((t) => t.id === id);

// ─── Level definitions ───────────────────────────────────────────────────────
// "pattern" = the repeating unit (array of token ids).
// The game shows [pattern x2 + first N items of pattern] then ❓ for the next expected.
// "visibleCount" = how many items of the sequence the child sees before the blank.
// "answerIndex"  = which position in the repeating pattern is the blank (0-based).
//
// Structure: { id, difficulty, patternType, units, showCount }
//   units:     token ids making up one repeat cycle
//   showCount: how many tokens to show (blank is always the next one after showCount)
const LEVELS = [
  // ── Easy: ABAB (2-item repeat) ─────────────────────────
  { id: 1,  difficulty: 'Easy',   tag: 'ABAB',   units: ['red-circle',    'blue-circle'],                        showCount: 4, timeLimit: 30 },
  { id: 2,  difficulty: 'Easy',   tag: 'ABAB',   units: ['yellow-circle', 'green-square'],                       showCount: 4, timeLimit: 30 },
  { id: 3,  difficulty: 'Easy',   tag: 'ABAB',   units: ['star',          'heart'],                              showCount: 4, timeLimit: 30 },
  { id: 4,  difficulty: 'Easy',   tag: 'ABAB',   units: ['blue-circle',   'orange-square'],                      showCount: 5, timeLimit: 30 },
  { id: 5,  difficulty: 'Easy',   tag: 'ABAB',   units: ['red-circle',    'yellow-circle'],                      showCount: 5, timeLimit: 30 },
  // ── Medium: ABCABC (3-item repeat) ────────────────────
  { id: 6,  difficulty: 'Medium', tag: 'ABCABC', units: ['star',          'green-square',  'red-circle'],        showCount: 5, timeLimit: 25 },
  { id: 7,  difficulty: 'Medium', tag: 'ABCABC', units: ['blue-circle',   'yellow-circle', 'triangle'],          showCount: 5, timeLimit: 25 },
  { id: 8,  difficulty: 'Medium', tag: 'ABCABC', units: ['heart',         'star',          'blue-diamond'],      showCount: 6, timeLimit: 25 },
  { id: 9,  difficulty: 'Medium', tag: 'ABCABC', units: ['orange-square', 'purple-circle', 'green-square'],      showCount: 7, timeLimit: 25 },
  { id: 10, difficulty: 'Medium', tag: 'ABCABC', units: ['red-circle',    'blue-diamond',  'yellow-circle'],     showCount: 7, timeLimit: 25 },
  // ── Hard: AAB / ABB / AABB / ABBC ─────────────────────
  { id: 11, difficulty: 'Hard',   tag: 'AAB',    units: ['red-circle',    'red-circle',    'blue-circle'],       showCount: 6, timeLimit: 20 },
  { id: 12, difficulty: 'Hard',   tag: 'ABB',    units: ['star',          'heart',         'heart'],             showCount: 6, timeLimit: 20 },
  { id: 13, difficulty: 'Hard',   tag: 'AABB',   units: ['blue-circle',   'blue-circle',   'yellow-circle', 'yellow-circle'],   showCount: 6, timeLimit: 20 },
  { id: 14, difficulty: 'Hard',   tag: 'ABBC',   units: ['triangle',      'blue-diamond',  'blue-diamond', 'red-circle'],       showCount: 7, timeLimit: 20 },
  { id: 15, difficulty: 'Hard',   tag: 'ABBC',   units: ['purple-circle', 'orange-square', 'orange-square', 'green-square'],    showCount: 8, timeLimit: 20 },
];

// ─── Expand a level into a visible sequence + correct answer ─────────────────
function buildSequence(level) {
  const { units, showCount } = level;
  // Build a long enough repeating sequence
  const full = [];
  while (full.length <= showCount + 1) {
    units.forEach((id) => full.push(id));
  }
  const visible = full.slice(0, showCount);        // items the child sees
  const answer  = full[showCount];                  // the blank item
  return { visible, answer };
}

// ─── Generate distractor choices ────────────────────────────────────────────
// Returns an array of 4 token ids: 1 correct + 3 unique distractors from TOKENS.
function buildChoices(answer, units) {
  const pool = TOKENS.filter((t) => t.id !== answer).sort(() => Math.random() - 0.5);
  const distractors = pool.slice(0, 3).map((t) => t.id);
  const choices = [...distractors, answer].sort(() => Math.random() - 0.5);
  return choices;
}

// ─── Web Audio helper ────────────────────────────────────────────────────────
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) { /* silently ignore if AudioContext unavailable */ }
}

function playCorrect() {
  playTone(523, 0.15);
  setTimeout(() => playTone(659, 0.15), 120);
  setTimeout(() => playTone(784, 0.25), 240);
}
function playWrong() {
  playTone(294, 0.3, 'sawtooth', 0.15);
}
function playLevelComplete() {
  [523, 587, 659, 698, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.2), i * 130));
}

// ─── Stars calculation ───────────────────────────────────────────────────────
// 3 stars = correct first try, no hint.   2 stars = hint used or 1 wrong.   1 star = 2+ wrongs.
function calcStars(wrongCount, hintUsed) {
  if (wrongCount === 0 && !hintUsed) return 3;
  if (wrongCount <= 1 || hintUsed) return 2;
  return 1;
}

// ─── Phase constants ─────────────────────────────────────────────────────────
const PHASE = {
  START:         'start',
  PLAYING:       'playing',
  CORRECT:       'correct',
  WRONG:         'wrong',
  LEVEL_DONE:    'levelDone',
  GAME_DONE:     'gameDone',
  FREE_PLAY:     'freePlay',
};

// ─── Main component ──────────────────────────────────────────────────────────
const PatternBuilderGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { autoStart, maxLevel } = location.state || {};
  const { selectedChild, recordActivity } = useChild();

  // ── Persistent progress: save/load from localStorage ──
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('patternBuilderProgress');
      return saved ? JSON.parse(saved) : {};
      // shape: { [levelId]: starsEarned }
    } catch { return {}; }
  });

  const saveProgress = useCallback((levelId, stars) => {
    setProgress((prev) => {
      const next = { ...prev, [levelId]: Math.max(prev[levelId] || 0, stars) };
      localStorage.setItem('patternBuilderProgress', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Game state ──────────────────────────────────────────
  const [phase, setPhase]               = useState(PHASE.START);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);   // 0–14
  const [sequence, setSequence]         = useState({ visible: [], answer: '' });
  const [choices, setChoices]           = useState([]);
  const [wrongCount, setWrongCount]     = useState(0);
  const [timeLeft, setTimeLeft]         = useState(30);
  const [gameFailed, setGameFailed]     = useState(false);
  const [hintUsed, setHintUsed]         = useState(false);
  const [hintActive, setHintActive]     = useState(false);     // highlight state
  const [wrongId, setWrongId]           = useState(null);      // id of shaking tile
  const [levelStars, setLevelStars]     = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalStars, setTotalStars]     = useState(0);

  // Free-play state
  const [freePlaySequence, setFreePlaySequence] = useState([]);

  const hintTimerRef = useRef(null);
  const wrongTimerRef = useRef(null);
  const timerRef = useRef(null);

  // Derived
  const level = LEVELS[currentLevelIdx];

  // ── Sound wrapper ──────────────────────────────────────
  const sound = useCallback((fn) => { if (soundEnabled) fn(); }, [soundEnabled]);

  // ── Load a level into playing state ───────────────────
  const loadLevel = useCallback((idx) => {
    const lvl = LEVELS[idx];
    const seq = buildSequence(lvl);
    const ch  = buildChoices(seq.answer, lvl.units);
    setCurrentLevelIdx(idx);
    setSequence(seq);
    setChoices(ch);
    setWrongCount(0);
    setHintUsed(false);
    setHintActive(false);
    setWrongId(null);
    setLevelStars(0);
    setTimeLeft(LEVELS[idx].timeLimit);
    setGameFailed(false);
    setPhase(PHASE.PLAYING);
  }, []);

  // ── Total stars from progress ──────────────────────────
  useEffect(() => {
    const sum = Object.values(progress).reduce((a, b) => a + b, 0);
    setTotalStars(sum);
  }, [progress]);

  // ── Auto-start when navigated from Games page ──────────
  useEffect(() => {
    if (autoStart) loadLevel(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown timer ────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.PLAYING) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameFailed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Cleanup timers on unmount ──────────────────────────
  useEffect(() => () => {
    clearTimeout(hintTimerRef.current);
    clearTimeout(wrongTimerRef.current);
    clearInterval(timerRef.current);
  }, []);

  // ── Handle answer selection ────────────────────────────
  const handleAnswer = useCallback((choiceId) => {
    if (phase !== PHASE.PLAYING) return;

    if (choiceId === sequence.answer) {
      // Correct!
      clearTimeout(hintTimerRef.current);
      setHintActive(false);
      const stars = calcStars(wrongCount, hintUsed);
      setLevelStars(stars);
      sound(playCorrect);
      saveProgress(level.id, stars);

      // Record activity
      if (selectedChild) {
        recordActivity({
          activityType: 'game',
          activityName: 'Pattern Builder',
          score: stars * 33,
          maxScore: 100,
          percentage: stars * 33,
          duration: 0,
          attempts: wrongCount + 1,
          difficulty: level.difficulty.toLowerCase(),
          correctAnswers: 1,
          incorrectAnswers: wrongCount,
          details: {
            level: level.id,
            patternType: level.tag,
            hintUsed,
          },
        }).catch(() => {});
      }

      setPhase(PHASE.CORRECT);
      setTimeout(() => {
        const maxId = maxLevel != null ? maxLevel : 15;
        if (level.id >= maxId || level.id === 15) {
          setPhase(PHASE.GAME_DONE);
          sound(playLevelComplete);
        } else {
          setPhase(PHASE.LEVEL_DONE);
          sound(playLevelComplete);
        }
      }, 900);

    } else {
      // Wrong
      sound(playWrong);
      setWrongId(choiceId);
      setWrongCount((c) => c + 1);
      setPhase(PHASE.WRONG);
      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => {
        setWrongId(null);
        setPhase(PHASE.PLAYING);
      }, 700);
    }
  }, [phase, sequence.answer, wrongCount, hintUsed, level, sound, saveProgress, selectedChild, recordActivity]);

  // ── Hint ──────────────────────────────────────────────
  const handleHint = useCallback(() => {
    if (hintActive || phase !== PHASE.PLAYING) return;
    setHintUsed(true);
    setHintActive(true);
    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintActive(false), 2500);
  }, [hintActive, phase]);

  // ── Next level ────────────────────────────────────────
  const handleNextLevel = useCallback(() => {
    const maxIdx = maxLevel != null ? maxLevel - 1 : LEVELS.length - 1;
    if (currentLevelIdx + 1 > maxIdx) {
      setPhase(PHASE.GAME_DONE);
      sound(playLevelComplete);
    } else {
      loadLevel(currentLevelIdx + 1);
    }
  }, [currentLevelIdx, loadLevel, sound]);

  // ── Replay current level ──────────────────────────────
  const handleReplay = useCallback(() => {
    loadLevel(currentLevelIdx);
  }, [currentLevelIdx, loadLevel]);

  // ── Retry after time-up ───────────────────────────────
  const retryLevel = useCallback(() => {
    setGameFailed(false);
    loadLevel(currentLevelIdx);
  }, [currentLevelIdx, loadLevel]);

  // ── Star badge component ──────────────────────────────
  const StarBadge = ({ count, size = 'md' }) => (
    <div className={`pb-star-row pb-star-row--${size}`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`pb-star ${n <= count ? 'pb-star--filled' : 'pb-star--empty'}`}>★</span>
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="pb-container">

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="pb-topbar">
        <button className="pb-btn pb-btn--back" onClick={() => navigate('/games')}>
          <i className="bi bi-arrow-left"></i> Back to Games
        </button>

        <h1 className="pb-title">
          <span className="pb-title-icon">🧩</span> Pattern Builder
        </h1>

        <div className="pb-topbar-right">
          {/* Total stars */}
          <div className="pb-total-stars" title="Total stars earned">
            ⭐ {totalStars}
          </div>

          {/* Sound toggle */}
          <button
            className={`pb-btn pb-btn--icon ${soundEnabled ? 'pb-btn--active' : ''}`}
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'Sound on – click to mute' : 'Sound off – click to unmute'}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* ── START SCREEN ─────────────────────────────────── */}
      {phase === PHASE.START && (
        <div className="pb-screen pb-screen--center">
          <div className="pb-card pb-card--wide">
            <div className="pb-start-emoji">🧩</div>
            <h2 className="pb-heading">Pattern Builder</h2>
            <p className="pb-subtext">
              Look at the pattern and find the missing piece!<br />
              Complete all <strong>15 levels</strong> to become a Pattern Master!
            </p>

            {/* Difficulty legend */}
            <div className="pb-legend">
              <span className="pb-pill pb-pill--easy">Levels 1–5: Easy</span>
              <span className="pb-pill pb-pill--medium">Levels 6–10: Medium</span>
              <span className="pb-pill pb-pill--hard">Levels 11–15: Hard</span>
            </div>

            <div className="pb-start-btns">
              <button className="pb-btn pb-btn--primary pb-btn--lg" onClick={() => loadLevel(0)}>
                <i className="bi bi-play-fill"></i> Start Game
              </button>
              <button className="pb-btn pb-btn--accent pb-btn--lg" onClick={() => setPhase(PHASE.FREE_PLAY)}>
                <i className="bi bi-brush"></i> Free Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAYING / CORRECT / WRONG SCREENS ───────────── */}
      {(phase === PHASE.PLAYING || phase === PHASE.CORRECT || phase === PHASE.WRONG) && (
        <div className="pb-screen">
          {/* Level info strip */}
          <div className="pb-level-strip">
            <span className={`pb-pill pb-pill--${level.difficulty.toLowerCase()}`}>
              {level.difficulty}
            </span>
            <span className="pb-level-label">Level {level.id} / 15</span>
            <span className="pb-tag">{level.tag}</span>
            <span style={{
              background: timeLeft <= 10 ? '#fee2e2' : '#e8f9f6',
              color: timeLeft <= 10 ? '#dc2626' : '#059669',
              fontWeight: '800', borderRadius: '20px', padding: '4px 14px',
              fontSize: '0.9rem', transition: 'background 0.3s, color 0.3s'
            }}>⏱ {timeLeft}s</span>

            {/* Progress dots */}
            <div className="pb-progress-dots">
              {LEVELS.map((l) => (
                <span
                  key={l.id}
                  className={`pb-dot ${l.id < level.id ? 'pb-dot--done' : l.id === level.id ? 'pb-dot--current' : 'pb-dot--future'}`}
                />
              ))}
            </div>
          </div>

          {/* Main card */}
          <div className="pb-card">
            <p className="pb-instruction">What comes next?</p>

            {/* Pattern sequence */}
            <div className="pb-sequence" role="list" aria-label="Pattern sequence">
              {sequence.visible.map((id, i) => {
                const t = token(id);
                return (
                  <div key={i} className="pb-token pb-token--show" role="listitem" aria-label={t?.label}>
                    <span className="pb-emoji">{t?.emoji}</span>
                  </div>
                );
              })}

              {/* Blank / feedback */}
              <div
                className={`pb-token pb-token--blank ${phase === PHASE.CORRECT ? 'pb-token--correct' : ''}`}
                aria-label="Missing item"
              >
                {phase === PHASE.CORRECT
                  ? <span className="pb-emoji">{token(sequence.answer)?.emoji}</span>
                  : <span className="pb-question">?</span>
                }
              </div>
            </div>

            {/* Choices */}
            <div className="pb-choices" role="group" aria-label="Answer choices">
              {choices.map((id) => {
                const t = token(id);
                const isCorrectChoice = id === sequence.answer;
                const isWrong = id === wrongId;
                const isHinted = hintActive && isCorrectChoice;
                return (
                  <button
                    key={id}
                    className={`pb-choice
                      ${isHinted  ? 'pb-choice--hint'    : ''}
                      ${isWrong   ? 'pb-choice--wrong'   : ''}
                      ${phase === PHASE.CORRECT && isCorrectChoice ? 'pb-choice--correct' : ''}
                    `}
                    onClick={() => handleAnswer(id)}
                    disabled={phase === PHASE.CORRECT || phase === PHASE.WRONG}
                    aria-label={t?.label}
                  >
                    <span className="pb-choice-emoji">{t?.emoji}</span>
                    <span className="pb-choice-label">{t?.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback message */}
            {phase === PHASE.CORRECT && (
              <div className="pb-feedback pb-feedback--correct" role="status">
                ✅ Great job!
              </div>
            )}
            {phase === PHASE.WRONG && (
              <div className="pb-feedback pb-feedback--wrong" role="status">
                Try again! 💪
              </div>
            )}

            {/* Hint button */}
            <div className="pb-hint-row">
              <button
                className={`pb-btn pb-btn--hint ${hintUsed ? 'pb-btn--hint-used' : ''}`}
                onClick={handleHint}
                disabled={phase !== PHASE.PLAYING || hintActive}
                title="Show me a hint"
              >
                💡 {hintUsed ? 'Hint used' : 'Hint'}
              </button>
              <button
                className="pb-btn pb-btn--secondary"
                onClick={handleReplay}
                title="Restart this level"
              >
                🔄 Restart Level
              </button>
            </div>
          </div>

          {/* How to Play & Tips */}
          <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' }}>
            <div className="card-body p-4">
              <h5 className="mb-3"><i className="bi bi-lightbulb-fill text-warning me-2"></i>How to Play &amp; Tips</h5>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-bold mb-2">Level Details:</h6>
                  <ul className="mb-3">
                    <li>Level {level.id} of 15</li>
                    <li>Difficulty: {level.difficulty}</li>
                    <li>Category: {level.tag}</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold mb-2">Tips for Success:</h6>
                  <ul className="mb-0">
                    <li>Look at the pattern carefully</li>
                    <li>Use the Hint button if stuck</li>
                    <li>Try each choice mentally first</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEVEL DONE SCREEN ────────────────────────────── */}
      {phase === PHASE.LEVEL_DONE && (
        <div className="pb-screen pb-screen--center">
          <div className="pb-card pb-card--reward">
            <div className="pb-reward-emoji">🎉</div>
            <h2 className="pb-heading">Level {level.id} Complete!</h2>
            <p className="pb-subtext">You did it! Keep going!</p>

            <StarBadge count={levelStars} size="lg" />

            {levelStars === 3 && <p className="pb-perfect">⭐ Perfect score!</p>}
            {levelStars === 2 && <p className="pb-good">Nice work!</p>}
            {levelStars === 1 && <p className="pb-ok">You got it! Practice more for extra stars.</p>}

            <div className="pb-reward-btns">
              <button className="pb-btn pb-btn--primary pb-btn--lg" onClick={handleNextLevel}>
                Next Level →
              </button>
              <button className="pb-btn pb-btn--secondary" onClick={handleReplay}>
                🔄 Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME COMPLETE SCREEN ─────────────────────────── */}
      {phase === PHASE.GAME_DONE && (
        <div className="pb-screen pb-screen--center">
          <div className="pb-card pb-card--reward">
            <div className="pb-reward-emoji">🏆</div>
            <h2 className="pb-heading">You're a Pattern Master!</h2>
            <p className="pb-subtext">
              Amazing! You completed all 15 levels!<br />
              Total stars earned: <strong>{totalStars + levelStars}</strong> / 45
            </p>

            <StarBadge count={3} size="lg" />

            <div className="pb-reward-btns">
              <button className="pb-btn pb-btn--primary pb-btn--lg" onClick={() => loadLevel(0)}>
                🔁 Play Again
              </button>
              <button className="pb-btn pb-btn--secondary pb-btn--lg" onClick={() => setPhase(PHASE.FREE_PLAY)}>
                🎨 Free Play
              </button>
              <button className="pb-btn pb-btn--secondary" onClick={() => navigate('/games')}>
                🏠 Games Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FREE PLAY SCREEN ─────────────────────────────── */}
      {phase === PHASE.FREE_PLAY && (
        <FreePlayScreen
          sequence={freePlaySequence}
          setSequence={setFreePlaySequence}
          onBack={() => setPhase(PHASE.START)}
          soundEnabled={soundEnabled}
        />
      )}

      {/* ── TIME-UP FAIL OVERLAY ─────────────────────────── */}
      {gameFailed && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fdfcfa', borderRadius: '24px',
            padding: '40px 36px', maxWidth: '380px', width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>⏰</div>
            <h2 style={{ fontWeight: '900', color: '#2d3748', marginBottom: '8px' }}>Time's Up!</h2>
            <p style={{ color: '#5a6477', marginBottom: '28px' }}>
              You ran out of time on Level {level.id}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn rounded-pill px-4 py-2 fw-bold"
                style={{ background: '#61C3B4', color: '#fff', border: 'none' }}
                onClick={retryLevel}
              >
                🔄 Retry
              </button>
              <button
                className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold"
                onClick={() => navigate('/games')}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Free Play sub-component ─────────────────────────────────────────────────
function FreePlayScreen({ sequence, setSequence, onBack, soundEnabled }) {
  const addToken = (id) => {
    if (sequence.length >= 16) return;  // cap at 16 tiles
    setSequence((prev) => [...prev, id]);
    if (soundEnabled) playTone(440 + sequence.length * 30, 0.15);
  };

  const removeAll = () => setSequence([]);
  const removeLast = () => setSequence((prev) => prev.slice(0, -1));

  return (
    <div className="pb-screen pb-screen--center">
      <div className="pb-card pb-card--wide">
        <h2 className="pb-heading">🎨 Free Play</h2>
        <p className="pb-subtext">Build your own pattern! Tap the shapes below.</p>

        {/* Built sequence display */}
        <div className="pb-free-sequence" role="list" aria-label="Your pattern">
          {sequence.length === 0 && (
            <span className="pb-free-placeholder">Tap a shape to start…</span>
          )}
          {sequence.map((id, i) => {
            const t = token(id);
            return (
              <div key={i} className="pb-token pb-token--show" role="listitem" aria-label={t?.label}>
                <span className="pb-emoji">{t?.emoji}</span>
              </div>
            );
          })}
        </div>

        {/* Token palette */}
        <div className="pb-palette" role="group" aria-label="Shape palette">
          {TOKENS.map((t) => (
            <button
              key={t.id}
              className="pb-palette-btn"
              onClick={() => addToken(t.id)}
              aria-label={`Add ${t.label}`}
              title={t.label}
            >
              <span className="pb-choice-emoji">{t.emoji}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="pb-free-controls">
          <button className="pb-btn pb-btn--secondary" onClick={removeLast} disabled={sequence.length === 0}>
            ← Undo
          </button>
          <button className="pb-btn pb-btn--secondary" onClick={removeAll} disabled={sequence.length === 0}>
            🗑 Clear All
          </button>
          <button className="pb-btn pb-btn--secondary" onClick={onBack}>
            ← Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatternBuilderGame;
