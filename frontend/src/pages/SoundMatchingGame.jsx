import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import '../styles/soundMatching.css';

const SoundMatchingGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedChild, recordActivity } = useChild();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [displayedIcons, setDisplayedIcons] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [wrongIcon, setWrongIcon] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const audioRef = useRef(null);
  const correctAudioRef = useRef(null);

  // Level configurations (10 levels)
  const levels = [
    { level: 1, name: 'Level 1', roundsNeeded: 3, color: 'success' },
    { level: 2, name: 'Level 2', roundsNeeded: 4, color: 'success' },
    { level: 3, name: 'Level 3', roundsNeeded: 5, color: 'info' },
    { level: 4, name: 'Level 4', roundsNeeded: 6, color: 'info' },
    { level: 5, name: 'Level 5', roundsNeeded: 7, color: 'warning' },
    { level: 6, name: 'Level 6', roundsNeeded: 8, color: 'warning' },
    { level: 7, name: 'Level 7', roundsNeeded: 9, color: 'warning' },
    { level: 8, name: 'Level 8', roundsNeeded: 10, color: 'danger' },
    { level: 9, name: 'Level 9', roundsNeeded: 11, color: 'danger' },
    { level: 10, name: 'Level 10', roundsNeeded: 12, color: 'danger' }
  ];

  const currentLevelConfig = levels[currentLevel - 1];

  // All available sound-image pairs (easily extendable)
  const allSounds = [
    // Animals
    { id: 'dog', name: 'Dog', emoji: '🐶', audioSrc: '/sounds/dog.mp3', imageSrc: '/img/dog.png' },
    { id: 'cat', name: 'Cat', emoji: '🐱', audioSrc: '/sounds/cat.mp3', imageSrc: '/img/cat.png' },
    { id: 'bird', name: 'Bird', emoji: '🐦', audioSrc: '/sounds/bird.mp3', imageSrc: '/img/bird.png' },
    { id: 'cow', name: 'Cow', emoji: '🐮', audioSrc: '/sounds/cow.mp3', imageSrc: '/img/cow.png' },
    
    // Musical Instruments
    { id: 'piano', name: 'Piano', emoji: '🎹', audioSrc: '/sounds/piano.mp3', imageSrc: '/img/piano.png' },
    { id: 'guitar', name: 'Guitar', emoji: '🎸', audioSrc: '/sounds/guitar.mp3', imageSrc: '/img/guitar.png' },
    { id: 'drum', name: 'Drum', emoji: '🥁', audioSrc: '/sounds/drum.mp3', imageSrc: '/img/drum.png' },
    { id: 'bell', name: 'Bell', emoji: '🔔', audioSrc: '/sounds/bell.mp3', imageSrc: '/img/bell.png' },
    
    // Simple Objects
    { id: 'car', name: 'Car', emoji: '🚗', audioSrc: '/sounds/car.mp3', imageSrc: '/img/car.png' },
    { id: 'train', name: 'Train', emoji: '🚂', audioSrc: '/sounds/train.mp3', imageSrc: '/img/train.png' },
    { id: 'phone', name: 'Phone', emoji: '📱', audioSrc: '/sounds/phone.mp3', imageSrc: '/img/phone.png' },
    { id: 'clock', name: 'Clock', emoji: '⏰', audioSrc: '/sounds/clock.mp3', imageSrc: '/img/clock.png' }
  ];

  // Play sound with fallback to text-to-speech
  const playSound = (soundItem, isCorrectSound = false) => {
    const audioElement = isCorrectSound ? correctAudioRef.current : audioRef.current;
    
    if (audioElement) {
      audioElement.src = soundItem.audioSrc || soundItem;
      audioElement.volume = 0.5; // Soft volume for sensory-friendly experience
      
      audioElement.play().catch(() => {
        // Fallback to text-to-speech if audio file not available
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(soundItem.name || 'sound');
          utterance.rate = 0.8;
          utterance.pitch = 1;
          utterance.volume = 0.5;
          window.speechSynthesis.speak(utterance);
        }
        setIsPlaying(false);
      });
      
      audioElement.onended = () => {
        setIsPlaying(false);
      };
      
      // Set timeout to reset isPlaying in case onended doesn't fire
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    } else {
      // If no audio element, use text-to-speech
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(soundItem.name || 'sound');
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.5;
        window.speechSynthesis.speak(utterance);
      }
      setTimeout(() => {
        setIsPlaying(false);
      }, 2000);
    }
  };

  // Select random sound and 3 icons to display
  const selectNewRound = () => {
    // Randomly pick the correct answer
    const correctAnswer = allSounds[Math.floor(Math.random() * allSounds.length)];
    
    // Pick 2 wrong answers (total: 3 options)
    const wrongAnswers = allSounds
      .filter(s => s.id !== correctAnswer.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    // Combine and shuffle (always 3 options)
    const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    setCurrentSound(correctAnswer);
    setDisplayedIcons(options);
    setIsCorrect(null);
    setWrongIcon(null);
    setIsPlaying(false); // Reset playing state
    
    // Auto-play sound after a brief delay
    setTimeout(() => {
      setIsPlaying(true);
      playSound(correctAnswer);
    }, 500);
  };

  // Handle icon click
  const handleIconClick = (clickedIcon) => {
    if (isCorrect !== null) return; // Prevent clicks during success animation
    
    if (clickedIcon.id === currentSound.id) {
      // CORRECT ANSWER
      setIsCorrect(true);
      setScore(score + 10);
      setRoundsCompleted(roundsCompleted + 1);
      
      // Play soft correct chime
      playSound('/sounds/correct.mp3', true);
      
      // Check if level is complete
      if (roundsCompleted + 1 >= currentLevelConfig.roundsNeeded) {
        setTimeout(() => {
          completeLevel();
        }, 2000);
      } else {
        // Wait for animation, then next round
        setTimeout(() => {
          selectNewRound();
        }, 2000);
      }
      
    } else {
      // WRONG ANSWER
      setWrongIcon(clickedIcon.id);
      
      // Replay the original sound after shake animation
      setTimeout(() => {
        playSound(currentSound);
        setWrongIcon(null);
      }, 600);
    }
  };

  // Complete current level
  const completeLevel = async () => {
    setLevelComplete(true);
    setTotalScore(totalScore + score);

    // Record activity if child is selected
    if (selectedChild) {
      try {
        await recordActivity({
          activityType: 'game',
          activityName: 'Sound Matching',
          score: score,
          maxScore: currentLevelConfig.roundsNeeded * 10,
          percentage: (score / (currentLevelConfig.roundsNeeded * 10)) * 100,
          duration: 0,
          attempts: 1,
          difficulty: currentLevelConfig.name.toLowerCase(),
          correctAnswers: roundsCompleted,
          incorrectAnswers: 0,
          details: {
            level: currentLevel,
            levelName: currentLevelConfig.name,
            roundsCompleted: roundsCompleted
          }
        });
      } catch (error) {
        console.error('Error recording activity:', error);
      }
    }
  };

  // Move to next level
  const nextLevel = () => {
    const limit = location.state?.maxLevel ?? 10;
    if (currentLevel < limit) {
      setCurrentLevel(currentLevel + 1);
      setScore(0);
      setRoundsCompleted(0);
      setLevelComplete(false);
      setGameStarted(true);
      selectNewRound();
    }
  };

  // Restart from level 1
  const restartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setTotalScore(0);
    setRoundsCompleted(0);
    setLevelComplete(false);
    setGameStarted(false);
  };

  // Replay current sound manually
  const replaySound = () => {
    if (currentSound && !isPlaying) {
      setIsPlaying(true);
      playSound(currentSound);
    }
  };

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setRoundsCompleted(0);
    setLevelComplete(false);
    selectNewRound();
  };

  // Auto-start when navigated from Games page
  useEffect(() => {
    if (location.state?.autoStart) startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sound-matching-container">
      {/* Audio elements */}
      <audio ref={audioRef} />
      <audio ref={correctAudioRef} />

      {/* Header */}
      <div style={{ maxWidth: '680px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button className="btn btn-outline-secondary rounded-pill" style={{ fontWeight: '700' }} onClick={() => navigate('/games')}>
          ← Back
        </button>
        <h1 style={{ fontWeight: '900', fontSize: '1.55rem', margin: 0, color: '#2d3748' }}>
          🎵 Sound Matching
        </h1>
        <div style={{ background: '#fdfcfa', borderRadius: '20px', padding: '6px 18px', fontWeight: '800', color: '#61C3B4', fontSize: '1.15rem', boxShadow: '0 2px 8px rgba(97,195,180,0.15)' }}>
          Level {currentLevel} · ⭐ {score}
        </div>
      </div>

      {/* Start Screen */}
      {!gameStarted && !levelComplete && (
        <div className="start-screen">
          <div className="start-card">
            <div className="start-icon">🎵</div>
            <h2>Listen & Match</h2>
            <p>Listen to the sound and click the matching picture</p>



            <div className="level-info">
              <div className={`level-badge-large bg-${currentLevelConfig.color}`}>
                Level {currentLevel}
              </div>
              <p className="level-description">
                Complete {currentLevelConfig.roundsNeeded} rounds to advance!
              </p>
            </div>
            <button className="start-button" onClick={startGame}>
              Start Level {currentLevel}
            </button>
          </div>
          
          <div className="instructions-card">
            <h3>How to Play</h3>
            <ul>
              <li>🔊 A sound will play automatically</li>
              <li>👆 Click the picture that matches the sound</li>
              <li>✨ Get it right to see a happy glow!</li>
              <li>🔄 Try again if you pick the wrong one</li>
              <li>🎯 Complete all rounds to unlock the next level!</li>
            </ul>
            <div className="levels-progress">
              <h4>Progress</h4>
              <div className="progress-grid">
                {levels.map((level) => (
                  <div 
                    key={level.level}
                    className={`progress-item ${currentLevel > level.level ? 'completed' : currentLevel === level.level ? 'active' : 'locked'}`}
                  >
                    {currentLevel > level.level ? '✓' : level.level}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Screen */}
      {gameStarted && !levelComplete && (
        <div className="game-screen">
          {/* Progress Indicator */}
          <div className="round-progress">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${(roundsCompleted / currentLevelConfig.roundsNeeded) * 100}%` }}
              ></div>
            </div>
            <p className="progress-text">
              Round {roundsCompleted + 1} of {currentLevelConfig.roundsNeeded}
            </p>
          </div>

          {/* Replay Sound Button */}
          <div className="replay-section">
            <button 
              className="replay-button"
              onClick={replaySound}
              disabled={isPlaying}
            >
              <i className="bi bi-volume-up-fill"></i>
              <span>Play Sound Again</span>
            </button>
          </div>

          {/* Icons Grid */}
          <div className="icons-grid">
            {displayedIcons.map((icon) => {
              const isCorrectIcon = isCorrect && icon.id === currentSound.id;
              const isWrongIcon = wrongIcon === icon.id;
              
              return (
                <div
                  key={icon.id}
                  className={`icon-card ${isCorrectIcon ? 'correct' : ''} ${isWrongIcon ? 'wrong' : ''}`}
                  onClick={() => handleIconClick(icon)}
                >
                  <div className="icon-image">
                    {/* Use emoji as fallback if image doesn't exist */}
                    <img 
                      src={icon.imageSrc} 
                      alt={icon.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                    <div className="emoji-fallback" style={{ display: 'none' }}>
                      {icon.emoji}
                    </div>
                  </div>
                  <div className="icon-label">{icon.name}</div>
                  {isCorrectIcon && (
                    <div className="success-badge">
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Gentle Feedback Message */}
          {isCorrect && (
            <div className="feedback-message success">
              <div className="feedback-icon">🌟</div>
              <p>Great job!</p>
            </div>
          )}

          {/* How to Play & Tips */}
          <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' }}>
            <div className="card-body p-4">
              <h5 className="mb-3"><i className="bi bi-lightbulb-fill text-warning me-2"></i>How to Play &amp; Tips</h5>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-bold mb-2">Level Details:</h6>
                  <ul className="mb-3">
                    <li>Level {currentLevel} of 10</li>
                    <li>Rounds to complete: {currentLevelConfig.roundsNeeded}</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold mb-2">Tips for Success:</h6>
                  <ul className="mb-0">
                    <li>Listen carefully before clicking</li>
                    <li>Use "Play Sound Again" if unsure</li>
                    <li>Match the picture to the sound</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete Screen */}
      {levelComplete && (
        <div className="start-screen">
          <div className="start-card level-complete-card">
            <div className="start-icon celebration">🎉</div>
            <h2>Level {currentLevel} Complete!</h2>
            <div className="level-stats">
              <div className="stat-item">
                <div className="stat-label">Level Score</div>
                <div className="stat-value">{score}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Score</div>
                <div className="stat-value">{totalScore + score}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Rounds Completed</div>
                <div className="stat-value">{roundsCompleted}</div>
              </div>
            </div>
            
            {currentLevel < 10 ? (
              <div className="button-group">
                <button className="start-button" onClick={nextLevel}>
                  <i className="bi bi-arrow-right"></i> Next Level
                </button>
                <button className="secondary-button" onClick={() => navigate('/games')}>
                  <i className="bi bi-house"></i> Back to Games
                </button>
              </div>
            ) : (
              <div className="victory-section">
                <h3>🏆 Congratulations! 🏆</h3>
                <p>You've completed all 10 levels!</p>
                <div className="button-group">
                  <button className="start-button" onClick={restartGame}>
                    <i className="bi bi-arrow-clockwise"></i> Play Again
                  </button>
                  <button className="secondary-button" onClick={() => navigate('/games')}>
                    <i className="bi bi-house"></i> Back to Games
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundMatchingGame;
