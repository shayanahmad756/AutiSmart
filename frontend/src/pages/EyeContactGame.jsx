import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useChild } from '../context/ChildContext';

const LEVELS = [
  { level: 1,  goalSeconds: 2,  character: '🦄', backgroundColor: '#e8f5e9', difficultyLabel: 'Easy',   distractions: false },
  { level: 2,  goalSeconds: 2,  character: '🌟', backgroundColor: '#e3f2fd', difficultyLabel: 'Easy',   distractions: false },
  { level: 3,  goalSeconds: 3,  character: '🐶', backgroundColor: '#fff8e1', difficultyLabel: 'Easy',   distractions: false },
  { level: 4,  goalSeconds: 3,  character: '🦋', backgroundColor: '#fce4ec', difficultyLabel: 'Easy',   distractions: false },
  { level: 5,  goalSeconds: 4,  character: '🐸', backgroundColor: '#e8eaf6', difficultyLabel: 'Easy',   distractions: false },
  { level: 6,  goalSeconds: 5,  character: '🚀', backgroundColor: '#e0f7fa', difficultyLabel: 'Medium', distractions: true  },
  { level: 7,  goalSeconds: 6,  character: '🌈', backgroundColor: '#f3e5f5', difficultyLabel: 'Medium', distractions: true  },
  { level: 8,  goalSeconds: 7,  character: '🎈', backgroundColor: '#fff3e0', difficultyLabel: 'Medium', distractions: true  },
  { level: 9,  goalSeconds: 7,  character: '🐉', backgroundColor: '#e8f5e9', difficultyLabel: 'Medium', distractions: true  },
  { level: 10, goalSeconds: 8,  character: '🎪', backgroundColor: '#fbe9e7', difficultyLabel: 'Medium', distractions: true  },
  { level: 11, goalSeconds: 10, character: '🏆', backgroundColor: '#efebe9', difficultyLabel: 'Hard',   distractions: true  },
  { level: 12, goalSeconds: 11, character: '🌊', backgroundColor: '#e0f2f1', difficultyLabel: 'Hard',   distractions: true  },
  { level: 13, goalSeconds: 12, character: '🔥', backgroundColor: '#fce4ec', difficultyLabel: 'Hard',   distractions: true  },
  { level: 14, goalSeconds: 13, character: '⚡', backgroundColor: '#fffde7', difficultyLabel: 'Hard',   distractions: true  },
  { level: 15, goalSeconds: 15, character: '🌠', backgroundColor: '#e8eaf6', difficultyLabel: 'Hard',   distractions: true  },
];

const CONFETTI_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff90e8', '#a8ff78', '#ffb347', '#b19cd9'];
const DISTRACTION_EMOJIS = ['🎵', '🎶', '🎭', '🎨', '🏐', '🎮', '🎠', '🧸', '🎁', '🍭'];
const STORAGE_KEY = 'eyeContactGame';

const Confetti = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${(i * 337) % 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${((i * 0.11) % 0.85).toFixed(2)}s`,
        size: `${8 + (i * 3) % 12}px`,
        duration: `${(1.2 + (i * 0.07) % 1.0).toFixed(2)}s`,
        round: i % 3 !== 0,
      })),
    []
  );
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute', top: '-20px', left: p.left,
            width: p.size, height: p.size, backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
};

const DistractionItems = ({ count }) => {
  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: DISTRACTION_EMOJIS[i % DISTRACTION_EMOJIS.length],
    top: `${10 + ((i * 73) % 70)}%`,
    left: i % 2 === 0 ? `${2 + ((i * 17) % 12)}%` : `${78 + ((i * 11) % 12)}%`,
    delay: `${(i * 0.38).toFixed(2)}s`,
    fontSize: `${28 + (i * 7) % 30}px`,
  }));
  return (
    <>
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            position: 'absolute', top: it.top, left: it.left, fontSize: it.fontSize,
            animation: `floatDistraction 2.6s ${it.delay} ease-in-out infinite`,
            pointerEvents: 'none', userSelect: 'none', zIndex: 1,
          }}
        >
          {it.emoji}
        </div>
      ))}
    </>
  );
};

const EyeContactGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { autoStart, maxLevel } = location.state || {};
  const { selectedChild } = useChild();

  const [gamePhase, setGamePhase]                   = useState('idle');
  const [currentLevelIndex, setCurrentLevelIndex]   = useState(0);
  const [gazeTime, setGazeTime]                     = useState(0);
  const [score, setScore]                           = useState(0);
  const [showConfetti, setShowConfetti]             = useState(false);
  const [encouragement, setEncouragement]           = useState('');
  const [cameraError, setCameraError]               = useState(false);
  const [mediapipeReady, setMediapipeReady]         = useState(false);
  const [faceDetected, setFaceDetected]             = useState(false);
  const [calibrationCountdown, setCalibrationCountdown] = useState(5);
  const [spaceKeyMode, setSpaceKeyMode]             = useState(false);
  const [spaceHeld, setSpaceHeld]                   = useState(false);

  const webcamRef              = useRef(null);
  const faceMeshRef            = useRef(null);
  const cameraRef              = useRef(null);
  const gazeIntervalRef        = useRef(null);
  const calibTimerRef          = useRef(null);
  const faceDetectedRef        = useRef(false);
  const gamePhaseRef           = useRef('idle');
  const gazeTimeRef            = useRef(0);
  const currentLevelIndexRef   = useRef(0);
  const goalSecondsRef         = useRef(2);
  const scoreRef               = useRef(0);
  const handleLevelCompleteRef = useRef(null);
  const startGazeTimerRef      = useRef(null);

  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);
  useEffect(() => { gazeTimeRef.current  = gazeTime;  }, [gazeTime]);
  useEffect(() => { scoreRef.current     = score;     }, [score]);
  useEffect(() => {
    currentLevelIndexRef.current = currentLevelIndex;
    goalSecondsRef.current       = LEVELS[currentLevelIndex].goalSeconds;
  }, [currentLevelIndex]);

  // Restore saved progress
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (typeof saved.currentLevelIndex === 'number') {
        const maxIdx = maxLevel != null ? maxLevel - 1 : LEVELS.length - 1;
        const clamped = Math.min(saved.currentLevelIndex, maxIdx, LEVELS.length - 1);
        setCurrentLevelIndex(clamped);
        currentLevelIndexRef.current = clamped;
        goalSecondsRef.current = LEVELS[clamped].goalSeconds;
      }
      if (typeof saved.score === 'number') {
        setScore(saved.score);
        scoreRef.current = saved.score;
      }
    } catch (_) {}
  }, []);

  // Auto-start when navigated from Games page
  useEffect(() => {
    if (autoStart) {
      const t = setTimeout(() => handleStart(), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProgress = useCallback((lvlIdx, sc) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentLevelIndex: lvlIdx, score: sc })); } catch (_) {}
  }, []);

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const tag = document.createElement('script');
      tag.src = src; tag.async = true;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(tag);
    });

  // Load MediaPipe from CDN
  useEffect(() => {
    let cancelled = false;
    const CDN = 'https://cdn.jsdelivr.net/npm';
    Promise.all([
      loadScript(`${CDN}/@mediapipe/face_mesh/face_mesh.js`),
      loadScript(`${CDN}/@mediapipe/camera_utils/camera_utils.js`),
    ])
      .then(() => { if (!cancelled) setMediapipeReady(true); })
      .catch(() => { if (!cancelled) { setSpaceKeyMode(true); setMediapipeReady(true); } });
    return () => { cancelled = true; };
  }, []);

  const onFaceMeshResults = useCallback((results) => {
    const detected = !!(results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0);
    faceDetectedRef.current = detected;
    setFaceDetected(detected);
  }, []);

  const initMediaPipe = useCallback(() => {
    if (!window.FaceMesh || !window.Camera) return;
    const videoEl = webcamRef.current?.video;
    if (!videoEl) return;
    const faceMesh = new window.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    faceMesh.onResults(onFaceMeshResults);
    faceMeshRef.current = faceMesh;
    const camera = new window.Camera(videoEl, {
      onFrame: async () => { if (faceMeshRef.current) await faceMeshRef.current.send({ image: videoEl }); },
      width: 640, height: 480,
    });
    cameraRef.current = camera;
    camera.start().catch(() => { setCameraError(true); setSpaceKeyMode(true); });
  }, [onFaceMeshResults]);

  // SPACE key fallback
  useEffect(() => {
    if (!spaceKeyMode) return;
    const onDown = (e) => { if (e.code === 'Space') { e.preventDefault(); setSpaceHeld(true); faceDetectedRef.current = true; } };
    const onUp   = (e) => { if (e.code === 'Space') { setSpaceHeld(false); faceDetectedRef.current = false; } };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [spaceKeyMode]);

  const playRewardSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.75);
    } catch (_) {}
  }, []);

  const startGazeTimer = useCallback(() => {
    clearInterval(gazeIntervalRef.current);
    gazeIntervalRef.current = setInterval(() => {
      if (gamePhaseRef.current !== 'playing') return;
      if (faceDetectedRef.current) {
        const next = parseFloat((gazeTimeRef.current + 0.1).toFixed(1));
        gazeTimeRef.current = next;
        setGazeTime(next);
        setEncouragement('');
        if (next >= goalSecondsRef.current) {
          clearInterval(gazeIntervalRef.current);
          handleLevelCompleteRef.current?.();
        }
      } else {
        gazeTimeRef.current = 0;
        setGazeTime(0);
        setEncouragement(Math.random() > 0.5 ? '👀 Look at me!' : '✨ Keep looking!');
      }
    }, 100);
  }, []);
  startGazeTimerRef.current = startGazeTimer;

  const handleLevelComplete = useCallback(() => {
    clearInterval(gazeIntervalRef.current);
    setGamePhase('levelComplete'); gamePhaseRef.current = 'levelComplete';
    setShowConfetti(true); playRewardSound();
    const lvlIdx = currentLevelIndexRef.current;
    const lvlCfg = LEVELS[lvlIdx];
    const bonus  = lvlCfg.difficultyLabel === 'Hard' ? 3 : lvlCfg.difficultyLabel === 'Medium' ? 2 : 1;
    const newScore = scoreRef.current + 100 * bonus;
    scoreRef.current = newScore; setScore(newScore); saveProgress(lvlIdx, newScore);
    setTimeout(() => {
      setShowConfetti(false);
      const nextIdx = lvlIdx + 1;
      const maxIdx = maxLevel != null ? maxLevel - 1 : LEVELS.length - 1;
      if (nextIdx > maxIdx || nextIdx >= LEVELS.length) {
        setGamePhase('gameComplete'); gamePhaseRef.current = 'gameComplete';
        saveProgress(0, 0);
      } else {
        setCurrentLevelIndex(nextIdx); currentLevelIndexRef.current = nextIdx;
        goalSecondsRef.current = LEVELS[nextIdx].goalSeconds;
        gazeTimeRef.current = 0; setGazeTime(0); setEncouragement('');
        setGamePhase('playing'); gamePhaseRef.current = 'playing';
        startGazeTimerRef.current();
      }
    }, 3000);
  }, [playRewardSound, saveProgress]);
  handleLevelCompleteRef.current = handleLevelComplete;

  const startCalibration = useCallback(() => {
    setGamePhase('calibrating'); gamePhaseRef.current = 'calibrating';
    setCalibrationCountdown(5);
    let count = 5;
    calibTimerRef.current = setInterval(() => {
      count -= 1; setCalibrationCountdown(count);
      if (count <= 0) {
        clearInterval(calibTimerRef.current);
        gazeTimeRef.current = 0; setGazeTime(0);
        setGamePhase('playing'); gamePhaseRef.current = 'playing';
        startGazeTimerRef.current();
      }
    }, 1000);
  }, []);

  const handleStart = useCallback(() => {
    setEncouragement('');
    if (spaceKeyMode) {
      setGamePhase('playing'); gamePhaseRef.current = 'playing';
      gazeTimeRef.current = 0; setGazeTime(0);
      startGazeTimerRef.current();
    } else {
      startCalibration();
    }
  }, [spaceKeyMode, startCalibration]);

  const handleWebcamReady = useCallback(() => {
    if (mediapipeReady && !spaceKeyMode) setTimeout(initMediaPipe, 600);
  }, [mediapipeReady, spaceKeyMode, initMediaPipe]);

  const handleWebcamError = useCallback(() => { setCameraError(true); setSpaceKeyMode(true); }, []);

  const handlePause = useCallback(() => {
    if (gamePhase === 'playing') {
      clearInterval(gazeIntervalRef.current);
      setGamePhase('paused'); gamePhaseRef.current = 'paused';
    } else if (gamePhase === 'paused') {
      setGamePhase('playing'); gamePhaseRef.current = 'playing';
      startGazeTimerRef.current();
    }
  }, [gamePhase]);

  const handleSkip = useCallback(() => {
    clearInterval(gazeIntervalRef.current);
    const nextIdx = currentLevelIndexRef.current + 1;
    const maxIdx = maxLevel != null ? maxLevel - 1 : LEVELS.length - 1;
    if (nextIdx > maxIdx || nextIdx >= LEVELS.length) {
      setGamePhase('gameComplete'); gamePhaseRef.current = 'gameComplete';
    } else {
      setCurrentLevelIndex(nextIdx); currentLevelIndexRef.current = nextIdx;
      goalSecondsRef.current = LEVELS[nextIdx].goalSeconds;
      gazeTimeRef.current = 0; setGazeTime(0); setEncouragement('');
      setGamePhase('playing'); gamePhaseRef.current = 'playing';
      startGazeTimerRef.current();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(gazeIntervalRef.current);
      clearInterval(calibTimerRef.current);
      try { cameraRef.current?.stop(); } catch (_) {}
      try { faceMeshRef.current?.close(); } catch (_) {}
    };
  }, []);

  const currentLevel    = LEVELS[currentLevelIndex];
  const progressPct     = Math.min((gazeTime / currentLevel.goalSeconds) * 100, 100);
  const difficultyColor = currentLevel.difficultyLabel === 'Hard' ? '#ef5350' : currentLevel.difficultyLabel === 'Medium' ? '#ffa726' : '#66bb6a';
  const nDistractions   = currentLevel.difficultyLabel === 'Hard' ? 8 : currentLevel.difficultyLabel === 'Medium' ? 5 : 0;

  const cardStyle = {
    background: currentLevel.backgroundColor,
    borderRadius: '24px',
    padding: '28px 32px 32px',
    maxWidth: '680px',
    margin: '0 auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '370px',
  };

  // ── Game Complete screen ─────────────────────────────────────────────────
  if (gamePhase === 'gameComplete') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <style>{`@keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
        <Confetti />
        <div style={{ background: '#fff', borderRadius: '28px', padding: '48px 40px', textAlign: 'center', maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.30)' }}>
          <div style={{ fontSize: '88px', marginBottom: '8px' }}>🏆</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#5c35a0', marginBottom: '8px' }}>Amazing!</h1>
          <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '20px' }}>You completed all 15 levels!</p>
          <div style={{ background: 'linear-gradient(135deg, #ffd700, #ffb300)', borderRadius: '16px', padding: '14px 28px', marginBottom: '24px', display: 'inline-block' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#5d4037' }}>⭐ Final Score: {score}</span>
          </div>
          {selectedChild && (
            <p style={{ color: '#9c27b0', fontWeight: '700', marginBottom: '20px', fontSize: '1.1rem' }}>
              Great work, {selectedChild.name}! 🎉
            </p>
          )}
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button
              className="btn btn-success btn-lg rounded-pill px-4"
              style={{ fontWeight: '800' }}
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setCurrentLevelIndex(0); currentLevelIndexRef.current = 0;
                goalSecondsRef.current = LEVELS[0].goalSeconds;
                setScore(0); scoreRef.current = 0;
                gazeTimeRef.current = 0; setGazeTime(0);
                setEncouragement(''); setShowConfetti(false);
                setGamePhase('idle'); gamePhaseRef.current = 'idle';
              }}
            >🔄 Play Again</button>
            <button
              className="btn btn-outline-secondary btn-lg rounded-pill px-4"
              style={{ fontWeight: '700' }}
              onClick={() => navigate('/games')}
            >🏠 Back to Games</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main game UI ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdf4 100%)', padding: '20px 12px' }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh)  rotate(720deg); opacity: 0; }
        }
        @keyframes characterBounce {
          0%, 100% { transform: scale(1)    translateY(0px);  }
          50%       { transform: scale(1.15) translateY(-14px); }
        }
        @keyframes floatDistraction {
          0%   { transform: translateY(0px)   rotate(0deg);  }
          50%  { transform: translateY(-32px) rotate(16deg); }
          100% { transform: translateY(0px)   rotate(0deg);  }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1;    }
          50%       { opacity: 0.38; }
        }
        @keyframes shimmerGold {
          0%, 100% { box-shadow: 0 6px 24px rgba(102,126,234,0.40); }
          50%       { box-shadow: 0 6px 36px rgba(255,215,0,0.75);   }
        }
      `}</style>

      {showConfetti && <Confetti />}

      {/* Header */}
      <div style={{ maxWidth: '680px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button
          className="btn btn-outline-secondary rounded-pill"
          style={{ fontWeight: '700' }}
          onClick={() => { clearInterval(gazeIntervalRef.current); clearInterval(calibTimerRef.current); navigate('/games'); }}
        >← Back</button>
        <h2 style={{ fontWeight: '900', fontSize: '1.55rem', margin: 0, color: '#3730a3' }}>👁️ Eye Contact Game</h2>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '6px 18px', fontWeight: '800', color: '#f59e0b', fontSize: '1.15rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          ⭐ {score}
        </div>
      </div>

      {/* Game card */}
      <div style={cardStyle}>
        {gamePhase === 'playing' && currentLevel.distractions && <DistractionItems count={nDistractions} />}

        {/* Level info bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
          <span style={{ background: difficultyColor, color: '#fff', borderRadius: '20px', padding: '5px 18px', fontWeight: '800', fontSize: '0.88rem' }}>
            {currentLevel.difficultyLabel}
          </span>
          <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#374151' }}>
            Level {currentLevel.level}<span style={{ color: '#9ca3af', fontWeight: '400' }}> / {LEVELS.length}</span>
          </span>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '600' }}>🎯 {currentLevel.goalSeconds}s</span>
        </div>

        {/* ── Calibrating phase ── */}
        {gamePhase === 'calibrating' && (
          <div style={{ textAlign: 'center', padding: '12px 0', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '68px', marginBottom: '10px', animation: 'pulse 1s ease-in-out infinite' }}>📷</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e3a5f', marginBottom: '6px' }}>Look at the screen!</h3>
            <p style={{ color: '#555', fontSize: '1rem', marginBottom: '14px' }}>Setting up your camera…</p>
            <div style={{ fontSize: '4.5rem', fontWeight: '900', color: '#2563eb', animation: 'pulse 0.8s ease-in-out infinite', lineHeight: 1 }}>
              {calibrationCountdown}
            </div>
            <div style={{ marginTop: '18px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.72)', borderRadius: '20px', padding: '6px 18px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: faceDetected ? '#22c55e' : '#ef4444', animation: 'pulse 1s ease-in-out infinite' }} />
              <span style={{ color: faceDetected ? '#15803d' : '#dc2626', fontWeight: '700', fontSize: '0.95rem' }}>
                {faceDetected ? '✓ Face detected' : 'No face detected — move closer!'}
              </span>
            </div>
          </div>
        )}

        {/* ── Idle phase ── */}
        {gamePhase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '10px 0', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '92px', display: 'inline-block', marginBottom: '16px', animation: 'characterBounce 2s ease-in-out infinite' }}>
              {currentLevel.character}
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#1e3a5f', marginBottom: '10px' }}>Ready to play? 🎉</h3>
            <p style={{ fontSize: '1.05rem', color: '#555', marginBottom: '6px' }}>
              {spaceKeyMode
                ? '⌨️ Hold SPACE to simulate eye contact!'
                : `Look at ${currentLevel.character} and hold your gaze for ${currentLevel.goalSeconds} seconds!`}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '22px' }}>
              Level {currentLevel.level} of {LEVELS.length} — {currentLevel.difficultyLabel}
            </p>
            {cameraError && (
              <div className="alert alert-warning rounded-4 mb-3" role="alert">
                📷 Camera unavailable — use <kbd>SPACE</kbd> to simulate eye contact!
              </div>
            )}
            <button
              className="btn btn-lg rounded-pill px-5"
              style={{
                fontSize: '1.15rem', fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', color: '#fff',
                animation: mediapipeReady ? 'shimmerGold 2.2s ease-in-out infinite' : 'none',
              }}
              onClick={handleStart}
              disabled={!mediapipeReady}
            >
              {mediapipeReady ? '▶ Start Game!' : '⏳ Loading…'}
            </button>

            {/* How to Play & Tips */}
            <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', maxWidth: '600px', margin: '20px auto 0' }}>
              <div className="card-body p-4">
                <h5 className="mb-3"><i className="bi bi-lightbulb-fill text-warning me-2"></i>How to Play &amp; Tips</h5>
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-2">Level {currentLevel.level} Details:</h6>
                    <ul className="mb-3">
                      <li>Hold gaze for {currentLevel.goalSeconds} seconds</li>
                      <li>Difficulty: {currentLevel.difficultyLabel}</li>
                      <li>Distractions: {currentLevel.distractions ? 'Yes' : 'None'}</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-2">Tips for Success:</h6>
                    <ul className="mb-0">
                      <li>Look directly at the character</li>
                      <li>Stay calm and keep focused</li>
                      <li>Ignore any floating distractions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Playing / Paused phase ── */}
        {(gamePhase === 'playing' || gamePhase === 'paused') && (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{
              fontSize: '96px', display: 'inline-block', marginBottom: '14px',
              animation: (gamePhase === 'playing' && faceDetected) ? 'characterBounce 0.9s ease-in-out infinite' : 'none',
              filter: gamePhase === 'paused' ? 'grayscale(0.65) brightness(0.85)' : 'none',
              transition: 'filter 0.3s',
            }}>
              {currentLevel.character}
            </div>
            {encouragement && gamePhase === 'playing' && (
              <p style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ef4444', animation: 'pulse 0.65s ease-in-out infinite', marginBottom: '6px' }}>
                {encouragement}
              </p>
            )}
            <p style={{ fontWeight: '700', color: '#374151', marginBottom: '4px', fontSize: '1.05rem' }}>
              {gazeTime.toFixed(1)}s &nbsp;/&nbsp; {currentLevel.goalSeconds}s
            </p>
            <div style={{ height: '28px', borderRadius: '14px', background: 'rgba(0,0,0,0.10)', overflow: 'hidden', margin: '10px 0' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`, borderRadius: '14px',
                background: 'linear-gradient(90deg, #26c6da, #00bcd4)',
                transition: 'width 0.1s linear',
                boxShadow: progressPct > 50 ? '0 0 12px rgba(0,188,212,0.55)' : 'none',
              }} />
            </div>
            {gamePhase === 'paused' && (
              <div style={{ background: 'rgba(255,255,255,0.88)', borderRadius: '16px', padding: '12px 28px', marginTop: '10px', display: 'inline-block' }}>
                <span style={{ fontWeight: '900', fontSize: '1.5rem', color: '#374151' }}>⏸ Paused</span>
              </div>
            )}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {spaceKeyMode ? (
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: spaceHeld ? '#8b5cf6' : '#9ca3af' }}>
                  {spaceHeld ? '🟣 SPACE held — gaze active' : '⬜ Hold SPACE to look'}
                </span>
              ) : (
                <>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: faceDetected ? '#22c55e' : '#ef4444' }} />
                  <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{faceDetected ? 'Face detected' : 'Face not detected'}</span>
                </>
              )}
            </div>
            <div className="d-flex gap-3 justify-content-center mt-4">
              <button className="btn btn-outline-secondary rounded-pill px-4" style={{ fontWeight: '700' }} onClick={handlePause}>
                {gamePhase === 'paused' ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button className="btn btn-outline-warning rounded-pill px-4" style={{ fontWeight: '700' }} onClick={handleSkip}>
                ⏭ Skip Level
              </button>
            </div>
          </div>
        )}

        {/* ── Level Complete phase ── */}
        {gamePhase === 'levelComplete' && (
          <div style={{ textAlign: 'center', padding: '14px 0', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '88px', display: 'inline-block', animation: 'characterBounce 0.55s ease-in-out infinite', marginBottom: '6px' }}>🌟</div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#15803d', marginBottom: '8px' }}>Great job! 🎊</h2>
            <p style={{ fontSize: '1.15rem', color: '#555' }}>Level {currentLevel.level} complete! Get ready for the next one…</p>
            <div style={{ marginTop: '12px', display: 'inline-flex', gap: '8px' }}>
              {['⭐', '⭐', '⭐'].map((s, i) => (
                <span key={i} style={{ fontSize: '2rem', animation: `pulse ${0.4 + i * 0.2}s ease-in-out infinite` }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Level progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '18px', flexWrap: 'wrap', maxWidth: '680px', marginLeft: 'auto', marginRight: 'auto' }}>
        {LEVELS.map((lvl, idx) => (
          <div
            key={lvl.level}
            title={`Level ${lvl.level}: ${lvl.difficultyLabel} (${lvl.goalSeconds}s)`}
            style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: idx < currentLevelIndex ? '#22c55e' : idx === currentLevelIndex ? '#3b82f6' : 'rgba(0,0,0,0.13)',
              border: idx === currentLevelIndex ? '3px solid #1d4ed8' : '2px solid transparent',
              transition: 'background 0.4s', cursor: 'default',
            }}
          />
        ))}
      </div>

      {/* Webcam preview (bottom-right) */}
      {!spaceKeyMode && (
        <div style={{
          position: 'fixed', bottom: '16px', right: '16px',
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)', zIndex: 100,
          border: `2px solid ${faceDetected ? '#22c55e' : '#e5e7eb'}`,
          transition: 'border-color 0.3s',
        }}>
          <Webcam
            ref={webcamRef}
            width={120} height={90}
            mirrored
            style={{ display: 'block' }}
            videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
            onUserMedia={handleWebcamReady}
            onUserMediaError={handleWebcamError}
          />
          <div style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', textAlign: 'center', fontSize: '11px', padding: '2px 0', fontWeight: '600' }}>
            📷 Camera
          </div>
        </div>
      )}
    </div>
  );
};

export default EyeContactGame;
