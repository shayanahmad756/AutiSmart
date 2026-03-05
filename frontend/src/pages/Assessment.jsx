import { useState, useEffect } from 'react';
import { useChild } from '../context/ChildContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ChildSelector from '../components/ChildSelector';
import Toast from '../components/Toast';
import { assessmentService } from '../services';
import '../styles/assessment.css';

const DEFAULT_QUESTIONS = [
  { id: 'default_1', category: 'Social Interaction', question: 'When meeting someone new, your child usually:', options: ['Smiles and says hello', 'Stays quiet', 'Walks away'], scores: [1, 2, 3] },
  { id: 'default_2', category: 'Social Interaction', question: 'Does your child like playing with other children?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
  { id: 'default_3', category: 'Focus & Attention', question: 'Does your child respond when you call their name?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
  { id: 'default_4', category: 'Eye Contact', question: 'Does your child make eye contact during conversation?', options: ['Often', 'Sometimes', 'Rarely'], scores: [1, 2, 3] },
  { id: 'default_5', category: 'Social Interaction', question: 'When upset, does your child seek comfort?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
  { id: 'default_6', category: 'Communication', question: 'Does your child point to show interest?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
  { id: 'default_7', category: 'Sensory Sensitivity', question: 'Does your child like trying new foods?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
  { id: 'default_8', category: 'Repetitive Behavior', question: 'Does your child repeat specific movements or actions?', options: ['Rarely', 'Sometimes', 'Often'], scores: [1, 2, 3] },
  { id: 'default_9', category: 'Communication', question: 'Does your child wave goodbye without reminding?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
  { id: 'default_10', category: 'Focus & Attention', question: 'Does your child stay focused during a 10-minute activity?', options: ['Yes', 'Sometimes', 'Rarely'], scores: [1, 2, 3] }
];

const Assessment = () => {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { selectedChild } = useChild();
  const { user } = useAuth();

  const [assessmentData, setAssessmentData] = useState({
    title: 'AutiSmart Assessment Quiz',
    description: 'Comprehensive behavioral screening assessment',
    questions: DEFAULT_QUESTIONS,
    isPersonalized: false,
    pending: false
  });

  useEffect(() => {
    if (!selectedChild?._id) setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedChild?._id) {
      fetchChildQuiz(selectedChild._id);
    } else {
      setAssessmentData({
        title: 'AutiSmart Assessment Quiz',
        description: 'Comprehensive behavioral screening assessment',
        questions: DEFAULT_QUESTIONS,
        isPersonalized: false,
        pending: false
      });
      setLoading(false);
    }
    setAnswers({});
    setShowResults(false);
  }, [selectedChild?._id]);

  const fetchChildQuiz = async (childId) => {
    try {
      setLoading(true);
      const response = await assessmentService.getChildQuiz(childId);
      if (response.success && response.data) {
        const quiz = response.data;
        setAssessmentData({
          title: quiz.title || `${selectedChild?.name}'s Personalized Assessment`,
          description: quiz.description || 'Personalized assessment quiz',
          questions: quiz.questions || [],
          isPersonalized: quiz.isPersonalized || false,
          pending: quiz.pending || false
        });
        if (quiz.isPersonalized && quiz.questions?.length > 0) {
          showToast(`Loaded personalized quiz for ${selectedChild?.name}`, 'info');
        } else if (quiz.pending || !quiz.questions?.length) {
          showToast(`Quiz is being prepared for ${selectedChild?.name} — check back shortly`, 'info');
        }
      }
    } catch (error) {
      console.error('Failed to fetch child quiz, using default:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAnswer = (questionId, optionIndex, score) => {
    setAnswers({ ...answers, [questionId]: { optionIndex, score } });
  };

  const calculateScore = () => {
    let totalScore = 0;
    let totalQuestions = 0;
    const categoryScores = {
      'Eye Contact': { score: 0, total: 0 },
      'Social Interaction': { score: 0, total: 0 },
      'Communication': { score: 0, total: 0 },
      'Repetitive Behavior': { score: 0, total: 0 },
      'Sensory Sensitivity': { score: 0, total: 0 },
      'Focus & Attention': { score: 0, total: 0 }
    };
    assessmentData.questions.forEach(q => {
      if (answers[q.id]) {
        totalScore += answers[q.id].score;
        totalQuestions++;
        if (categoryScores[q.category]) {
          categoryScores[q.category].score += answers[q.id].score;
          categoryScores[q.category].total += 1;
        }
      }
    });
    return { totalScore, totalQuestions, categoryScores };
  };

  const getAutismLevel = (score, total) => {
    const percentage = (score / (total * 3)) * 100;
    if (percentage <= 40) return { level: 'Beginner Level', color: 'success', icon: 'bi-star-fill', message: 'The child shows mild or minimal autism characteristics. They may require basic support and intervention.', description: 'Low support needs - Child demonstrates good functional abilities with minimal assistance required.' };
    if (percentage <= 60) return { level: 'Intermediate Level', color: 'warning', icon: 'bi-star-half', message: 'The child shows moderate autism characteristics. They may benefit from regular therapeutic support.', description: 'Moderate support needs - Child requires consistent support in daily activities and social interactions.' };
    return { level: 'Advanced Level', color: 'danger', icon: 'bi-stars', message: 'The child shows significant autism characteristics. They may require intensive support and professional guidance.', description: 'High support needs - Child needs substantial assistance across multiple areas of development.' };
  };

  const getScoreInterpretation = (score, total) => {
    const percentage = (score / (total * 3)) * 100;
    if (percentage <= 40) return { level: 'Typical Development', color: 'success', icon: 'bi-check-circle-fill', message: 'The responses indicate typical developmental patterns. Continue encouraging positive behaviors.' };
    if (percentage <= 60) return { level: 'Some Areas of Observation', color: 'warning', icon: 'bi-exclamation-triangle-fill', message: 'Some responses suggest areas that may benefit from observation or support. Consider consulting with specialists.' };
    return { level: 'Further Assessment Recommended', color: 'info', icon: 'bi-info-circle-fill', message: 'The responses indicate several areas that may benefit from professional evaluation and support.' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { totalScore, totalQuestions } = calculateScore();
    if (totalQuestions < getTotalQuestions()) {
      alert(`Please answer all questions before submitting. ${totalQuestions}/${getTotalQuestions()} completed.`);
      return;
    }
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (selectedChild?._id) {
      try {
        const { categoryScores } = calculateScore();
        const answersArray = Object.entries(answers).map(([questionId, val]) => ({
          questionId, optionIndex: val.optionIndex, score: val.score
        }));
        await assessmentService.submitResult(selectedChild._id, {
          totalScore, totalQuestions, categoryScores, answers: answersArray, assessmentLevel: 'all'
        });
        showToast(`Results saved! ${selectedChild.name}'s next quiz will be updated automatically.`, 'success');
      } catch (err) {
        console.error('Failed to save result:', err);
        showToast('Could not save results to server. Results shown locally only.', 'warning');
      }
    }
  };

  const getTotalQuestions = () => assessmentData.questions?.length || 0;
  const getAnsweredCount = () => Object.keys(answers).length;
  const resetAssessment = () => { setAnswers({}); setShowResults(false); };

  const getCategoryBadgeColor = (category) => {
    const colors = { 'Eye Contact': 'success', 'Social Interaction': 'warning', 'Communication': 'success', 'Repetitive Behavior': 'info', 'Sensory Sensitivity': 'warning', 'Focus & Attention': 'info' };
    return colors[category] || 'secondary';
  };

  const getCategoryIcon = (category) => {
    const icons = { 'Eye Contact': 'bi-eye', 'Social Interaction': 'bi-people', 'Communication': 'bi-chat-dots', 'Repetitive Behavior': 'bi-arrow-repeat', 'Sensory Sensitivity': 'bi-lightbulb', 'Focus & Attention': 'bi-crosshair' };
    return icons[category] || 'bi-circle';
  };

  const requiresChildSelection = user?.role === 'caregiver' && !selectedChild;

  if (loading) {
    return (
      <div className="container mt-4 mb-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
          <p className="text-muted mt-3">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {toast.show && <Toast message={toast.message} type={toast.type} />}
      <div className="row">
        <div className="col-lg-10 mx-auto">

          {/* Header */}
          <div className="mb-4 fade-in-up">
            <h1 className="text-primary-custom" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              <i className="bi bi-clipboard-check me-3" style={{ fontSize: '2.5rem' }}></i>
              AutiSmart Assessment Quiz
            </h1>
            <p className="text-muted" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
              <strong>Behavioral Screening</strong> | {getTotalQuestions()} personalized questions
            </p>
            <div className="mb-4"><ChildSelector /></div>

            {requiresChildSelection && (
              <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
                <div>
                  <h5 className="alert-heading mb-2">Child Selection Required</h5>
                  <p className="mb-0">Please select a child above before starting the assessment.</p>
                </div>
              </div>
            )}

            {selectedChild && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-person-check-fill me-3 fs-4"></i>
                <div>Playing as <strong>{selectedChild.name}</strong> — Progress will be recorded automatically!</div>
              </div>
            )}

            {assessmentData.isPersonalized && (
              <div className="alert alert-primary d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-stars me-3 fs-4"></i>
                <div><strong>Personalized Quiz</strong> — Questions were generated by Gemini AI specifically for {selectedChild?.name}.</div>
              </div>
            )}

            <div className="alert alert-info fade-in-up" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 15px rgba(93,188,175,0.3)', background: '#5DBCAF', borderLeft: '5px solid #4aa89c', color: '#ffffff' }}>
              <div className="d-flex align-items-start">
                <i className="bi bi-info-circle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
                <div><strong style={{ fontSize: '1.1rem' }}>Important:</strong> This is a behavioral observation tool, not a medical diagnosis. Results provide insights for further professional consultation if needed.</div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <Card className="mb-4 fade-in-up" style={{ border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0" style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                <i className="bi bi-graph-up me-2" style={{ color: '#0d6efd' }}></i>Assessment Progress
              </h5>
              <span className="badge bg-primary fs-6" style={{ padding: '10px 20px' }}>
                {getAnsweredCount()} / {getTotalQuestions()} Answered
              </span>
            </div>
            <div className="progress" style={{ height: '25px', borderRadius: '25px' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${getTotalQuestions() > 0 ? (getAnsweredCount() / getTotalQuestions()) * 100 : 0}%`, fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {getTotalQuestions() > 0 ? Math.round((getAnsweredCount() / getTotalQuestions()) * 100) : 0}%
              </div>
            </div>
          </Card>

          {/* Results */}
          {showResults && (
            <Card className="mb-4 border-success">
              <div className="text-center">
                <h3 className="text-success mb-3"><i className="bi bi-check-circle-fill me-2"></i>Assessment Complete!</h3>
                {(() => {
                  const { totalScore, totalQuestions, categoryScores } = calculateScore();
                  const interpretation = getScoreInterpretation(totalScore, totalQuestions);
                  const autismLevel = getAutismLevel(totalScore, totalQuestions);
                  return (
                    <>
                      <div className={`alert alert-${autismLevel.color} mb-4`} style={{ borderRadius: '20px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', padding: '2rem' }}>
                        <div className="mb-3"><i className={`${autismLevel.icon} me-2`} style={{ fontSize: '3rem' }}></i></div>
                        <h2 className="mb-3" style={{ fontWeight: '800', fontSize: '2.2rem' }}>{autismLevel.level}</h2>
                        <p className="mb-2" style={{ fontSize: '1.2rem', fontWeight: '600' }}>{autismLevel.message}</p>
                        <p className="mb-0" style={{ fontSize: '1rem', opacity: '0.9' }}><i className="bi bi-info-circle me-2"></i>{autismLevel.description}</p>
                      </div>
                      <div className={`alert alert-${interpretation.color} mb-3`}>
                        <h4><i className={`${interpretation.icon} me-2`}></i>{interpretation.level}</h4>
                        <p className="mb-0">{interpretation.message}</p>
                      </div>
                      <div className="row text-center mb-4">
                        <div className="col-md-4 mb-3"><div className="stats-box"><h5 className="text-muted mb-1">Total Score</h5><h2 className="mb-0">{totalScore}</h2><small className="text-muted">out of {totalQuestions * 3}</small></div></div>
                        <div className="col-md-4 mb-3"><div className="stats-box"><h5 className="text-muted mb-1">Questions</h5><h2 className="mb-0">{totalQuestions}</h2><small className="text-muted">completed</small></div></div>
                        <div className="col-md-4 mb-3"><div className="stats-box"><h5 className="text-muted mb-1">Score %</h5><h2 className="mb-0">{Math.round((totalScore / (totalQuestions * 3)) * 100)}%</h2><small className="text-muted">overall</small></div></div>
                      </div>
                      <div className="card mb-4 fade-in-up" style={{ borderRadius: '20px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                        <div className="card-body" style={{ padding: '2.5rem' }}>
                          <h4 className="mb-4" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                            <i className="bi bi-bar-chart-fill me-2" style={{ color: '#0d6efd' }}></i>Symptom Progress Overview
                          </h4>
                          {Object.entries(categoryScores).map(([category, data]) => {
                            if (data.total === 0) return null;
                            const pct = Math.round(((data.total * 3 - data.score) / (data.total * 3)) * 100);
                            const barColor = pct >= 60 ? 'success' : pct >= 40 ? 'warning' : 'info';
                            return (
                              <div key={category} className={`symptom-progress-item ${barColor}-category`}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                    <i className={`${getCategoryIcon(category)} me-2`} style={{ fontSize: '1.3rem' }}></i>{category}
                                    {pct >= 50
                                      ? <i className="bi bi-arrow-up-circle-fill text-success ms-2" style={{ fontSize: '1.2rem' }}></i>
                                      : <i className="bi bi-arrow-down-circle-fill text-danger ms-2" style={{ fontSize: '1.2rem' }}></i>}
                                  </div>
                                  <span className={`badge bg-${barColor} fs-6`} style={{ padding: '8px 16px' }}>{pct}%</span>
                                </div>
                                <div className="progress category-progress" style={{ height: '22px', borderRadius: '15px' }}>
                                  <div className={`progress-bar bg-${barColor}`} role="progressbar" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="d-flex gap-3 justify-content-center">
                        <button className="btn btn-primary" onClick={() => window.print()} style={{ backgroundColor: '#59B5AA', borderColor: '#59B5AA' }}>
                          <i className="bi bi-printer me-2"></i>Print Results
                        </button>
                        <button className="btn btn-outline-primary" onClick={resetAssessment} style={{ borderColor: '#59B5AA', color: '#59B5AA' }}>
                          <i className="bi bi-arrow-clockwise me-2"></i>Retake Assessment
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>
          )}

          {/* Quiz */}
          <Card className="mb-4 fade-in-up" style={{ borderRadius: '20px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
            <div className="mb-4">
              <h3 className="text-primary-custom" style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                <i className="bi bi-clipboard-check-fill me-2"></i>{assessmentData.title}
              </h3>
              <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>{assessmentData.description}</p>
            </div>

            {assessmentData.pending || assessmentData.questions.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3"><i className="bi bi-hourglass-split text-warning" style={{ fontSize: '3rem' }}></i></div>
                <h5 className="text-muted">Quiz is being prepared</h5>
                <p className="text-muted">
                  Gemini AI is generating a personalized quiz for <strong>{selectedChild?.name}</strong>.
                  This usually takes under a minute. Please check back shortly.
                </p>
                <button className="btn btn-outline-primary mt-2" onClick={() => selectedChild?._id && fetchChildQuiz(selectedChild._id)}>
                  <i className="bi bi-arrow-clockwise me-2"></i>Check Again
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {assessmentData.questions.map((q, index) => (
                  <div key={q.id} className={`question-card ${index > 0 ? 'mt-4' : ''}`}>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <div className="mb-3 d-flex align-items-center flex-wrap gap-2">
                            <span className="question-number">{index + 1}</span>
                            <span className={`badge bg-${getCategoryBadgeColor(q.category)}`} style={{ fontSize: '0.9rem' }}>
                              <i className={`${getCategoryIcon(q.category)} me-1`}></i>{q.category}
                            </span>
                          </div>
                          <h6 className="mb-0" style={{ fontSize: '1.15rem', fontWeight: '600', lineHeight: '1.6' }}>{q.question}</h6>
                        </div>
                        {answers[q.id] && <i className="bi bi-check-circle-fill text-success ms-3" style={{ fontSize: '1.8rem' }}></i>}
                      </div>
                      <div className="d-flex flex-wrap gap-3 mt-3">
                        {q.options.map((option, optIndex) => (
                          <div key={optIndex} className="form-check flex-grow-1" style={{ minWidth: '200px' }}>
                            <input
                              className="form-check-input" type="radio" name={q.id} id={`${q.id}-${optIndex}`}
                              checked={answers[q.id]?.optionIndex === optIndex}
                              onChange={() => handleAnswer(q.id, optIndex, q.scores[optIndex])}
                            />
                            <label className="form-check-label w-100" htmlFor={`${q.id}-${optIndex}`}>
                              <div className="p-3 border rounded hover-shadow" style={{ cursor: 'pointer', borderRadius: '12px', fontSize: '1rem' }}>{option}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-top d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={getAnsweredCount() < getTotalQuestions() || requiresChildSelection}
                    style={{
                      backgroundColor: getAnsweredCount() < getTotalQuestions() || requiresChildSelection ? '#6c757d' : '#59B5AA',
                      borderColor: getAnsweredCount() < getTotalQuestions() || requiresChildSelection ? '#6c757d' : '#59B5AA'
                    }}
                    title={requiresChildSelection ? 'Please select a child first' : getAnsweredCount() < getTotalQuestions() ? `Please answer all questions (${getAnsweredCount()}/${getTotalQuestions()})` : 'Submit Assessment'}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    {requiresChildSelection ? 'Select Child First' : getAnsweredCount() < getTotalQuestions() ? `Answer All (${getAnsweredCount()}/${getTotalQuestions()})` : 'Submit Assessment'}
                  </button>
                </div>
              </form>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Assessment;
