import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import assessmentAPI from '../api/assessment.api';

const CATEGORY_ICONS = {
  'Eye Contact': 'bi-eye',
  'Social Interaction': 'bi-people',
  'Communication': 'bi-chat-dots',
  'Repetitive Behavior': 'bi-arrow-repeat',
  'Sensory Sensitivity': 'bi-soundwave',
  'Focus & Attention': 'bi-bullseye',
};

const CATEGORY_COLORS = {
  'Eye Contact': '#61C3B4',
  'Social Interaction': '#ADA9D3',
  'Communication': '#79C9A0',
  'Repetitive Behavior': '#f4a261',
  'Sensory Sensitivity': '#5EBEB0',
  'Focus & Attention': '#b4a7d6',
};

const autismLevelColor = {
  'Beginner Level': 'danger',
  'Intermediate Level': 'warning',
  'Advanced Level': 'success',
};

const ChildQuizResults = () => {
  const { childId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await assessmentAPI.getDetailedQuizResults(childId);
        if (res.success) {
          setData(res.data);
          const answeredCats = Object.entries(res.data.questionsByCategory || {})
            .filter(([, qs]) => qs.some((q) => q.selectedOptionIndex !== null))
            .map(([cat]) => cat);
          if (answeredCats.length > 0) setActiveCategory(answeredCats[0]);
        } else {
          setError(res.message || 'Failed to load quiz results');
        }
      } catch (err) {
        setError(err.message || 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childId]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="mt-3 text-muted">Loading quiz results…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
      </div>
    );
  }

  const { child, assessmentResult, questionsByCategory } = data || {};

  // Only show questions the child has answered
  const answeredByCategory = Object.fromEntries(
    Object.entries(questionsByCategory || {}).map(([cat, qs]) => [
      cat,
      qs.filter((q) => q.selectedOptionIndex !== null),
    ]).filter(([, qs]) => qs.length > 0)
  );
  const categories = Object.keys(answeredByCategory);
  const hasData = categories.length > 0;

  const scorePercent = assessmentResult?.scorePercentage ?? 0;
  const autismLevel = assessmentResult?.autismLevel;

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <div>
          <h2 className="mb-0">
            <i className="bi bi-clipboard2-check me-2 text-primary"></i>
            Quiz Results: {child?.name}
          </h2>
          <small className="text-muted">{child?.age} years old</small>
        </div>
      </div>

      {/* Summary Card */}
      {assessmentResult ? (
        <div
          className="card border-0 shadow-sm mb-4"
          style={{
            borderRadius: 16,
            background: 'linear-gradient(135deg, #61C3B4 0%, #5EBEB0 100%)',
            color: '#fff',
          }}
        >
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-3 text-center">
                <div style={{ fontSize: '3.5rem', fontWeight: 700 }}>{scorePercent.toFixed(1)}%</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Overall Score</div>
              </div>
              <div className="col-md-3 text-center border-start border-white border-opacity-25">
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {assessmentResult.totalScore}/{assessmentResult.totalQuestions * 3}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Points Scored</div>
              </div>
              <div className="col-md-3 text-center border-start border-white border-opacity-25">
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                  <span className={`badge bg-${autismLevelColor[autismLevel] || 'secondary'} text-dark`}>
                    {autismLevel}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: 6 }}>Autism Level</div>
              </div>
              <div className="col-md-3 text-center border-start border-white border-opacity-25">
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {assessmentResult.assessmentLevel?.toUpperCase()} Level
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: 4 }}>
                  {new Date(assessmentResult.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info mb-4">
          <i className="bi bi-info-circle me-2"></i>
          No assessment has been completed yet for this child. The quiz questions are shown below.
        </div>
      )}

      {/* Questions by Category */}
      {hasData ? (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            {/* Category Tabs */}
            <div
              className="d-flex gap-2 flex-wrap p-3"
              style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa', borderRadius: '16px 16px 0 0' }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  className="btn btn-sm"
                  style={{
                    borderRadius: 20,
                    border: `2px solid ${CATEGORY_COLORS[cat] || '#61C3B4'}`,
                    background: activeCategory === cat ? CATEGORY_COLORS[cat] : 'transparent',
                    color: activeCategory === cat ? '#fff' : CATEGORY_COLORS[cat],
                    fontWeight: 500,
                    fontSize: '0.82rem',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setActiveCategory(cat)}
                >
                  <i className={`bi ${CATEGORY_ICONS[cat] || 'bi-circle'} me-1`}></i>
                  {cat}
                  <span
                    className="ms-2 badge"
                    style={{
                      background: activeCategory === cat ? 'rgba(255,255,255,0.3)' : CATEGORY_COLORS[cat],
                      color: '#fff',
                      fontSize: '0.7rem',
                    }}
                  >
                    {answeredByCategory[cat]?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Questions for Active Category */}
            <div className="p-4">
              {activeCategory && answeredByCategory[activeCategory] && (
                <div className="d-grid gap-4">
                  {answeredByCategory[activeCategory].map((q, idx) => (
                    <QuestionCard key={q.id} question={q} index={idx} categoryColor={CATEGORY_COLORS[activeCategory]} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-clipboard2 fs-1 d-block mb-3 opacity-25"></i>
          <p>No quiz questions found for this child.</p>
        </div>
      )}
    </div>
  );
};

const QuestionCard = ({ question, index, categoryColor }) => {
  const hasAnswer = question.selectedOptionIndex !== null;

  return (
    <div
      className="card border-0"
      style={{
        borderRadius: 12,
        borderLeft: `4px solid ${categoryColor}`,
        background: '#f8f9fa',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div className="card-body p-4">
        <div className="d-flex align-items-start gap-3 mb-3">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: categoryColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              flexShrink: 0,
            }}
          >
            {index + 1}
          </div>
          <div className="flex-grow-1">
            <p className="fw-medium mb-0" style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
              {question.question}
            </p>
            <small className="text-muted">
              Level: <span className="badge bg-secondary">{question.quizLevel}</span>
            </small>
          </div>
          {hasAnswer && (
            <div className="text-center" style={{ flexShrink: 0 }}>
              <div
                className="fw-bold"
                style={{ fontSize: '1.2rem', color: categoryColor }}
              >
                {question.score}/{question.scores ? Math.max(...question.scores) : 3}
              </div>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>score</small>
            </div>
          )}
        </div>

        <div className="d-grid gap-2 ms-5">
          {question.options.map((option, optIdx) => {
            const isSelected = hasAnswer && question.selectedOptionIndex === optIdx;
            return (
              <div
                key={optIdx}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? categoryColor : '#dee2e6'}`,
                  background: isSelected ? `${categoryColor}18` : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? categoryColor : '#dee2e6'}`,
                    background: isSelected ? categoryColor : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <i className="bi bi-check" style={{ color: '#fff', fontSize: '0.75rem' }}></i>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? categoryColor : '#555',
                    flex: 1,
                  }}
                >
                  {option}
                </span>
                {isSelected && (
                  <span
                    className="badge"
                    style={{ background: categoryColor, fontSize: '0.72rem' }}
                  >
                    Selected
                  </span>
                )}
                <small className="text-muted">({question.scores?.[optIdx] ?? '?'} pts)</small>
              </div>
            );
          })}
        </div>

        {!hasAnswer && (
          <div className="ms-5 mt-2">
            <small className="text-muted fst-italic">
              <i className="bi bi-dash-circle me-1"></i>Not yet answered
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildQuizResults;
