import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import ChildSelector from '../components/ChildSelector';
import childAPI from '../api/child.api';
import '../styles/emotionExplorer.css';

// ─── Emotion Data ─────────────────────────────────────────────────────────────
const EMOTIONS = {
  Happy:        { emoji: '😊', label: 'Happy' },
  Sad:          { emoji: '😢', label: 'Sad' },
  Angry:        { emoji: '😠', label: 'Angry' },
  Surprised:    { emoji: '😲', label: 'Surprised' },
  Scared:       { emoji: '😨', label: 'Scared' },
  Calm:         { emoji: '😌', label: 'Calm' },
  Frustrated:   { emoji: '😤', label: 'Frustrated' },
  Excited:      { emoji: '🤩', label: 'Excited' },
  Confused:     { emoji: '😕', label: 'Confused' },
  Anxious:      { emoji: '😰', label: 'Anxious' },
  Disappointed: { emoji: '😔', label: 'Disappointed' },
  Jealous:      { emoji: '😒', label: 'Jealous' },
  Embarrassed:  { emoji: '😳', label: 'Embarrassed' },
  Proud:        { emoji: '😍', label: 'Proud' },
  Annoyed:      { emoji: '😑', label: 'Annoyed' },
};

// ─── Level Configuration ──────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, name: 'Beginner',     color: 'success', pool: ['Happy','Sad','Angry','Surprised'],                                                                 rounds: 6,  timeLimit: 12 },
  { level: 2, name: 'Beginner+',    color: 'success', pool: ['Happy','Sad','Angry','Surprised'],                                                                 rounds: 6,  timeLimit: 11 },
  { level: 3, name: 'Elementary',   color: 'info',    pool: ['Happy','Sad','Angry','Surprised','Scared','Calm'],                                                 rounds: 7,  timeLimit: 11 },
  { level: 4, name: 'Elementary+',  color: 'info',    pool: ['Happy','Sad','Angry','Surprised','Scared','Calm'],                                                 rounds: 7,  timeLimit: 10 },
  { level: 5, name: 'Intermediate', color: 'primary', pool: ['Happy','Sad','Angry','Surprised','Scared','Calm','Frustrated','Excited'],                          rounds: 8,  timeLimit: 10 },
  { level: 6, name: 'Intermediate+',color: 'primary', pool: ['Happy','Sad','Angry','Surprised','Scared','Calm','Frustrated','Excited'],                          rounds: 8,  timeLimit: 9  },
  { level: 7,  name: 'Advanced',     color: 'warning', pool: ['Happy','Sad','Angry','Surprised','Scared','Calm','Frustrated','Excited','Confused','Anxious','Disappointed'], rounds: 9,  timeLimit: 20, mode: 'scenario' },
  { level: 8,  name: 'Advanced+',    color: 'warning', pool: ['Happy','Sad','Angry','Surprised','Scared','Calm','Frustrated','Excited','Confused','Anxious','Disappointed'], rounds: 9,  timeLimit: 18, mode: 'scenario' },
  { level: 9,  name: 'Expert',       color: 'danger',  pool: Object.keys(EMOTIONS),                                                                                         rounds: 10, timeLimit: 16, mode: 'scenario' },
  { level: 10, name: 'Master',       color: 'danger',  pool: Object.keys(EMOTIONS),                                                                                         rounds: 10, timeLimit: 14, mode: 'scenario' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickChoices(correctKey, pool) {
  const distractors = shuffle(pool.filter(k => k !== correctKey)).slice(0, 3);
  return shuffle([correctKey, ...distractors]);
}

// ─── Static fallback scenarios (used when no child or Gemini call fails) ────────
const STATIC_SCENARIOS = [
  { emotion: 'Confused',     scenario: "You read the instructions for a new game but don't understand what to do.",                                            distractors: ['Anxious','Frustrated','Surprised'] },
  { emotion: 'Anxious',      scenario: "Tomorrow is your first day at a new school and you don't know anyone there.",                                           distractors: ['Scared','Excited','Confused'] },
  { emotion: 'Disappointed', scenario: "You worked very hard on a drawing but your teacher didn't choose it for the display.",                                  distractors: ['Sad','Frustrated','Annoyed'] },
  { emotion: 'Jealous',      scenario: "Your sibling gets a brand-new toy but you don't get anything.",                                                         distractors: ['Sad','Angry','Disappointed'] },
  { emotion: 'Embarrassed',  scenario: "You tripped and fell in front of your whole class and everyone looked at you.",                                         distractors: ['Scared','Sad','Confused'] },
  { emotion: 'Proud',        scenario: "You practiced swimming every day for a month and finally swam the full length without stopping!",                       distractors: ['Happy','Excited','Calm'] },
  { emotion: 'Frustrated',   scenario: "You have been trying to solve a puzzle for a long time but the pieces just won't fit.",                                 distractors: ['Annoyed','Angry','Confused'] },
  { emotion: 'Excited',      scenario: "Your parents just told you that you're going to a theme park this weekend!",                                            distractors: ['Happy','Surprised','Proud'] },
  { emotion: 'Scared',       scenario: "You hear a very loud thunderstorm at night when everyone else in your house is asleep.",                                distractors: ['Anxious','Surprised','Confused'] },
  { emotion: 'Sad',          scenario: "Your best friend is moving to a different city and you won't see them every day anymore.",                              distractors: ['Disappointed','Anxious','Embarrassed'] },
  { emotion: 'Angry',        scenario: "Someone keeps interrupting you every time you try to speak and won't let you finish.",                                  distractors: ['Frustrated','Annoyed','Disappointed'] },
  { emotion: 'Calm',         scenario: "You are sitting in a quiet garden listening to birds singing on a warm, sunny afternoon.",                              distractors: ['Happy','Proud','Surprised'] },
  { emotion: 'Surprised',    scenario: "You come home and all your friends jump out to wish you a happy birthday — you had no idea!",                           distractors: ['Excited','Happy','Scared'] },
  { emotion: 'Happy',        scenario: "Your favorite team won the championship and your whole family is cheering together!",                                   distractors: ['Excited','Proud','Surprised'] },
  { emotion: 'Annoyed',      scenario: "Your little sibling keeps poking you and making noises while you are trying to concentrate.",                           distractors: ['Frustrated','Angry','Confused'] },
  { emotion: 'Confused',     scenario: "Everyone in your group laughed at a joke, but you didn't understand why it was funny.",                                 distractors: ['Embarrassed','Anxious','Surprised'] },
  { emotion: 'Disappointed', scenario: "It rained all day on the day of your outdoor birthday party, so it had to be cancelled.",                               distractors: ['Sad','Annoyed','Frustrated'] },
  { emotion: 'Anxious',      scenario: "You have to give a speech in front of your whole class in just five minutes.",                                          distractors: ['Scared','Confused','Embarrassed'] },
  { emotion: 'Proud',        scenario: "You helped your little sibling learn to tie their shoes and they finally did it perfectly!",                            distractors: ['Happy','Excited','Calm'] },
  { emotion: 'Embarrassed',  scenario: "You called your teacher 'Mom' by accident and the whole class heard it.",                                              distractors: ['Confused','Sad','Surprised'] },
  { emotion: 'Jealous',      scenario: "Your best friend has been spending all their free time with a new friend and hardly talks to you.",                     distractors: ['Sad','Disappointed','Angry'] },
  { emotion: 'Frustrated',   scenario: "You keep pressing the button on your toy but it doesn't work no matter what you try.",                                 distractors: ['Confused','Angry','Annoyed'] },
  { emotion: 'Scared',       scenario: "You got separated from your parents in a big, crowded shopping mall.",                                                  distractors: ['Anxious','Confused','Sad'] },
  { emotion: 'Excited',      scenario: "You just found out you've been chosen for the lead role in the school play!",                                          distractors: ['Happy','Surprised','Proud'] },
  { emotion: 'Sad',          scenario: "Your pet goldfish passed away this morning and you had it for three years.",                                            distractors: ['Disappointed','Anxious','Calm'] },
  { emotion: 'Angry',        scenario: "Someone pushed in front of you in the queue even though you had been waiting patiently.",                               distractors: ['Frustrated','Annoyed','Disappointed'] },
  { emotion: 'Surprised',    scenario: "Your teacher announces there is no homework this week — you had absolutely no idea!",                                   distractors: ['Happy','Excited','Confused'] },
  { emotion: 'Happy',        scenario: "You come downstairs on your birthday morning and see a pile of presents waiting for you.",                              distractors: ['Excited','Surprised','Proud'] },
  { emotion: 'Annoyed',      scenario: "You are trying to watch your favourite show but someone keeps talking loudly over it.",                                 distractors: ['Frustrated','Angry','Disappointed'] },
  { emotion: 'Calm',         scenario: "You just finished a warm bath and are now reading your favourite book quietly before bed.",                             distractors: ['Happy','Proud','Surprised'] },
];

function getStaticScenarios(cfg) {
  const filtered = STATIC_SCENARIOS.filter(s =>
    cfg.pool.includes(s.emotion) && s.distractors.every(d => cfg.pool.includes(d))
  );
  return shuffle(filtered).slice(0, cfg.rounds);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const EmotionExplorerGame = () => {
  const navigate = useNavigate();
  const { selectedChild, recordActivity } = useChild();

  // ── Game state
  const [screen, setScreen]           = useState('start');   // start | game | levelComplete | gameOver
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [round, setRound]             = useState(0);         // 0-indexed
  const [score, setScore]             = useState(0);
  const [totalScore, setTotalScore]   = useState(0);
  const [timer, setTimer]             = useState(0);
  const [correctEmotion, setCorrectEmotion] = useState(null);  // key from EMOTIONS
  const [choices, setChoices]         = useState([]);
  const [answered, setAnswered]       = useState(null);      // key selected or 'timeout'
  const [isCorrect, setIsCorrect]     = useState(null);      // true | false | null
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [emotionsStruggled, setEmotionsStruggled] = useState([]);
  const [duration, setDuration]       = useState(0);

  // ── AI Feedback state
  const [aiFeedback, setAiFeedback]       = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // ── Scenario mode state
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // ── Auto-advance countdown (null = inactive)
  const [countdown, setCountdown]         = useState(null);

  // ── Refs
  const timerRef        = useRef(null);
  const startTimeRef    = useRef(null);
  const lastEmotionRef  = useRef(null);
  const countdownRef    = useRef(null);
  const scenariosRef    = useRef([]);   // avoids stale closure in advanceRound
  const selectedChildRef = useRef(selectedChild);
  useEffect(() => { selectedChildRef.current = selectedChild; }, [selectedChild]);

  const levelConfig = LEVELS[currentLevelIdx];

  // ── Build a round ────────────────────────────────────────────────────────────
  const buildRound = useCallback((levelCfg, prevEmotion = null) => {
    let pool = levelCfg.pool;
    let available = pool.length > 1 ? pool.filter(k => k !== prevEmotion) : pool;
    const key = available[Math.floor(Math.random() * available.length)];
    const options = pickChoices(key, pool);
    return { key, options };
  }, []);

  // ── Start a level ────────────────────────────────────────────────────────────
  const startLevel = useCallback(async (levelIdx) => {
    clearInterval(countdownRef.current);
    setCountdown(null);
    const cfg = LEVELS[levelIdx];
    const isScenario = cfg.mode === 'scenario';

    // Reset shared state
    setRound(0);
    setScore(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setEmotionsStruggled([]);
    setAnswered(null);
    setIsCorrect(null);
    setAiFeedback('');
    startTimeRef.current = Date.now();

    if (isScenario) {
      // Show loading screen while generating scenarios
      setLoadingScenarios(true);
      setScreen('loadingScenarios');

      let scenarioList = getStaticScenarios(cfg);
      const child = selectedChildRef.current;
      if (child) {
        try {
          const childId = child._id || child.id;
          const res = await childAPI.getEmotionScenarios(childId, {
            level: cfg.level,
            levelName: cfg.name,
            pool: cfg.pool,
            count: cfg.rounds,
          });
          if (Array.isArray(res.scenarios) && res.scenarios.length >= cfg.rounds) {
            scenarioList = res.scenarios;
          }
        } catch {
          // Silently fall back to static scenarios
        }
      }

      scenariosRef.current = scenarioList;
      setLoadingScenarios(false);

      // Setup first round
      const first = scenarioList[0];
      if (first) {
        setCorrectEmotion(first.emotion);
        setChoices(shuffle([first.emotion, ...first.distractors]));
      }
      setTimer(cfg.timeLimit);
      startTimeRef.current = Date.now();
      setScreen('game');
    } else {
      // Emoji mode
      scenariosRef.current = [];
      const { key, options } = buildRound(cfg);
      lastEmotionRef.current = key;
      setCorrectEmotion(key);
      setChoices(options);
      setTimer(cfg.timeLimit);
      setScreen('game');
    }
  }, [buildRound]);

  // ── Timer countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'game' || answered !== null) return;

    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, round, answered]);

  // ── Handle timeout ───────────────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    clearInterval(timerRef.current);
    setAnswered('timeout');
    setIsCorrect(false);
    setIncorrectAnswers(prev => prev + 1);
    setEmotionsStruggled(prev =>
      prev.includes(correctEmotion) ? prev : [...prev, correctEmotion]
    );

    setTimeout(() => advanceRound(), 1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctEmotion]);

  // ── Handle answer ────────────────────────────────────────────────────────────
  const handleAnswer = useCallback((choiceKey) => {
    if (answered !== null) return;
    clearInterval(timerRef.current);
    setAnswered(choiceKey);

    const correct = choiceKey === correctEmotion;
    setIsCorrect(correct);

    if (correct) {
      const timeBonus = timer * 5;
      const points = 100 + timeBonus;
      setScore(prev => prev + points);
      setTotalScore(prev => prev + points);
      setCorrectAnswers(prev => prev + 1);
    } else {
      setIncorrectAnswers(prev => prev + 1);
      setEmotionsStruggled(prev =>
        prev.includes(correctEmotion) ? prev : [...prev, correctEmotion]
      );
    }

    setTimeout(() => advanceRound(), 1600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, correctEmotion, timer]);

  // ── Advance to next round or end level ───────────────────────────────────────
  const advanceRound = useCallback(() => {
    const cfg = LEVELS[currentLevelIdx];

    setRound(prevRound => {
      const nextRound = prevRound + 1;

      if (nextRound >= cfg.rounds) {
        // Level complete
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        setAnswered(null);
        setIsCorrect(null);
        setScreen('levelComplete');
        return prevRound;
      }

      // Next round
      if (cfg.mode === 'scenario') {
        const next = scenariosRef.current[nextRound];
        if (next) {
          setCorrectEmotion(next.emotion);
          setChoices(shuffle([next.emotion, ...next.distractors]));
        }
      } else {
        const { key, options } = buildRound(cfg, lastEmotionRef.current);
        lastEmotionRef.current = key;
        setCorrectEmotion(key);
        setChoices(options);
      }
      setAnswered(null);
      setIsCorrect(null);
      setTimer(cfg.timeLimit);
      return nextRound;
    });
  }, [currentLevelIdx, buildRound]);

  // ── Fetch AI feedback and save activity on level complete ─────────────────────
  useEffect(() => {
    if (screen !== 'levelComplete') return;

    const cfg = LEVELS[currentLevelIdx];
    const maxScore = cfg.rounds * 150; // 100 base + ~50 avg time bonus
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    // Save activity (fire-and-forget)
    if (selectedChild) {
      recordActivity({
        activityType: 'game',
        activityName: 'Emotion Explorer',
        score,
        maxScore,
        percentage: pct,
        duration,
        attempts: 1,
        difficulty: cfg.name.toLowerCase(),
        correctAnswers,
        incorrectAnswers,
        details: {
          level: cfg.level,
          levelName: cfg.name,
          emotionsStruggled,
          roundsCompleted: cfg.rounds,
        },
      }).catch(err => console.warn('Activity save failed:', err));

      // Fetch AI feedback
      setLoadingFeedback(true);
      childAPI.getEmotionFeedback(selectedChild._id || selectedChild.id, {
        level: cfg.level,
        levelName: cfg.name,
        score,
        maxScore,
        correctAnswers,
        incorrectAnswers,
        emotionsStruggled,
      })
        .then(res => setAiFeedback(res.feedback || ''))
        .catch(() => setAiFeedback(''))
        .finally(() => setLoadingFeedback(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Auto-advance to next level once feedback is ready ──────────────────────
  useEffect(() => {
    const isLastLevel = currentLevelIdx >= LEVELS.length - 1;
    if (screen !== 'levelComplete' || isLastLevel || loadingFeedback) return;

    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          const nextIdx = currentLevelIdx + 1;
          setCurrentLevelIdx(nextIdx);
          startLevel(nextIdx);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, loadingFeedback]);

  const cancelCountdown = () => {
    clearInterval(countdownRef.current);
    setCountdown(null);
  };

  // ── Computed helpers ──────────────────────────────────────────────────────────
  const cfg         = levelConfig;
  const isScenario  = cfg.mode === 'scenario';
  const maxScore  = cfg.rounds * 150;
  const accuracy  = (correctAnswers + incorrectAnswers) > 0
    ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100)
    : 0;
  const timerPct  = cfg.timeLimit > 0 ? (timer / cfg.timeLimit) * 100 : 0;
  const timerColor = timerPct > 50 ? 'safe' : timerPct > 25 ? 'warn' : 'danger';

  // ════════════════════════════════════════════════════════════════════════════
  // ── RENDER: START SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'start') {
    return (
      <div className="container mt-4 mb-5" style={{ maxWidth: 680 }}>
        <ChildSelector />

        <div className="text-center mb-4">
          <div style={{ fontSize: '4rem', lineHeight: 1 }}>😊</div>
          <h1 className="mt-3 text-primary-custom">Emotion Explorer</h1>
          <p className="text-muted">
            {isScenario
              ? <>Read the situation and pick the emotion the person would feel!<br />Levels 7–10 use story-based questions — the hardest challenge.</>  
              : <>Look at the emoji face and pick the correct emotion!<br />10 exciting levels — from basic to expert emotions.</>}
          </p>
        </div>

        <div className="d-flex gap-3 mt-2">
          <button
            className="btn btn-primary flex-fill py-2 fw-semibold"
            onClick={() => startLevel(0)}
          >
            <i className="bi bi-play-fill me-2"></i>Start Game
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/games')}
          >
            <i className="bi bi-arrow-left me-1"></i>Back
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════  // ── RENDER: LOADING SCENARIOS SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'loadingScenarios') {
    return (
      <div className="container mt-5 mb-5 text-center" style={{ maxWidth: 480 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📖</div>
        <h4 className="mb-2">Preparing Story Mode…</h4>
        <p className="text-muted mb-4">
          {selectedChildRef.current
            ? `Generating personalised scenarios for ${selectedChildRef.current.name}…`
            : 'Loading story scenarios…'}
        </p>
        <div className="d-flex justify-content-center gap-2">
          <div className="spinner-grow spinner-grow-sm text-info" />
          <div className="spinner-grow spinner-grow-sm text-warning" style={{ animationDelay: '0.15s' }} />
          <div className="spinner-grow spinner-grow-sm text-success" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════  // ── RENDER: GAME SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'game') {
    return (
      <div className="container mt-4 mb-5" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/games')}
          >
            <i className="bi bi-arrow-left me-1"></i>Back
          </button>
          <div className="text-center">
            <span className={`badge bg-${cfg.color} me-2`}>Level {cfg.level}</span>
            <span className="text-muted small">{cfg.name}</span>
            {isScenario && <span className="badge bg-secondary ms-2">📖 Story</span>}
          </div>
          <div className="text-end">
            <div className="fw-bold text-primary-custom">{score} pts</div>
            <div className="text-muted small">Round {round + 1}/{cfg.rounds}</div>
          </div>
        </div>

        {/* Progress bar (rounds) */}
        <div className="progress mb-3" style={{ height: 6, borderRadius: 8 }}>
          <div
            className={`progress-bar bg-${cfg.color}`}
            style={{ width: `${((round) / cfg.rounds) * 100}%`, transition: 'width 0.4s ease' }}
          />
        </div>

        {/* Timer bar */}
        <div className="timer-bar-wrap">
          <div
            className={`timer-bar ${timerColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
        <div className="text-center mb-3">
          <small className="text-muted">{timer}s remaining</small>
        </div>

        {/* Question Display: scenario card OR emoji */}
        {correctEmotion && (
          isScenario ? (
            <div className="scenario-card" key={`${round}-scenario`}>
              <div className="scenario-icon">📖</div>
              <p className="scenario-text">{scenariosRef.current[round]?.scenario}</p>
              <p className="scenario-prompt">How does this person feel?</p>
            </div>
          ) : (
            <div className="emotion-display">
              <div className="emotion-emoji" key={`${round}-${correctEmotion}`}>
                {EMOTIONS[correctEmotion].emoji}
              </div>
              <div className="emotion-prompt">What emotion is this?</div>
            </div>
          )
        )}

        {/* Answer Choices */}
        <div className="emotion-choices">
          {choices.map(key => {
            let btnClass = 'emotion-btn';
            if (answered !== null) {
              if (key === correctEmotion)       btnClass += answered !== null && isCorrect === false ? ' reveal-correct' : ' correct';
              if (key === answered && !isCorrect) btnClass += ' wrong';
            }

            return (
              <button
                key={key}
                className={btnClass}
                onClick={() => handleAnswer(key)}
                disabled={answered !== null}
              >
                {EMOTIONS[key].emoji} {EMOTIONS[key].label}
              </button>
            );
          })}
        </div>

        {/* Answer feedback */}
        {answered !== null && (
          <div className={`alert mt-4 text-center fw-semibold ${isCorrect ? 'alert-success' : 'alert-danger'}`}>
            {isCorrect
              ? `✅ Correct! That's ${EMOTIONS[correctEmotion].label}!`
              : answered === 'timeout'
                ? `⏱ Time's up! It was ${EMOTIONS[correctEmotion].label}`
                : `❌ Not quite! It was ${EMOTIONS[correctEmotion].label}`}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── RENDER: LEVEL COMPLETE SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'levelComplete') {
    const isLastLevel = currentLevelIdx >= LEVELS.length - 1;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;

    return (
      <div className="container mt-4 mb-5" style={{ maxWidth: 580 }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: '3.5rem' }}>{'⭐'.repeat(stars)}</div>
          <h2 className="mt-2">
            {isLastLevel ? '🏆 You Beat All Levels!' : `Level ${cfg.level} Complete!`}
          </h2>
          <span className={`badge bg-${cfg.color} fs-6 mt-1`}>{cfg.name}</span>
        </div>

        {/* Score Stats */}
        <div className="row g-3 mb-4 text-center">
          <div className="col-4">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
              <div className="fw-bold fs-4 text-primary">{score}</div>
              <small className="text-muted">Score</small>
            </div>
          </div>
          <div className="col-4">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
              <div className="fw-bold fs-4 text-success">{accuracy}%</div>
              <small className="text-muted">Accuracy</small>
            </div>
          </div>
          <div className="col-4">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
              <div className="fw-bold fs-4 text-info">{duration}s</div>
              <small className="text-muted">Time</small>
            </div>
          </div>
        </div>

        {/* Correct / Incorrect */}
        <div className="d-flex justify-content-center gap-3 mb-4">
          <span className="badge bg-success fs-6 px-3 py-2">
            ✅ {correctAnswers} Correct
          </span>
          <span className="badge bg-danger fs-6 px-3 py-2">
            ❌ {incorrectAnswers} Wrong
          </span>
        </div>

        {/* Emotions Struggled */}
        {emotionsStruggled.length > 0 && (
          <div className="alert alert-warning text-center mb-4">
            <strong>Practice these emotions:</strong>{' '}
            {emotionsStruggled.map(k => `${EMOTIONS[k]?.emoji} ${k}`).join('  •  ')}
          </div>
        )}

        {/* AI Feedback */}
        {selectedChild && (
          <div className="mb-4">
            {loadingFeedback ? (
              <div className="d-flex align-items-center justify-content-center gap-3 p-4 text-muted">
                <div className="spinner-border spinner-border-sm text-info" />
                <span>Getting personalized feedback…</span>
              </div>
            ) : aiFeedback ? (
              <div className="feedback-card">
                <div className="feedback-icon">🤖</div>
                <p>{aiFeedback}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Auto-advance banner */}
        {!isLastLevel && countdown !== null && (
          <div
            className="d-flex align-items-center justify-content-between mb-3 px-3 py-2 rounded-3"
            style={{ background: 'rgba(97,195,180,0.12)', border: '1.5px solid rgba(97,195,180,0.35)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#e0e0e0" strokeWidth="3.5" />
                <circle
                  cx="22" cy="22" r="18"
                  fill="none" stroke="#61C3B4" strokeWidth="3.5"
                  strokeDasharray={`${(countdown / 5) * 113.1} 113.1`}
                  strokeLinecap="round"
                  transform="rotate(-90 22 22)"
                  style={{ transition: 'stroke-dasharray 0.9s linear' }}
                />
                <text x="22" y="27" textAnchor="middle" fontSize="13" fontWeight="700" fill="#61C3B4">
                  {countdown}
                </text>
              </svg>
              <span className="fw-semibold" style={{ color: '#2d7a70' }}>
                Next level in {countdown}s…
              </span>
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={cancelCountdown}>
              Cancel
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex flex-column gap-3">
          {!isLastLevel && (
            <button
              className="btn btn-primary py-2 fw-semibold"
              onClick={() => {
                cancelCountdown();
                const nextIdx = currentLevelIdx + 1;
                setCurrentLevelIdx(nextIdx);
                startLevel(nextIdx);
              }}
            >
              <i className="bi bi-arrow-right-circle-fill me-2"></i>
              Next Level — {LEVELS[currentLevelIdx + 1]?.name}
            </button>
          )}
          <button
            className="btn btn-outline-secondary py-2"
            onClick={() => { cancelCountdown(); startLevel(currentLevelIdx); }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>Replay This Level
          </button>
          <button
            className="btn btn-outline-primary py-2"
            onClick={() => { cancelCountdown(); setScreen('start'); }}
          >
            <i className="bi bi-list-ul me-2"></i>Choose Level
          </button>
          <button
            className="btn btn-link text-muted"
            onClick={() => { cancelCountdown(); navigate('/games'); }}
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default EmotionExplorerGame;
