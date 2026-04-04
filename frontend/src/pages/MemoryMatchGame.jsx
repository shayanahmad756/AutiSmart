import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChild } from '../context/ChildContext';

const MemoryMatchGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { autoStart, maxLevel } = location.state || {};
  const { selectedChild, recordActivity } = useChild();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [bestTimes, setBestTimes] = useState({});
  const [showPreview, setShowPreview] = useState(true);
  const [previewTimer, setPreviewTimer] = useState(5);
  const [gameFailed, setGameFailed] = useState(false);

  // All available symbols - daily-use items children recognise
  const allSymbols = [
    // Animals (familiar)
    '🐱', '🐶', '🐰', '🐹', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁',
    '🐮', '🐷', '🐸', '🐢', '🦆', '🐧', '🐔', '🦋', '🐝', '🐟',
    // Food & fruits
    '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🍌', '🍉', '🍍',
    '🥝', '🍅', '🥦', '🥕', '🌽', '🍞', '🧇', '🥞', '🍳', '🥚',
    '🍕', '🍔', '🌮', '🥛', '🍵', '🧃', '🍰', '🎂', '🍩', '🍪',
    // Clothing & accessories
    '👕', '👖', '👗', '🧥', '👒', '🧢', '👟', '🧤', '🧣', '🎒',
    // Home & everyday objects
    '🛏️', '🚿', '🪥', '🚽', '🪑', '📺', '💻', '📱', '🔑', '🪴',
    '🧹', '🧺', '🪞', '🕯️', '🛒', '🧸', '🎁', '🎀', '🎈', '🪆',
    // School items
    '📚', '✏️', '📝', '📐', '📏', '🖊️', '🎨', '✂️', '📌', '📎',
    // Transport (child-friendly)
    '🚗', '🚌', '🚲', '🛴', '✈️', '🚂', '🚑', '🚒', '⛵', '🚀',
    // Nature & weather
    '🌸', '🌺', '🌻', '🌼', '🌷', '🌿', '🍃', '🌊', '🌈', '☀️',
    '🌙', '⭐', '❄️', '🔥', '🌧️', '⛅', '🌵', '🍄', '🌱', '🍂',
    // Sports & play
    '⚽', '🏀', '🎾', '🏐', '🏈', '⚾', '🎱', '🏊', '🚴', '🎿',
    // Toys
    '🧩', '🎯', '🎲', '🪀', '🎸', '🎺', '🎹', '🎭', '🎪', '🎠',
    // Facial & family
    '😊', '😂', '😍', '🤗', '😴', '👶', '👧', '👦', '👩', '👨',
    // Miscellaneous daily-use
    '📸', '⌚', '💡', '🔦', '🌂', '🧲', '🎵', '🎶', '🖼️', '🗝️',
    '🧃', '🍦', '🥤', '☕', '🍽️', '🥄', '🍴', '🔔', '📫', '🎙️',
    '🧼', '🪣', '💊', '🩺', '🩹', '🎓', '🏫', '⛪', '🏥', '🏦',
    '🚦', '⛽', '🚧', '🅿️', '🛒', '🗑️', '📦', '🧴', '🧻', '🪟',
    '🪤', '🧯', '🚪', '🪜', '🧲', '🔧', '🔨', '🪓', '🗡️', '🛡️'
  ];

  // Level configurations - 10 levels (gradual progression with square grids)
  const levels = [
    { level: 1, gridSize: 2, time: 40, name: 'Beginner', color: 'success', maxMoves: 10 },       // 2x2 grid (4 cards = 2 pairs)
    { level: 2, gridSize: 3, time: 50, name: 'Easy', color: 'success', maxMoves: 15 },           // 3x3 grid (9 cards = 4 pairs + 1 single)
    { level: 3, gridSize: 4, time: 70, name: 'Simple', color: 'info', maxMoves: 20 },            // 4x4 grid (16 cards = 8 pairs)
    { level: 4, gridSize: 5, time: 90, name: 'Medium', color: 'info', maxMoves: 28 },            // 5x5 grid (25 cards = 12 pairs + 1 single)
    { level: 5, gridSize: 6, time: 110, name: 'Intermediate', color: 'warning', maxMoves: 36 },  // 6x6 grid (36 cards = 18 pairs)
    { level: 6, gridSize: 7, time: 140, name: 'Challenging', color: 'warning', maxMoves: 45 },   // 7x7 grid (49 cards = 24 pairs + 1 single)
    { level: 7, gridSize: 8, time: 170, name: 'Hard', color: 'danger', maxMoves: 55 },           // 8x8 grid (64 cards = 32 pairs)
    { level: 8, gridSize: 9, time: 210, name: 'Very Hard', color: 'danger', maxMoves: 70 },      // 9x9 grid (81 cards = 40 pairs + 1 single)
    { level: 9, gridSize: 10, time: 250, name: 'Expert', color: 'primary', maxMoves: 85 },       // 10x10 grid (100 cards = 50 pairs)
    { level: 10, gridSize: 11, time: 300, name: 'Master', color: 'dark', maxMoves: 100 }         // 11x11 grid (121 cards = 60 pairs + 1 single)
  ];

  const currentLevelConfig = levels[currentLevel - 1];

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [currentLevel]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          const next = prevTimer + 1;
          if (next >= currentLevelConfig.time) {
            setIsRunning(false);
            setGameFailed(true);
            return currentLevelConfig.time;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentLevelConfig.time]);

  // Preview timer effect
  useEffect(() => {
    let interval;
    if (showPreview && previewTimer > 0) {
      interval = setInterval(() => {
        setPreviewTimer((prev) => prev - 1);
      }, 1000);
    } else if (previewTimer === 0 && showPreview) {
      setShowPreview(false);
    }
    return () => clearInterval(interval);
  }, [showPreview, previewTimer]);

  const initializeGame = () => {
    // Calculate total cards needed for square grid
    const totalCards = currentLevelConfig.gridSize * currentLevelConfig.gridSize;
    const pairs = Math.floor(totalCards / 2);
    
    // Get symbols for current level
    const levelSymbols = allSymbols.slice(0, pairs);
    
    // Create pairs of cards
    let cardPairs = [...levelSymbols, ...levelSymbols];
    
    // If odd number of cards, add one more random symbol
    if (totalCards % 2 !== 0) {
      cardPairs.push(allSymbols[pairs]);
    }
    
    // Shuffle and create card objects
    const shuffledCards = cardPairs
      .map((symbol, index) => ({
        id: index,
        symbol,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameWon(false);
    setTimer(0);
    setIsRunning(false);
    setShowPreview(true);
    setPreviewTimer(5);
    setGameFailed(false);
  };

  const calculateScore = () => {
    const timeBonus = Math.max(0, currentLevelConfig.time - timer) * 10;
    const moveBonus = Math.max(0, (currentLevelConfig.maxMoves - moves)) * 20;
    const levelBonus = currentLevel * 100;
    return timeBonus + moveBonus + levelBonus;
  };

  const handleCardClick = (index) => {
    // Don't allow clicking during preview
    if (showPreview) {
      return;
    }

    // Start timer on first click
    if (!isRunning && moves === 0) {
      setIsRunning(true);
    }

    // Don't allow clicking if two cards are already flipped or card is already matched
    if (flipped.length === 2 || matched.includes(index) || flipped.includes(index)) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    // Check for match when two cards are flipped
    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [firstIndex, secondIndex] = newFlipped;

      if (cards[firstIndex].symbol === cards[secondIndex].symbol) {
        // Match found
        const newMatched = [...matched, firstIndex, secondIndex];
        setMatched(newMatched);
        setFlipped([]);

        // Check if level is complete (all pairs matched, excluding single card if exists)
        const totalCards = currentLevelConfig.gridSize * currentLevelConfig.gridSize;
        const isComplete = totalCards % 2 === 0 
          ? newMatched.length === totalCards 
          : newMatched.length === totalCards - 1;
          
        if (isComplete) {
          const score = calculateScore();
          setTotalScore(totalScore + score);
          setGameWon(true);
          setIsRunning(false);
          
          // Save best time for this level
          if (!bestTimes[currentLevel] || timer < bestTimes[currentLevel]) {
            setBestTimes({ ...bestTimes, [currentLevel]: timer });
          }

          // Record activity if child is selected
          if (selectedChild) {
            recordActivity({
              activityType: 'game',
              activityName: 'Memory Match',
              score: score,
              maxScore: 1000,
              percentage: (score / 1000) * 100,
              duration: timer,
              attempts: 1,
              difficulty: currentLevelConfig.name.toLowerCase(),
              correctAnswers: matched.length / 2,
              incorrectAnswers: Math.max(0, moves - (matched.length / 2)),
              details: {
                level: currentLevel,
                levelName: currentLevelConfig.name,
                moves: moves,
                gridSize: currentLevelConfig.gridSize
              }
            }).catch(err => console.error('Failed to record activity:', err));
          }
        }
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  const handleNextLevel = () => {
    const cap = maxLevel != null ? maxLevel : levels.length;
    if (currentLevel < Math.min(levels.length, cap)) {
      setCurrentLevel(currentLevel + 1);
      setGameWon(false);
    }
  };

  const handleRestartLevel = () => {
    initializeGame();
  };

  const handleLevelSelect = (level) => {
    setCurrentLevel(level);
    setGameWon(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f6f3 0%, #e8f9f6 100%)', padding: '20px 0' }}>
      <div className="container py-2">
      {/* Header */}
      <div style={{ margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button className="btn btn-outline-secondary rounded-pill" style={{ fontWeight: '700' }} onClick={() => navigate('/games')}>
          ← Back
        </button>
        <h1 style={{ fontWeight: '900', fontSize: '1.55rem', margin: 0, color: '#2d3748' }}>
          🃏 Memory Match
        </h1>
        <div style={{ background: '#fdfcfa', borderRadius: '20px', padding: '6px 18px', fontWeight: '800', color: '#61C3B4', fontSize: '1.15rem', boxShadow: '0 2px 8px rgba(97,195,180,0.15)' }}>
          Level {currentLevel} · 🔄 {moves} moves
        </div>
      </div>

      {/* Countdown Timer */}
      {(isRunning || moves > 0) && !gameWon && (
        <div className="text-center mb-3">
          <span style={{
            display: 'inline-block',
            background: (currentLevelConfig.time - timer) <= 15 ? '#fee2e2' : '#fdfcfa',
            color: (currentLevelConfig.time - timer) <= 15 ? '#dc2626' : '#61C3B4',
            border: `2px solid ${(currentLevelConfig.time - timer) <= 15 ? '#dc2626' : '#61C3B4'}`,
            borderRadius: '50px',
            padding: '6px 22px',
            fontWeight: '800',
            fontSize: '1.15rem',
            boxShadow: '0 2px 8px rgba(97,195,180,0.15)',
            transition: 'color 0.3s, border-color 0.3s, background 0.3s'
          }}>
            ⏱ {formatTime(Math.max(0, currentLevelConfig.time - timer))} remaining
          </span>
        </div>
      )}

      {/* Preview Timer Banner */}}
      {showPreview && (
        <div className="alert alert-info border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="d-flex align-items-center justify-content-center">
            <i className="bi bi-eye-fill fs-4 me-3"></i>
            <div className="text-center">
              <h5 className="mb-1 fw-bold">Memorize the cards!</h5>
              <p className="mb-0">Game starts in <span className="badge fs-6" style={{ backgroundColor: '#59B5AA', color: '#fff' }}>{previewTimer}</span> seconds...</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <div className="card-body p-4">
          <div 
            style={{ 
              display: 'grid',
              gridTemplateColumns: `repeat(${currentLevelConfig.gridSize}, 1fr)`,
              gap: '12px',
              maxWidth: '900px',
              margin: '0 auto'
            }}
          >
            {cards.map((card, index) => {
              
              return (
                <div key={card.id}>
                  <div
                    className={`card h-100 border-0 shadow-sm ${
                      flipped.includes(index) || matched.includes(index) || showPreview
                        ? 'text-white'
                        : 'bg-light'
                    }`}
                    style={{
                      minHeight: currentLevelConfig.gridSize <= 4 ? '120px' : currentLevelConfig.gridSize <= 7 ? '100px' : '80px',
                      cursor: matched.includes(index) || showPreview ? 'default' : 'pointer',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      transform: flipped.includes(index) || matched.includes(index) ? 'rotateY(0deg)' : 'rotateY(0deg)',
                      opacity: matched.includes(index) ? 0.6 : 1,
                      backgroundColor: (flipped.includes(index) || matched.includes(index) || showPreview) ? '#59B5AA' : ''
                    }}
                    onClick={() => handleCardClick(index)}
                    onMouseEnter={(e) => {
                      if (!matched.includes(index) && !showPreview) {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div className="card-body d-flex align-items-center justify-content-center p-2">
                      {flipped.includes(index) || matched.includes(index) || showPreview ? (
                        <span style={{ fontSize: currentLevelConfig.gridSize <= 4 ? '3rem' : currentLevelConfig.gridSize <= 7 ? '2.5rem' : '2rem' }}>{card.symbol}</span>
                      ) : (
                        <i className={`bi bi-question-circle ${currentLevelConfig.gridSize <= 4 ? 'fs-1' : currentLevelConfig.gridSize <= 7 ? 'fs-3' : 'fs-4'} text-muted`}></i>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset Button */}
          <div className="text-center mt-4">
            <button 
              className="btn btn-outline-primary btn-lg px-5" 
              onClick={handleRestartLevel}
              style={{ borderColor: '#59B5AA', color: '#59B5AA' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#59B5AA';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#59B5AA';
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Restart Level
            </button>
          </div>
        </div>
      </div>

      {/* Win Modal */}
      {gameWon && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1050
          }}
          onClick={() => setGameWon(false)}
        >
          <div
            className="card border-0 shadow-lg"
            style={{
              maxWidth: '500px',
              borderRadius: '20px',
              animation: 'fadeIn 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body text-center p-5">
              <i className="bi bi-trophy-fill display-1 text-warning mb-4"></i>
              <h2 className="mb-3 fw-bold">Level {currentLevel} Complete! 🎉</h2>
              <p className="text-muted mb-4">
                {currentLevel === levels.length 
                  ? "Congratulations! You've mastered all levels!" 
                  : `Great job! Ready for Level ${currentLevel + 1}?`}
              </p>
              
              <div className="row g-3 mb-4">
                <div className="col-4">
                  <div className="p-3 bg-light rounded">
                    <i className="bi bi-clock" style={{ color: '#59B5AA' }}></i>
                    <div className="fw-bold mt-2">{formatTime(timer)}</div>
                    <small className="text-muted">Time</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 bg-light rounded">
                    <i className="bi bi-cursor-fill text-info"></i>
                    <div className="fw-bold mt-2">{moves}</div>
                    <small className="text-muted">Moves</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 bg-light rounded">
                    <i className="bi bi-star-fill text-warning"></i>
                    <div className="fw-bold mt-2">{calculateScore()}</div>
                    <small className="text-muted">Score</small>
                  </div>
                </div>
              </div>

              <div className="d-grid gap-2">
                {currentLevel < levels.length ? (
                  <>
                    <button className="btn btn-success btn-lg" onClick={handleNextLevel}>
                      <i className="bi bi-arrow-right-circle me-2"></i>
                      Next Level
                    </button>
                    <button 
                      className="btn btn-outline-primary" 
                      onClick={handleRestartLevel}
                      style={{ borderColor: '#59B5AA', color: '#59B5AA' }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#59B5AA';
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#59B5AA';
                      }}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Replay Level
                    </button>
                  </>
                ) : (
                  <button className="btn btn-success btn-lg" onClick={() => handleLevelSelect(1)}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Play Again from Level 1
                  </button>
                )}
                <button className="btn btn-outline-secondary" onClick={() => navigate('/games')}>
                  <i className="bi bi-chevron-left me-2"></i>
                  Back to Therapy Games
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' }}>
        <div className="card-body p-4">
          <h5 className="mb-3">
            <i className="bi bi-lightbulb-fill text-warning me-2"></i>
            Level Info & Tips
          </h5>
          <div className="row">
            <div className="col-md-6">
              <h6 className="fw-bold mb-2">Current Level Details:</h6>
              <ul className="mb-3">
                <li>Grid size: {currentLevelConfig.gridSize}x{currentLevelConfig.gridSize}</li>
                <li>Total cards: {currentLevelConfig.gridSize * currentLevelConfig.gridSize}</li>
                <li>Recommended time: {currentLevelConfig.time}s</li>
                <li>Maximum moves: {currentLevelConfig.maxMoves}</li>
                <li>Difficulty: {currentLevelConfig.name}</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="fw-bold mb-2">Tips for Success:</h6>
              <ul className="mb-0">
                <li>Remember card positions carefully</li>
                <li>Create a mental map of the board</li>
                <li>Focus on one area at a time</li>
                <li>Beat the recommended time for bonus points!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Fail Overlay */}
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
              You matched {Math.floor(matched.length / 2)} of {Math.floor((currentLevelConfig.gridSize * currentLevelConfig.gridSize) / 2)} pairs
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn rounded-pill px-4 py-2 fw-bold"
                style={{ background: '#61C3B4', color: '#fff', border: 'none' }}
                onClick={handleRestartLevel}
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

export default MemoryMatchGame;
