import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ChildSelector from '../components/ChildSelector';
import childAPI from '../api/child.api';

const Games = () => {
  const navigate = useNavigate();
  const { selectedChild } = useChild();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState('All');
  const [recommendations, setRecommendations] = useState([]);
  const [hasAssessment, setHasAssessment] = useState(null); // null=loading/unknown, false=no assessment, true=has results
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySeverities, setCategorySeverities] = useState({});

  const games = [
    {
      id: 1,
      title: 'Memory Match',
      description: 'Match pairs of cards to improve memory and concentration',
      icon: 'bi-grid-3x3-gap',
      difficulty: 'Easy',
      category: 'Focus & Attention',
      color: 'success',
      route: '/games/memory-match',
      totalLevels: 10
    },
    {
      id: 2,
      title: 'Sound Matching',
      description: 'Match sounds to images to improve auditory processing',
      icon: 'bi-music-note-beamed',
      difficulty: 'Easy',
      category: 'Sensory Sensitivity',
      color: 'info',
      route: '/games/sound-matching',
      totalLevels: 10
    },
    {
      id: 10,
      title: 'Color Matching',
      description: 'Match color names to tiles to improve color recognition',
      icon: 'bi-palette',
      difficulty: 'Easy',
      category: 'Sensory Sensitivity',
      color: 'success',
      route: '/games/color-matching',
      totalLevels: 10
    },
    {
      id: 3,
      title: 'Emotion Explorer',
      description: 'Recognize and understand different facial expressions through fun emoji puzzles',
      icon: 'bi-emoji-smile',
      difficulty: 'Medium',
      category: 'Social Interaction',
      color: 'warning',
      route: '/games/emotion-explorer',
      totalLevels: 10
    },
    {
      id: 9,
      title: 'Pattern Builder',
      description: 'Recognize and complete repeating color & shape patterns across 15 progressive levels',
      icon: 'bi-grid',
      difficulty: 'Medium',
      category: 'Repetitive Behavior',
      color: 'danger',
      route: '/games/pattern-builder',
      totalLevels: 15
    },
    {
      id: 12,
      title: 'Eye Contact Game',
      description: 'Improve attention and eye contact skills with webcam-based gaze tracking across 15 progressive levels',
      icon: 'bi-eye',
      difficulty: 'Easy',
      category: 'Eye Contact',
      color: 'primary',
      route: '/games/eye-contact',
      totalLevels: 15
    },
    {
      id: 13,
      title: 'Communication Builder',
      description: 'Match pictures to their words to build vocabulary — with spoken pronunciation for every word',
      icon: 'bi-chat-heart',
      difficulty: 'Easy',
      category: 'Communication',
      color: 'success',
      route: '/games/picture-word',
      totalLevels: 15
    }
  ];

  // Fetch recommendations whenever the selected child changes
  useEffect(() => {
    if (!selectedChild?._id) {
      setRecommendations([]);
      setHasAssessment(null);
      return;
    }
    setLoadingRecs(true);
    childAPI.getGameRecommendations(selectedChild._id)
      .then((res) => {
        setHasAssessment(res.data.hasAssessment);
        setRecommendations(res.data.recommendations || []);
        setCategorySeverities(res.data.categorySeverities || {});
      })
      .catch(() => {
        setHasAssessment(null);
        setRecommendations([]);
        setCategorySeverities({});
      })
      .finally(() => setLoadingRecs(false));
  }, [selectedChild?._id]);

  // Compute max allowed level per game based on category severities from assessment
  const computeMaxLevel = (gameCategories, severities, totalLevels) => {
    if (!totalLevels) return null;
    if (!gameCategories || gameCategories.length === 0) return Math.ceil(totalLevels / 3);
    if (!severities || Object.keys(severities).length === 0) return Math.ceil(totalLevels / 3);
    const worst = Math.max(...gameCategories.map((c) => severities[c] ?? 1));
    if (worst > 0.60) return Math.ceil(totalLevels / 3);
    if (worst > 0.40) return Math.ceil((totalLevels * 2) / 3);
    return totalLevels;
  };

  // Merge recommendation data into games and sort by relevance score (recommended first)
  const recMap = Object.fromEntries(recommendations.map((r) => [r.id, r]));
  const enrichedGames = games.map((game) => ({
    ...game,
    ...(recMap[game.id] || { relevanceScore: 0, isRecommended: false, problemAreas: [] }),
    maxLevel: selectedChild && hasAssessment === true
      ? computeMaxLevel(recMap[game.id]?.targetedCategories || [], categorySeverities, game.totalLevels)
      : null,
  }));
  const sortedGames = [...enrichedGames].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const filteredGames = sortedGames.filter((g) => {
    const matchesCategory = activeCategory === 'All' || g.category === activeCategory;
    const matchesSearch = !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Eye Contact', 'Social Interaction', 'Communication', 'Repetitive Behavior', 'Sensory Sensitivity', 'Focus & Attention'];

  const requiresChildSelection = !!user && !selectedChild;
  const requiresAssessment = !!selectedChild && hasAssessment === false;
  const isBlocked = requiresChildSelection || requiresAssessment;

  return (
    <div className="container mt-4 mb-5">
      <div className="mb-4">
        <h1 className="text-primary-custom">
          <i className="bi bi-controller me-2"></i>
          Interactive Therapy Games
        </h1>
        <p className="text-muted">
          Choose from our collection of educational therapy games designed for autism development
        </p>
      </div>

      {/* Child Selector */}
      {user && (
        <div className="mb-4">
          <ChildSelector />
        </div>
      )}

      {/* No Assessment Warning */}
      {requiresAssessment && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-clipboard-x-fill me-3 fs-4"></i>
          <div>
            <h5 className="alert-heading mb-2">Assessment Required</h5>
            <p className="mb-2">
              No assessment results found for <strong>{selectedChild?.name}</strong>. Please complete an assessment first so the system can recommend the right games for their specific needs.
            </p>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => navigate('/assessment')}
            >
              <i className="bi bi-clipboard-check-fill me-2"></i>
              Go to Assessment
            </button>
          </div>
        </div>
      )}

      {/* Recommendation summary banner */}
      {selectedChild && hasAssessment === true && !loadingRecs && (
        <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-stars me-3 fs-4"></i>
          <div>
            <strong>Personalized Recommendations for {selectedChild.name}</strong>
            <span className="ms-2 text-muted">
              — {recommendations.filter((r) => r.isRecommended).length} game(s) recommended based on assessment results. Recommended games appear first with a badge.
            </span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loadingRecs && selectedChild && (
        <div className="text-center text-muted mb-4">
          <span className="spinner-border spinner-border-sm me-2"></span>
          Loading recommendations for {selectedChild.name}…
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4">
        <div className="d-flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`btn btn-sm ${activeCategory === category ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="row g-4">
        {filteredGames.map((game) => (
          <div key={game.id} className="col-md-6 col-lg-4">
            <Card className="h-100" style={{ position: 'relative' }}>
              {/* Recommended badge */}
              {game.isRecommended && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 1,
                  }}
                >
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-star-fill me-1"></i>Recommended
                  </span>
                </div>
              )}

              <div className="text-center mb-3">
                <div className={`fs-1 text-${game.color} mb-3`}>
                  <i className={`bi ${game.icon}`}></i>
                </div>
                <h5 className="card-title">{game.title}</h5>
                <div className="mb-2">
                  <span className={`badge badge-${game.color} me-2`}>{game.category}</span>
                  {game.maxLevel && game.totalLevels ? (
                    <span className={`badge ${
                      game.maxLevel >= game.totalLevels ? 'bg-success' :
                      game.maxLevel >= Math.ceil((game.totalLevels * 2) / 3) ? 'bg-warning text-dark' :
                      'bg-info text-dark'
                    }`}>
                      {game.maxLevel >= game.totalLevels ? '🌟 All Levels' :
                       game.maxLevel >= Math.ceil((game.totalLevels * 2) / 3) ? '⭐ Medium & Below' :
                       '✅ Easy Levels Only'}
                    </span>
                  ) : (
                    <span className="badge badge-info">{game.difficulty}</span>
                  )}
                </div>

                {/* Problem areas tag — only shown when recommendation data is available */}
                {game.isRecommended && game.problemAreas?.length > 0 && (
                  <div className="mt-1">
                    <small className="text-muted">
                      <i className="bi bi-bullseye me-1"></i>
                      Helps with: <strong>{game.problemAreas.join(', ')}</strong>
                    </small>
                  </div>
                )}
              </div>

              <p className="card-text text-muted">{game.description}</p>

              <div className="mt-auto">
                <button
                  className={`btn w-100 ${game.isRecommended ? 'btn-warning' : 'btn-primary'}`}
                  onClick={() => game.route ? navigate(game.route, { state: { autoStart: true, maxLevel: game.maxLevel } }) : alert('Coming Soon!')}
                  disabled={isBlocked}
                  title={
                    requiresChildSelection
                      ? 'Please select a child first'
                      : requiresAssessment
                      ? 'Please complete an assessment first'
                      : ''
                  }
                >
                  <i className={`bi ${isBlocked ? 'bi-lock-fill' : 'bi-play-fill'} me-2`}></i>
                  {requiresChildSelection
                    ? 'Select Child First'
                    : requiresAssessment
                    ? 'Assessment Required'
                    : 'Play Now'}
                </button>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Achievement Section */}
      <div className="mt-5">
        <h3 className="mb-4">Recent Achievements</h3>
        <div className="row g-3">
          <div className="col-md-3">
            <Card className="text-center card-success">
              <i className="bi bi-trophy-fill fs-1 text-warning mb-2"></i>
              <h6>10 Therapy Games Completed</h6>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center card-info">
              <i className="bi bi-star-fill fs-1 text-warning mb-2"></i>
              <h6>5 Day Streak</h6>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center card-warning">
              <i className="bi bi-lightning-fill fs-1 text-warning mb-2"></i>
              <h6>Fast Learner</h6>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center card-stat">
              <i className="bi bi-graph-up fs-1 text-success mb-2"></i>
              <h6>Level 5 Reached</h6>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;
