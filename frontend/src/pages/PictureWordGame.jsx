/**
 * PictureWordGame.jsx — Voice Answer Edition
 * One picture is shown at a time. The child speaks the word aloud.
 * Uses Web Speech API (SpeechRecognition) to capture the spoken answer.
 * 15 progressive levels: Easy (3 pictures) → Medium (5) → Hard (7).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import '../styles/pictureWordGame.css';

// ─── SpeechRecognition availability ──────────────────────────────────────────
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

// ─── Level data ──────────────────────────────────────────────────────────────
// Each level has an array of pair objects: { emoji, word, category }
// Easy = 3 pairs, Medium = 5 pairs, Hard = 7 pairs
const LEVELS = [
  // ── Easy 1–5 (3 pairs each, very common objects) ─────────────────────────
  {
    id: 1, difficulty: 'Easy', category: 'Animals',
    pairs: [
      { emoji: '🐱', word: 'Cat',   hint: 'Meow!' },
      { emoji: '🐶', word: 'Dog',   hint: 'Woof!' },
      { emoji: '🐟', word: 'Fish',  hint: 'Swim!' },
    ],
  },
  {
    id: 2, difficulty: 'Easy', category: 'Food',
    pairs: [
      { emoji: '🍎', word: 'Apple',  hint: 'Red fruit' },
      { emoji: '🍌', word: 'Banana', hint: 'Yellow fruit' },
      { emoji: '🍕', word: 'Pizza',  hint: 'Yummy!' },
    ],
  },
  {
    id: 3, difficulty: 'Easy', category: 'Objects',
    pairs: [
      { emoji: '⚽', word: 'Ball',   hint: 'Play!' },
      { emoji: '📚', word: 'Book',   hint: 'Read!' },
      { emoji: '🎨', word: 'Paint',  hint: 'Colors!' },
    ],
  },
  {
    id: 4, difficulty: 'Easy', category: 'Nature',
    pairs: [
      { emoji: '☀️', word: 'Sun',    hint: 'Warm!' },
      { emoji: '🌙', word: 'Moon',   hint: 'Night!' },
      { emoji: '⭐', word: 'Star',   hint: 'Shiny!' },
    ],
  },
  {
    id: 5, difficulty: 'Easy', category: 'Animals',
    pairs: [
      { emoji: '🐘', word: 'Elephant', hint: 'Big!' },
      { emoji: '🦁', word: 'Lion',     hint: 'Roar!' },
      { emoji: '🐧', word: 'Penguin',  hint: 'Cold!' },
    ],
  },
  // ── Medium 6–10 (5 pairs each) ───────────────────────────────────────────
  {
    id: 6, difficulty: 'Medium', category: 'Transport',
    pairs: [
      { emoji: '🚗', word: 'Car',      hint: 'Drive!' },
      { emoji: '🚲', word: 'Bicycle',  hint: 'Pedal!' },
      { emoji: '✈️', word: 'Airplane', hint: 'Fly!' },
      { emoji: '🚂', word: 'Train',    hint: 'Choo choo!' },
      { emoji: '🚢', word: 'Ship',     hint: 'Sail!' },
    ],
  },
  {
    id: 7, difficulty: 'Medium', category: 'Food',
    pairs: [
      { emoji: '🍇', word: 'Grapes',   hint: 'Purple!' },
      { emoji: '🍓', word: 'Strawberry', hint: 'Red!' },
      { emoji: '🥕', word: 'Carrot',   hint: 'Orange!' },
      { emoji: '🌽', word: 'Corn',     hint: 'Yellow!' },
      { emoji: '🍦', word: 'Ice Cream', hint: 'Cold!' },
    ],
  },
  {
    id: 8, difficulty: 'Medium', category: 'Home',
    pairs: [
      { emoji: '🪑', word: 'Chair',    hint: 'Sit!' },
      { emoji: '🛏️', word: 'Bed',      hint: 'Sleep!' },
      { emoji: '🚿', word: 'Shower',   hint: 'Wash!' },
      { emoji: '💡', word: 'Lamp',     hint: 'Light!' },
      { emoji: '📺', word: 'TV',       hint: 'Watch!' },
    ],
  },
  {
    id: 9, difficulty: 'Medium', category: 'Nature',
    pairs: [
      { emoji: '🌈', word: 'Rainbow',  hint: 'Colors!' },
      { emoji: '⛄', word: 'Snowman',  hint: 'Cold!' },
      { emoji: '🌊', word: 'Wave',     hint: 'Splash!' },
      { emoji: '🌸', word: 'Flower',   hint: 'Pretty!' },
      { emoji: '🍀', word: 'Clover',   hint: 'Lucky!' },
    ],
  },
  {
    id: 10, difficulty: 'Medium', category: 'Animals',
    pairs: [
      { emoji: '🦋', word: 'Butterfly', hint: 'Flutter!' },
      { emoji: '🐠', word: 'Clownfish', hint: 'Orange!' },
      { emoji: '🦜', word: 'Parrot',   hint: 'Talk!' },
      { emoji: '🐸', word: 'Frog',     hint: 'Ribbit!' },
      { emoji: '🦊', word: 'Fox',      hint: 'Clever!' },
    ],
  },
  // ── Hard 11–15 (7 pairs, similar-looking distractors) ─────────────────────
  {
    id: 11, difficulty: 'Hard', category: 'Animals',
    pairs: [
      { emoji: '🐺', word: 'Wolf',     hint: 'Howl!' },
      { emoji: '🦝', word: 'Raccoon',  hint: 'Mask!' },
      { emoji: '🦔', word: 'Hedgehog', hint: 'Spiky!' },
      { emoji: '🦦', word: 'Otter',    hint: 'Swim!' },
      { emoji: '🦥', word: 'Sloth',    hint: 'Slow!' },
      { emoji: '🦨', word: 'Skunk',    hint: 'Spray!' },
      { emoji: '🦡', word: 'Badger',   hint: 'Dig!' },
    ],
  },
  {
    id: 12, difficulty: 'Hard', category: 'Food',
    pairs: [
      { emoji: '🫐', word: 'Blueberry', hint: 'Blue!' },
      { emoji: '🥭', word: 'Mango',    hint: 'Tropical!' },
      { emoji: '🍑', word: 'Peach',    hint: 'Soft!' },
      { emoji: '🥝', word: 'Kiwi',     hint: 'Green!' },
      { emoji: '🍒', word: 'Cherry',   hint: 'Pair!' },
      { emoji: '🫒', word: 'Olive',    hint: 'Salty!' },
      { emoji: '🥑', word: 'Avocado',  hint: 'Green!' },
    ],
  },
  {
    id: 13, difficulty: 'Hard', category: 'Objects',
    pairs: [
      { emoji: '☕', word: 'Cup',      hint: 'Drink!' },
      { emoji: '🍵', word: 'Mug',      hint: 'Hot!' },
      { emoji: '🪣', word: 'Bucket',   hint: 'Carry!' },
      { emoji: '🧴', word: 'Bottle',   hint: 'Squeeze!' },
      { emoji: '🪥', word: 'Toothbrush', hint: 'Brush!' },
      { emoji: '🪞', word: 'Mirror',   hint: 'Reflect!' },
      { emoji: '🧲', word: 'Magnet',   hint: 'Pull!' },
    ],
  },
  {
    id: 14, difficulty: 'Hard', category: 'Nature',
    pairs: [
      { emoji: '🍁', word: 'Leaf',     hint: 'Fall!' },
      { emoji: '🌲', word: 'Tree',     hint: 'Tall!' },
      { emoji: '🌵', word: 'Cactus',   hint: 'Desert!' },
      { emoji: '🍄', word: 'Mushroom', hint: 'Fungi!' },
      { emoji: '🌾', word: 'Wheat',    hint: 'Farm!' },
      { emoji: '🪸', word: 'Coral',    hint: 'Ocean!' },
      { emoji: '🌿', word: 'Herb',     hint: 'Green!' },
    ],
  },
  {
    id: 15, difficulty: 'Hard', category: 'Mixed',
    pairs: [
      { emoji: '🔦', word: 'Torch',    hint: 'Light!' },
      { emoji: '🕯️', word: 'Candle',   hint: 'Flame!' },
      { emoji: '🔭', word: 'Telescope', hint: 'Stars!' },
      { emoji: '🔬', word: 'Microscope', hint: 'Tiny!' },
      { emoji: '⚗️', word: 'Flask',    hint: 'Science!' },
      { emoji: '🧭', word: 'Compass',  hint: 'North!' },
      { emoji: '📡', word: 'Antenna',  hint: 'Signal!' },
    ],
  },
];

// ─── Web Speech API helper ────────────────────────────────────────────────────
function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.85;
    utt.pitch = 1.1;
    utt.volume = 1;
    // Prefer a friendly English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google'))
    );
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  } catch (_) { /* silently ignore */ }
}

// ─── Audio feedback helpers ───────────────────────────────────────────────────
function playCorrectTones() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.16 + 0.22);
      osc.start(ctx.currentTime + i * 0.16);
      osc.stop(ctx.currentTime + i * 0.16 + 0.25);
    });
  } catch (_) {}
}

function playWrongTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 300;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

// ─── Stars calculation ────────────────────────────────────────────────────────
function calcStars(wrongCount) {
  if (wrongCount === 0) return 3;
  if (wrongCount <= 2) return 2;
  return 1;
}

// ─── Phase constants ──────────────────────────────────────────────────────────
const PHASE = {
  START:        'start',
  PLAYING:      'playing',
  LEVEL_DONE:   'levelDone',
  GAME_DONE:    'gameDone',
  FREE_EXPLORE: 'freeExplore',
};

// ─── Mic state constants ──────────────────────────────────────────────────────
const MIC = { IDLE: 'idle', LISTENING: 'listening', PROCESSING: 'processing', CORRECT: 'correct', WRONG: 'wrong' };

// ─── Main component ───────────────────────────────────────────────────────────
const PictureWordGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const maxLevel = location.state?.maxLevel ?? LEVELS.length;
  const { selectedChild, recordActivity } = useChild();

  // ── Persistent progress ───────────────────────────────────────────────────
  const [progress, setProgress] = useState(() => {
    try {
      const s = localStorage.getItem('pictureWordProgress');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });

  const saveProgress = useCallback((levelId, stars) => {
    setProgress((prev) => {
      const next = { ...prev, [levelId]: Math.max(prev[levelId] || 0, stars) };
      localStorage.setItem('pictureWordProgress', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Settings ──────────────────────────────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120);

  // ── Game state ────────────────────────────────────────────────────────────
  const [phase, setPhase]                     = useState(PHASE.START);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [currentPairIdx, setCurrentPairIdx]   = useState(0);
  const [micState, setMicState]               = useState(MIC.IDLE);
  const [transcript, setTranscript]           = useState('');
  const [hintActive, setHintActive]           = useState(false);
  const [hintUsed, setHintUsed]               = useState(false);
  const [wrongCount, setWrongCount]           = useState(0);
  const [levelStars, setLevelStars]           = useState(0);
  const [timeLeft, setTimeLeft]               = useState(120);
  const [totalStars, setTotalStars]           = useState(0);

  // soundRef prevents stale closure in SpeechRecognition.onresult
  const soundRef       = useRef(soundEnabled);
  const recognitionRef = useRef(null);
  const feedbackTimer  = useRef(null);
  const hintTimer      = useRef(null);
  const countdownRef   = useRef(null);

  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);

  const level       = LEVELS[currentLevelIdx];
  const currentPair = level?.pairs[currentPairIdx];
  const isLastPair  = currentPairIdx === (level?.pairs.length ?? 1) - 1;

  // ── Total stars ───────────────────────────────────────────────────────────
  useEffect(() => {
    setTotalStars(Object.values(progress).reduce((a, b) => a + b, 0));
  }, [progress]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    recognitionRef.current?.abort();
    clearTimeout(feedbackTimer.current);
    clearTimeout(hintTimer.current);
    clearInterval(countdownRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  // ── Load voices (Chrome needs a tick) ────────────────────────────────────
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // ── Countdown timer for Hard levels ──────────────────────────────────────
  useEffect(() => {
    clearInterval(countdownRef.current);
    if (phase === PHASE.PLAYING && timerEnabled && level?.difficulty === 'Hard') {
      countdownRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(countdownRef.current);
            setTimeout(() => {
              if (soundRef.current) speak('Time is up! Try again.');
              loadLevel(currentLevelIdx);
            }, 0);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timerEnabled, currentLevelIdx]);

  // ── Complete a level ──────────────────────────────────────────────────────
  const completeLevel = useCallback((finalWrongCount) => {
    clearInterval(countdownRef.current);
    const lvl   = LEVELS[currentLevelIdx];
    const stars = calcStars(finalWrongCount);
    setLevelStars(stars);
    saveProgress(lvl.id, stars);
    if (soundRef.current) playCorrectTones();

    if (selectedChild) {
      recordActivity({
        activityType: 'game',
        activityName: 'Picture Word Match',
        score: stars * 33,
        maxScore: 100,
        percentage: stars * 33,
        duration: 0,
        attempts: finalWrongCount + lvl.pairs.length,
        difficulty: lvl.difficulty.toLowerCase(),
        correctAnswers: lvl.pairs.length,
        incorrectAnswers: finalWrongCount,
        details: { level: lvl.id, category: lvl.category },
      }).catch(() => {});
    }

    setTimeout(() => {
      setPhase(lvl.id >= maxLevel || lvl.id === 15 ? PHASE.GAME_DONE : PHASE.LEVEL_DONE);
      if (soundRef.current) speak(stars === 3 ? 'Perfect! Amazing job!' : 'Great job!');
    }, 600);
  }, [currentLevelIdx, saveProgress, selectedChild, recordActivity]);

  // ── Advance to next pair (or complete level) ──────────────────────────────
  const advancePair = useCallback((finalWrongCount) => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    clearTimeout(feedbackTimer.current);
    clearTimeout(hintTimer.current);
    setHintActive(false);
    if (isLastPair) {
      completeLevel(finalWrongCount);
    } else {
      setCurrentPairIdx((i) => i + 1);
      setMicState(MIC.IDLE);
      setTranscript('');
      setHintUsed(false);
    }
  }, [isLastPair, completeLevel]);

  // ── Load a level ──────────────────────────────────────────────────────────
  const loadLevel = useCallback((idx) => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    clearTimeout(feedbackTimer.current);
    clearTimeout(hintTimer.current);
    clearInterval(countdownRef.current);
    setCurrentLevelIdx(idx);
    setCurrentPairIdx(0);
    setMicState(MIC.IDLE);
    setTranscript('');
    setHintActive(false);
    setHintUsed(false);
    setWrongCount(0);
    setLevelStars(0);
    setTimeLeft(timerSeconds);
    setPhase(PHASE.PLAYING);
  }, [timerSeconds]);

  // ── Auto-start when navigated from Games page ────────────────────────────
  useEffect(() => {
    if (location.state?.autoStart) loadLevel(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start voice recognition ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SR) return;
    if (micState === MIC.LISTENING || micState === MIC.PROCESSING || micState === MIC.CORRECT) return;
    recognitionRef.current?.abort();

    const recognition = new SR();
    recognition.lang             = 'en-US';
    recognition.interimResults   = false;
    recognition.maxAlternatives  = 6;
    recognitionRef.current = recognition;

    setMicState(MIC.LISTENING);
    setTranscript('');

    recognition.onresult = (e) => {
      setMicState(MIC.PROCESSING);
      const expected = currentPair.word.toLowerCase().trim();
      const alts     = Array.from(e.results[0]).map((alt) => alt.transcript.toLowerCase().trim());
      const heard    = alts[0] || '';
      setTranscript(heard);

      const isMatch = alts.some((a) =>
        a === expected ||
        a.includes(expected) ||
        expected.includes(a) ||
        a.split(' ')[0] === expected.split(' ')[0]
      );

      if (isMatch) {
        setMicState(MIC.CORRECT);
        if (soundRef.current) { playCorrectTones(); speak(currentPair.word); }
        feedbackTimer.current = setTimeout(() => {
          advancePair(wrongCount);
        }, 1600);
      } else {
        setMicState(MIC.WRONG);
        if (soundRef.current) playWrongTone();
        setWrongCount((c) => {
          feedbackTimer.current = setTimeout(() => {
            setMicState(MIC.IDLE);
            setTranscript('');
          }, 1800);
          return c + 1;
        });
      }
    };

    recognition.onerror = () => {
      setMicState(MIC.IDLE);
      setTranscript('');
    };

    recognition.onend = () => {
      setMicState((prev) => (prev === MIC.LISTENING ? MIC.IDLE : prev));
    };

    recognition.start();
  }, [micState, currentPair, wrongCount, advancePair]);

  // ── Hint ──────────────────────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    if (!currentPair) return;
    setHintActive(true);
    setHintUsed(true);
    if (soundRef.current) speak(currentPair.hint);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintActive(false), 4000);
  }, [currentPair]);

  // ── Skip ──────────────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    clearTimeout(feedbackTimer.current);
    const newWrong = wrongCount + 1;
    setWrongCount(newWrong);
    setMicState(MIC.IDLE);
    setTranscript('');
    advancePair(newWrong);
  }, [wrongCount, advancePair]);

  // ── Star badge ────────────────────────────────────────────────────────────
  const StarBadge = ({ count, size = 'md' }) => (
    <div className={`pw-star-row pw-star-row--${size}`} aria-label={`${count} out of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`pw-star ${n <= count ? 'pw-star--filled' : 'pw-star--empty'}`}>★</span>
      ))}
    </div>
  );

  // ── Derived ────────────────────────────────────────────────────────────────
  const showTimer = timerEnabled && level?.difficulty === 'Hard' && phase === PHASE.PLAYING;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="pw-container">

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="pw-topbar">
        <button className="pw-btn pw-btn--back" onClick={() => navigate('/games')} aria-label="Back to Games">
          <i className="bi bi-arrow-left"></i> Back to Games
        </button>

        <h1 className="pw-title">
          <span className="pw-title-icon">💬</span> Communication Builder
        </h1>

        <div className="pw-topbar-right">
          <div className="pw-total-stars" title="Total stars earned" aria-label={`${totalStars} total stars`}>
            ⭐ {totalStars}
          </div>
        </div>
      </div>

      {/* SR unavailable warning */}
      {!SR && (
        <div className="pw-no-sr-warning" role="alert">
          <strong>Voice recognition not available.</strong> Please use Google Chrome or Microsoft Edge.
        </div>
      )}

      {/* ── START SCREEN ─────────────────────────────────────────── */}
      {phase === PHASE.START && (
        <div className="pw-screen pw-screen--center">
          <div className="pw-card pw-card--wide">
            <div className="pw-start-icon">💬</div>
            <h2 className="pw-heading">Communication Builder</h2>
            <p className="pw-subtext">
              Look at each picture and <strong>say the word aloud</strong>!<br />
              Tap the mic button, then speak — we will listen for you.
            </p>

            <div className="pw-legend">
              <span className="pw-pill pw-pill--easy">Levels 1–5: Easy (3 pictures)</span>
              <span className="pw-pill pw-pill--medium">Levels 6–10: Medium (5 pictures)</span>
              <span className="pw-pill pw-pill--hard">Levels 11–15: Hard (7 pictures)</span>
            </div>

            <div className="pw-start-btns">
              <button className="pw-btn pw-btn--primary pw-btn--lg" onClick={() => loadLevel(0)}>
                <i className="bi bi-play-fill"></i> Start Game
              </button>
              <button className="pw-btn pw-btn--accent pw-btn--lg" onClick={() => setPhase(PHASE.FREE_EXPLORE)}>
                <i className="bi bi-binoculars"></i> Free Explore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAYING SCREEN ───────────────────────────────────────── */}
      {phase === PHASE.PLAYING && currentPair && (
        <div className="pw-screen">
          {/* Level strip */}
          <div className="pw-level-strip">
            <span className={`pw-pill pw-pill--${level.difficulty.toLowerCase()}`}>{level.difficulty}</span>
            <span className="pw-level-label">Level {level.id} / 15</span>
            <span className="pw-cat-tag">{level.category}</span>

            {showTimer && (
              <span className={`pw-timer ${timeLeft <= 20 ? 'pw-timer--warn' : ''}`} aria-live="polite">
                ⏱ {timeLeft}s
              </span>
            )}

            <div className="pw-progress-dots" aria-hidden="true">
              {LEVELS.map((l) => (
                <span key={l.id} className={`pw-dot pw-dot--${l.id < level.id ? 'done' : l.id === level.id ? 'current' : 'future'}`} />
              ))}
            </div>
          </div>

          <div className="pw-card pw-card--voice">
            {/* Pair-dots: progress within this level */}
            <div className="pw-pair-dots" aria-label={`Picture ${currentPairIdx + 1} of ${level.pairs.length}`}>
              {level.pairs.map((_, i) => (
                <span
                  key={i}
                  className={`pw-pair-dot ${i < currentPairIdx ? 'pw-pair-dot--done' : i === currentPairIdx ? 'pw-pair-dot--current' : ''}`}
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* Big picture */}
            <div
              className={`pw-big-picture${micState === MIC.CORRECT ? ' pw-big-picture--correct' : ''}${micState === MIC.WRONG ? ' pw-big-picture--wrong' : ''}`}
              aria-hidden="true"
            >
              <span className="pw-big-emoji">{currentPair.emoji}</span>
              {micState === MIC.CORRECT && (
                <div className="pw-correct-word">{currentPair.word} ✓</div>
              )}
            </div>

            {/* Voice instruction */}
            <p className="pw-voice-instruction" aria-live="polite">
              {micState === MIC.IDLE       && 'What is this? Tap the mic and say the word!'}
              {micState === MIC.LISTENING  && '🎙 Listening… say the word!'}
              {micState === MIC.PROCESSING && '⏳ Got it! Checking…'}
              {micState === MIC.CORRECT    && `🎉 Correct! It's "${currentPair.word}"!`}
              {micState === MIC.WRONG      && 'Not quite — try again! 💪'}
            </p>

            {/* Transcript feedback */}
            {transcript && (
              <p
                className={`pw-transcript pw-transcript--${micState === MIC.CORRECT ? 'correct' : 'wrong'}`}
                aria-live="polite"
              >
                I heard: &ldquo;{transcript}&rdquo;
              </p>
            )}

            {/* Mic button */}
            <button
              className={`pw-mic-btn pw-mic-btn--${micState}`}
              onClick={startListening}
              disabled={!SR || micState === MIC.PROCESSING || micState === MIC.CORRECT}
              aria-label={
                !SR                       ? 'Voice recognition not available'
                : micState === MIC.LISTENING  ? 'Listening — speak now'
                : micState === MIC.PROCESSING ? 'Processing your answer'
                : micState === MIC.CORRECT    ? 'Correct!'
                : 'Tap to speak'
              }
            >
              <span className="pw-mic-icon" aria-hidden="true">
                {micState === MIC.IDLE       && '🎤'}
                {micState === MIC.LISTENING  && '🔴'}
                {micState === MIC.PROCESSING && '⏳'}
                {micState === MIC.CORRECT    && '✅'}
                {micState === MIC.WRONG      && '🎤'}
              </span>
              <span className="pw-mic-label">
                {micState === MIC.IDLE       && 'Tap to speak'}
                {micState === MIC.LISTENING  && 'Listening…'}
                {micState === MIC.PROCESSING && 'Checking…'}
                {micState === MIC.CORRECT    && 'Correct!'}
                {micState === MIC.WRONG      && 'Try again'}
              </span>
            </button>

            {/* Hint box */}
            {hintActive && (
              <div className="pw-hint-box" role="status" aria-live="polite">
                💡 Hint: {currentPair.hint}
              </div>
            )}

            {/* Controls */}
            <div className="pw-voice-controls">
              <button
                className="pw-btn pw-btn--secondary"
                onClick={handleHint}
                disabled={hintActive}
                title="Get a hint"
                aria-label="Show hint"
              >
                💡 Hint
              </button>
              <button className="pw-btn pw-btn--secondary" onClick={() => loadLevel(currentLevelIdx)}>
                🔄 Restart
              </button>
            </div>
          </div>

          {/* How to Play & Tips */}
          <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: '16px', background: 'var(--card-bg, #fdfcfa)' }}>
            <div className="card-body p-4">
              <h5 className="mb-3"><i className="bi bi-lightbulb-fill text-warning me-2"></i>How to Play &amp; Tips</h5>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-bold mb-2">Level Details:</h6>
                  <ul className="mb-3">
                    <li>Level {level.id} of 15</li>
                    <li>Difficulty: {level.difficulty}</li>
                    <li>Category: {level.category}</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold mb-2">Tips for Success:</h6>
                  <ul className="mb-0">
                    <li>Tap the mic and say the word clearly</li>
                    <li>Use the Hint button if unsure</li>
                    <li>Speak at normal volume</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEVEL DONE SCREEN ────────────────────────────────────────── */}
      {phase === PHASE.LEVEL_DONE && (
        <div className="pw-screen pw-screen--center">
          <div className="pw-card pw-card--reward">
            <div className="pw-reward-emoji">🎉</div>
            <h2 className="pw-heading">Level {level.id} Complete!</h2>
            <p className="pw-subtext">You matched all the words!</p>

            <StarBadge count={levelStars} size="lg" />

            {levelStars === 3 && <p className="pw-perfect">⭐ Perfect — no mistakes!</p>}
            {levelStars === 2 && <p className="pw-good">Great job! Keep practising.</p>}
            {levelStars === 1 && <p className="pw-ok">You got it! Try again for more stars.</p>}

            <div className="pw-reward-btns">
              <button
                className="pw-btn pw-btn--primary pw-btn--lg"
                onClick={() => loadLevel(currentLevelIdx + 1)}
              >
                Next Level →
              </button>
              <button className="pw-btn pw-btn--secondary" onClick={() => loadLevel(currentLevelIdx)}>
                🔄 Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME COMPLETE SCREEN ─────────────────────────────────── */}
      {phase === PHASE.GAME_DONE && (
        <div className="pw-screen pw-screen--center">
          <div className="pw-card pw-card--reward">
            <div className="pw-reward-emoji">🏆</div>
            <h2 className="pw-heading">Word Master!</h2>
            <p className="pw-subtext">
              Amazing! You completed all 15 levels!<br />
              Total stars: <strong>{totalStars}</strong> / 45
            </p>

            <StarBadge count={3} size="lg" />

            <div className="pw-reward-btns">
              <button className="pw-btn pw-btn--primary pw-btn--lg" onClick={() => loadLevel(0)}>
                🔁 Play Again
              </button>
              <button className="pw-btn pw-btn--accent pw-btn--lg" onClick={() => setPhase(PHASE.FREE_EXPLORE)}>
                🔍 Free Explore
              </button>
              <button className="pw-btn pw-btn--secondary" onClick={() => navigate('/games')}>
                🏠 Games Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FREE EXPLORE SCREEN ──────────────────────────────────── */}
      {phase === PHASE.FREE_EXPLORE && (
        <FreeExploreScreen
          levels={LEVELS}
          soundEnabled={soundEnabled}
          onBack={() => setPhase(PHASE.START)}
        />
      )}


    </div>
  );
};

// ─── Free Explore sub-component ──────────────────────────────────────────────
// Browse all emoji + word pairs; tap any card to hear the word spoken aloud.
function FreeExploreScreen({ levels, soundEnabled, onBack }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const allPairs = levels.flatMap((lvl) =>
    lvl.pairs.map((p) => ({ ...p, levelId: lvl.id, difficulty: lvl.difficulty, levelCategory: lvl.category }))
  );

  const categories = ['All', ...new Set(levels.map((l) => l.category))];
  const filtered   = activeCategory === 'All'
    ? allPairs
    : allPairs.filter((p) => p.levelCategory === activeCategory);

  const handleCardTap = (word) => {
    if (soundEnabled) speak(word);
  };

  return (
    <div className="pw-screen pw-screen--center">
      <div className="pw-card pw-card--wide">
        <h2 className="pw-heading">🔍 Free Explore</h2>
        <p className="pw-subtext">Tap any card to hear the word!</p>

        {/* Category filter */}
        <div className="pw-explore-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pw-pill-btn ${activeCategory === cat ? 'pw-pill-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="pw-explore-grid">
          {filtered.map((p, i) => (
            <button
              key={i}
              className="pw-explore-card"
              onClick={() => handleCardTap(p.word)}
              aria-label={`${p.word} — tap to hear`}
            >
              <span className="pw-emoji pw-emoji--explore" aria-hidden="true">{p.emoji}</span>
              <span className="pw-explore-word">{p.word}</span>
              <span className="pw-explore-hint">{p.hint}</span>
            </button>
          ))}
        </div>

        <button className="pw-btn pw-btn--secondary mt-3" onClick={onBack}>← Back to Menu</button>
      </div>
    </div>
  );
}

export default PictureWordGame;
