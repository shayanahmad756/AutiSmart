import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChildSelector from '../components/ChildSelector';
import { useChild } from '../context/ChildContext';
import '../styles/communicationBuilder.css';

/* ============================================================
   PECS Items — grouped by category
   ============================================================ */
const PECS_CATEGORIES = [
  {
    id: 'food',
    label: 'Food & Drink',
    icon: '🍎',
    items: [
      { id: 'apple',  emoji: '🍎', label: 'Apple' },
      { id: 'milk',   emoji: '🥛', label: 'Milk' },
      { id: 'water',  emoji: '💧', label: 'Water' },
      { id: 'bread',  emoji: '🍞', label: 'Bread' },
      { id: 'banana', emoji: '🍌', label: 'Banana' },
      { id: 'cookie', emoji: '🍪', label: 'Cookie' },
      { id: 'juice',  emoji: '🧃', label: 'Juice' },
      { id: 'pizza',  emoji: '🍕', label: 'Pizza' },
    ],
  },
  {
    id: 'toys',
    label: 'Toys & Play',
    icon: '⚽',
    items: [
      { id: 'ball',    emoji: '⚽', label: 'Ball' },
      { id: 'book',    emoji: '📚', label: 'Book' },
      { id: 'teddy',   emoji: '🧸', label: 'Teddy' },
      { id: 'paint',   emoji: '🎨', label: 'Paint' },
      { id: 'puzzle',  emoji: '🧩', label: 'Puzzle' },
      { id: 'game',    emoji: '🎮', label: 'Game' },
      { id: 'kite',    emoji: '🪁', label: 'Kite' },
      { id: 'music',   emoji: '🎵', label: 'Music' },
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: '🤸',
    items: [
      { id: 'walk',    emoji: '🚶', label: 'Walk' },
      { id: 'sleep',   emoji: '😴', label: 'Sleep' },
      { id: 'bath',    emoji: '🛁', label: 'Bath' },
      { id: 'ride',    emoji: '🚗', label: 'Ride' },
      { id: 'draw',    emoji: '✏️', label: 'Draw' },
      { id: 'watch',   emoji: '📺', label: 'Watch' },
      { id: 'jump',    emoji: '🤸', label: 'Jump' },
      { id: 'movie',   emoji: '🎬', label: 'Movie' },
    ],
  },
  {
    id: 'needs',
    label: 'Feelings & Needs',
    icon: '🤗',
    items: [
      { id: 'hug',      emoji: '🤗', label: 'Hug' },
      { id: 'toilet',   emoji: '🚽', label: 'Toilet' },
      { id: 'medicine', emoji: '💊', label: 'Medicine' },
      { id: 'bandaid',  emoji: '🩹', label: 'Band-aid' },
      { id: 'wait',     emoji: '⏳', label: 'Wait' },
      { id: 'sick',     emoji: '🌡️', label: 'Sick' },
      { id: 'calm',     emoji: '😌', label: 'Calm' },
      { id: 'quiet',    emoji: '🔇', label: 'Quiet' },
    ],
  },
];

const ALL_ITEMS = PECS_CATEGORIES.flatMap(c => c.items);

/* ============================================================
   Levels — which categories are unlocked per level
   ============================================================ */
const LEVELS = [
  {
    id: 1,
    name: 'Food & Drink',
    categories: ['food'],
    guidedRounds: 6,
    difficulty: 'Easy',
    description: 'Food & drink items only',
  },
  {
    id: 2,
    name: 'Toys & Play',
    categories: ['food', 'toys'],
    guidedRounds: 7,
    difficulty: 'Medium',
    description: 'Food and toy items',
  },
  {
    id: 3,
    name: 'Activities',
    categories: ['food', 'toys', 'activities'],
    guidedRounds: 8,
    difficulty: 'Hard',
    description: 'Food, toys, and activities',
  },
  {
    id: 4,
    name: 'All Items',
    categories: ['food', 'toys', 'activities', 'needs'],
    guidedRounds: 9,
    difficulty: 'Expert',
    description: 'All 32 items',
  },
];

/* ============================================================
   Speech helper
   ============================================================ */
function speak(text, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.85;
  utt.pitch = 1.1;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

/* ============================================================
   Component
   ============================================================ */
export default function CommunicationBuilderGame() {
  const navigate = useNavigate();
  const { selectedChild, recordActivity } = useChild();

  /* ---- screen: start | game | levelComplete ---- */
  const [screen, setScreen] = useState('start');
  const [mode, setMode] = useState('free');          // 'free' | 'guided'
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  /* ---- Free mode state ---- */
  const [activeCategory, setActiveCategory] = useState('food');
  const [sentence, setSentence] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [totalUtterances, setTotalUtterances] = useState(0);

  /* ---- Guided mode state ---- */
  const [round, setRound] = useState(1);
  const [targetItem, setTargetItem] = useState(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [cardState, setCardState] = useState({});   // { [itemId]: 'correct'|'wrong'|'disabled' }
  const [roundDone, setRoundDone] = useState(false);

  /* ---- Shared ---- */
  const [wordFrequency, setWordFrequency] = useState({});
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef(null);

  /* ============================================================
     Derived helpers
     ============================================================ */
  const currentLevel = LEVELS[currentLevelIdx];

  const levelItems = currentLevel.categories.flatMap(cid =>
    PECS_CATEGORIES.find(c => c.id === cid)?.items ?? []
  );

  const visibleItems = mode === 'free'
    ? (PECS_CATEGORIES.find(c => c.id === activeCategory)?.items ?? []).filter(it =>
        currentLevel.categories.includes(activeCategory)
      )
    : levelItems;

  /* ============================================================
     Start game
     ============================================================ */
  function startGame() {
    startTimeRef.current = Date.now();
    setSentence([]);
    setWordFrequency({});
    setTotalUtterances(0);
    setScore(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setCardState({});
    setRound(1);
    setRoundDone(false);

    const cats = LEVELS[currentLevelIdx].categories;
    setActiveCategory(cats[0]);

    if (mode === 'guided') {
      pickNewTarget(0, {});
    }
    setScreen('game');
  }

  /* ============================================================
     Free Mode — tap a card to add to sentence
     ============================================================ */
  function handleFreeCardTap(item) {
    if (isSpeaking) return;
    setSentence(prev => [...prev, item]);
    setWordFrequency(prev => ({ ...prev, [item.label]: (prev[item.label] ?? 0) + 1 }));
    speak(`${item.label}`);
  }

  function removeWord(index) {
    setSentence(prev => prev.filter((_, i) => i !== index));
  }

  function sayFullSentence() {
    if (sentence.length === 0) return;
    const text = 'I want ' + sentence.map(it => it.label).join(', ');
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  }

  function clearSentence() {
    setSentence([]);
  }

  function finishFreeSession() {
    setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
    setScreen('levelComplete');
    saveActivity({ score: 0, maxScore: 0, percentage: 0 });
  }

  /* ============================================================
     Guided Mode — pick target
     ============================================================ */
  const pickNewTarget = useCallback((levelIdx, currentCardState) => {
    const items = LEVELS[levelIdx].categories.flatMap(cid =>
      PECS_CATEGORIES.find(c => c.id === cid)?.items ?? []
    );
    // reset disabled cards from previous round, keep only current round state
    setCardState({});
    setRoundDone(false);
    const random = items[Math.floor(Math.random() * items.length)];
    setTargetItem(random);
    speak(`Find: ${random.label}`);
  }, []);

  function handleGuidedCardTap(item) {
    if (roundDone || cardState[item.id] === 'disabled') return;

    if (item.id === targetItem.id) {
      // Correct
      setCardState(prev => ({ ...prev, [item.id]: 'correct' }));
      setScore(prev => prev + 10);
      setCorrectAnswers(prev => prev + 1);
      setWordFrequency(prev => ({ ...prev, [item.label]: (prev[item.label] ?? 0) + 1 }));
      setRoundDone(true);
      speak(`Yes! ${item.label}! I want ${item.label}!`, () => {
        setTimeout(() => advanceRound(), 800);
      });
    } else {
      // Wrong — grey out the tapped card
      setCardState(prev => ({ ...prev, [item.id]: 'disabled' }));
      setIncorrectAnswers(prev => prev + 1);
      speak(`Try again`);
    }
  }

  function advanceRound() {
    const nextRound = round + 1;
    if (nextRound > currentLevel.guidedRounds) {
      setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      const pct = Math.round((score / (currentLevel.guidedRounds * 10)) * 100);
      saveActivity({ score, maxScore: currentLevel.guidedRounds * 10, percentage: pct });
      setScreen('levelComplete');
    } else {
      setRound(nextRound);
      pickNewTarget(currentLevelIdx, {});
    }
  }

  /* ============================================================
     Save activity
     ============================================================ */
  function saveActivity({ score: s, maxScore: mx, percentage: pct }) {
    if (!selectedChild) return;
    const topWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);

    recordActivity({
      activityType: 'game',
      activityName: 'Communication Builder',
      score: s,
      maxScore: mx,
      percentage: pct,
      duration: Math.round((Date.now() - startTimeRef.current) / 1000),
      attempts: 1,
      difficulty: currentLevel.difficulty,
      correctAnswers,
      incorrectAnswers,
      details: {
        level: currentLevel.id,
        levelName: currentLevel.name,
        mode,
        wordFrequency,
        topWords,
        totalUtterances,
      },
    });
  }

  /* ============================================================
     Level complete — go to next or restart
     ============================================================ */
  function handleNextLevel() {
    if (currentLevelIdx < LEVELS.length - 1) {
      const next = currentLevelIdx + 1;
      setCurrentLevelIdx(next);
      setSentence([]);
      setWordFrequency({});
      setTotalUtterances(0);
      setScore(0);
      setCorrectAnswers(0);
      setIncorrectAnswers(0);
      setCardState({});
      setRound(1);
      setRoundDone(false);
      startTimeRef.current = Date.now();
      if (mode === 'guided') pickNewTarget(next, {});
      setScreen('game');
    } else {
      setScreen('start');
    }
  }

  function handlePlayAgain() {
    setSentence([]);
    setWordFrequency({});
    setTotalUtterances(0);
    setScore(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setCardState({});
    setRound(1);
    setRoundDone(false);
    startTimeRef.current = Date.now();
    if (mode === 'guided') pickNewTarget(currentLevelIdx, {});
    setScreen('game');
  }

  /* ============================================================
     Cleanup speech on unmount
     ============================================================ */
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  /* ============================================================
     Derived display helpers
     ============================================================ */
  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /* ============================================================
     RENDER
     ============================================================ */
  if (screen === 'start') {
    return (
      <div className="container py-4" style={{ maxWidth: 640 }}>
        <button className="btn btn-link text-decoration-none mb-3 ps-0" onClick={() => navigate('/games')}>
          <i className="bi bi-arrow-left me-1" /> Back to Games
        </button>

        <div className="text-center mb-4">
          <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.5rem' }}>💬</div>
          <h2 className="fw-bold mb-1">Communication Builder</h2>
          <p className="text-muted">Build sentences with picture cards and hear them spoken aloud</p>
        </div>

        <ChildSelector />

        <div className="card border-0 shadow-sm mb-4" style={{ background: 'var(--card-bg)', borderRadius: 16 }}>
          <div className="card-body p-4">
            <h6 className="fw-bold text-center mb-3" style={{ color: '#61C3B4' }}>Choose Mode</h6>
            <div className="mode-toggle mb-0">
              <button
                type="button"
                className={`mode-btn ${mode === 'free' ? 'active' : ''}`}
                onClick={() => setMode('free')}
              >
                🎨 Free Mode
              </button>
              <button
                type="button"
                className={`mode-btn ${mode === 'guided' ? 'active' : ''}`}
                onClick={() => setMode('guided')}
              >
                🎯 Guided Mode
              </button>
            </div>
            <p className="text-muted text-center mt-2 mb-0" style={{ fontSize: '0.85rem' }}>
              {mode === 'free'
                ? 'Tap cards freely to build "I want ___" sentences and hear them read aloud'
                : 'Find the picture shown — scored and tracked for progress'}
            </p>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ background: 'var(--card-bg)', borderRadius: 16 }}>
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3" style={{ color: '#61C3B4' }}>Choose Level</h6>
            <div className="row g-2">
              {LEVELS.map((lvl, idx) => (
                <div key={lvl.id} className="col-6">
                  <button
                    type="button"
                    onClick={() => setCurrentLevelIdx(idx)}
                    className={`w-100 btn btn-sm rounded-3 fw-semibold py-2 ${currentLevelIdx === idx ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={currentLevelIdx === idx ? { background: '#61C3B4', borderColor: '#61C3B4' } : {}}
                  >
                    <div>Level {lvl.id}: {lvl.name}</div>
                    <small style={{ fontWeight: 400, opacity: 0.85 }}>{lvl.description}</small>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          className="btn w-100 py-3 fw-bold fs-5 rounded-4 text-white"
          style={{ background: 'linear-gradient(135deg, #61C3B4, #4AA99A)' }}
          onClick={startGame}
        >
          Start <i className="bi bi-play-fill" />
        </button>
      </div>
    );
  }

  /* ---- Level Complete Screen ---- */
  if (screen === 'levelComplete') {
    const isLastLevel = currentLevelIdx >= LEVELS.length - 1;
    const maxScore = currentLevel.guidedRounds * 10;
    const pct = mode === 'guided' && maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

    return (
      <div className="container py-4" style={{ maxWidth: 560 }}>
        <div className="card border-0 shadow" style={{ background: 'var(--card-bg)', borderRadius: 20 }}>
          <div className="card-body p-4 text-center">
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {pct === null ? '🗣️' : pct >= 80 ? '🌟' : pct >= 60 ? '👍' : '💙'}
            </div>
            <h3 className="fw-bold mb-1">
              {mode === 'free' ? 'Great Communicating!' : pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Well Done!' : 'Keep Practising!'}
            </h3>
            <p className="text-muted mb-3">Level {currentLevel.id}: {currentLevel.name}</p>

            {mode === 'guided' && (
              <div className="row g-2 mb-3">
                <div className="col-4">
                  <div className="rounded-3 py-2 px-1" style={{ background: 'rgba(97,195,180,0.12)' }}>
                    <div className="fw-bold fs-5" style={{ color: '#61C3B4' }}>{score}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>Score</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="rounded-3 py-2 px-1" style={{ background: 'rgba(40,167,69,0.1)' }}>
                    <div className="fw-bold fs-5 text-success">{correctAnswers}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>Correct</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="rounded-3 py-2 px-1" style={{ background: 'rgba(236,137,110,0.1)' }}>
                    <div className="fw-bold fs-5" style={{ color: '#EC896E' }}>{incorrectAnswers}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>Misses</div>
                  </div>
                </div>
              </div>
            )}

            {topWords.length > 0 && (
              <div className="mb-3">
                <div className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                  {mode === 'free' ? 'Most Used Words' : 'Found Items'}
                </div>
                <div className="top-words">
                  {topWords.map(([word, count]) => (
                    <span key={word} className="top-word-chip">
                      {word} {count > 1 && <span style={{ opacity: 0.7 }}>×{count}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-secondary flex-fill rounded-3" onClick={handlePlayAgain}>
                Play Again
              </button>
              {isLastLevel ? (
                <button
                  className="btn flex-fill rounded-3 text-white fw-semibold"
                  style={{ background: '#61C3B4' }}
                  onClick={() => setScreen('start')}
                >
                  Back to Start
                </button>
              ) : (
                <button
                  className="btn flex-fill rounded-3 text-white fw-semibold"
                  style={{ background: '#61C3B4' }}
                  onClick={handleNextLevel}
                >
                  Next Level <i className="bi bi-arrow-right" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Game Screen ---- */
  return (
    <div className="container py-3" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button className="btn btn-link text-decoration-none p-0" onClick={() => { window.speechSynthesis?.cancel(); setScreen('start'); }}>
          <i className="bi bi-arrow-left me-1" /> Exit
        </button>
        <div className="text-center">
          <span className="fw-semibold" style={{ color: '#61C3B4', fontSize: '0.9rem' }}>
            Level {currentLevel.id} · {mode === 'free' ? 'Free Mode' : `Round ${round} / ${currentLevel.guidedRounds}`}
          </span>
        </div>
        {mode === 'guided' ? (
          <span className="badge rounded-pill" style={{ background: '#61C3B4', fontSize: '0.82rem' }}>
            {score} pts
          </span>
        ) : (
          <span style={{ width: 60 }} />
        )}
      </div>

      {/* ---- Guided Mode: target prompt ---- */}
      {mode === 'guided' && targetItem && (
        <div className="target-prompt">
          <span className="target-emoji">{targetItem.emoji}</span>
          <div>
            <div className="target-label">Find: {targetItem.label}</div>
            <div className="target-sub">Tap the correct card below</div>
          </div>
        </div>
      )}

      {/* ---- Free Mode: sentence strip ---- */}
      {mode === 'free' && (
        <>
          <div className="sentence-strip">
            <span className="sentence-frame">I want</span>
            {sentence.length === 0 ? (
              <span className="sentence-blank">tap a card to add...</span>
            ) : (
              sentence.map((item, i) => (
                <span key={`${item.id}-${i}`} className="sentence-word">
                  {item.emoji} {item.label}
                  <button className="remove-btn" onClick={() => removeWord(i)} aria-label="remove">
                    <i className="bi bi-x" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="d-flex gap-2 mb-3">
            <button
              className="btn btn-sm flex-fill fw-semibold rounded-3 text-white"
              style={{ background: '#61C3B4', opacity: sentence.length === 0 || isSpeaking ? 0.6 : 1 }}
              disabled={sentence.length === 0 || isSpeaking}
              onClick={sayFullSentence}
            >
              {isSpeaking ? (
                <span className="speaking-badge"><i className="bi bi-volume-up-fill" /> Speaking…</span>
              ) : (
                <><i className="bi bi-play-fill me-1" />Say it!</>
              )}
            </button>
            <button
              className="btn btn-sm btn-outline-secondary rounded-3"
              onClick={clearSentence}
              disabled={sentence.length === 0}
            >
              <i className="bi bi-trash me-1" />Clear
            </button>
          </div>

          {/* Category tabs — only show unlocked */}
          <div className="category-tabs">
            {PECS_CATEGORIES
              .filter(c => currentLevel.categories.includes(c.id))
              .map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`category-tab ${activeCategory === c.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.icon} {c.label}
                </button>
              ))}
          </div>
        </>
      )}

      {/* ---- PECS Grid ---- */}
      <div className="pecs-grid">
        {visibleItems.map(item => (
          <button
            key={item.id}
            type="button"
            className={`pecs-card ${cardState[item.id] ?? ''}`}
            onClick={() => mode === 'free' ? handleFreeCardTap(item) : handleGuidedCardTap(item)}
          >
            <span className="pecs-emoji">{item.emoji}</span>
            <span className="pecs-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Free Mode — finish session button */}
      {mode === 'free' && (
        <button
          className="btn btn-outline-secondary w-100 mt-4 rounded-3 fw-semibold"
          onClick={finishFreeSession}
        >
          <i className="bi bi-check2-circle me-1" /> Finish Session
        </button>
      )}
    </div>
  );
}
