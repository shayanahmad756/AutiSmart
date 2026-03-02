import { useState, useEffect } from 'react';
import { useChild } from '../context/ChildContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ChildSelector from '../components/ChildSelector';
import Toast from '../components/Toast';
import { assessmentService } from '../services';
import '../styles/assessment.css';

const Assessment = () => {
  const [answers, setAnswers] = useState({});
  const [currentLevel, setCurrentLevel] = useState('easy');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { selectedChild } = useChild();
  const { user } = useAuth();

  // State for assessment data from backend
  const [assessmentData, setAssessmentData] = useState({
    easy: {
      title: 'Level 1 - Easy (Observation Based)',
      description: 'Basic observation questions about daily interactions',
      questions: [
        { id: 'easy_1', category: 'Social Interaction', question: 'When meeting someone new, your child usually:', options: ['Smiles and says hello', 'Stays quiet', 'Walks away'], scores: [1, 2, 3] },
        { id: 'easy_2', category: 'Social Interaction', question: 'Does your child like playing with other children?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_3', category: 'Focus & Attention', question: 'Does your child respond when you call their name?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_4', category: 'Eye Contact', question: 'Does your child make eye contact during conversation?', options: ['Often', 'Sometimes', 'Rarely'], scores: [1, 2, 3] },
        { id: 'easy_5', category: 'Social Interaction', question: 'When upset, does your child seek comfort?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_6', category: 'Focus & Attention', question: 'Does your child enjoy listening to stories or songs?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_7', category: 'Sensory Sensitivity', question: 'Does your child like trying new foods?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_8', category: 'Eye Contact', question: 'Does your child smile back when someone smiles?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_9', category: 'Communication', question: 'Does your child point to show interest?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_10', category: 'Communication', question: 'Does your child wave goodbye without reminding?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_11', category: 'Focus & Attention', question: 'Does your child react when someone enters the room?', options: ['Responds', 'Sometimes', 'Doesn\'t notice'], scores: [1, 2, 3] },
        { id: 'easy_12', category: 'Social Interaction', question: 'Does your child share toys?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_13', category: 'Social Interaction', question: 'Does your child show excitement during play?', options: ['Often', 'Sometimes', 'Rarely'], scores: [1, 2, 3] },
        { id: 'easy_14', category: 'Social Interaction', question: 'Does your child enjoy pretend play?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'easy_15', category: 'Communication', question: 'When confused, does your child ask for help?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] }
      ]
    },
    intermediate: {
      title: 'Level 2 - Intermediate (Situational & Behavior Awareness)',
      description: 'Questions about behavior in different situations',
      questions: [
        { id: 'int_1', category: 'Social Interaction', question: 'How does your child react to a new toy?', options: ['Plays immediately', 'Watches then plays', 'Avoids it'], scores: [1, 2, 3] },
        { id: 'int_2', category: 'Social Interaction', question: 'In a group, your child prefers to:', options: ['Join', 'Play alone', 'Sit away'], scores: [1, 2, 3] },
        { id: 'int_3', category: 'Focus & Attention', question: 'Does your child notice small changes?', options: ['Often', 'Sometimes', 'Rarely'], scores: [1, 2, 3] },
        { id: 'int_4', category: 'Sensory Sensitivity', question: 'How does your child respond to loud noises?', options: ['Sometimes startled', 'Easily upset', 'Not affected'], scores: [1, 2, 1] },
        { id: 'int_5', category: 'Communication', question: 'Does your child ask questions when confused?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'int_6', category: 'Repetitive Behavior', question: 'Does your child enjoy routine?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 1] },
        { id: 'int_7', category: 'Repetitive Behavior', question: 'Does your child repeat movements?', options: ['Rarely', 'Sometimes', 'Often'], scores: [1, 2, 3] },
        { id: 'int_8', category: 'Repetitive Behavior', question: 'How does your child react to sudden plan changes?', options: ['Calm', 'Slightly confused', 'Upset'], scores: [1, 2, 3] },
        { id: 'int_9', category: 'Focus & Attention', question: 'Does your child listen till the end when spoken to?', options: ['Yes', 'Sometimes', 'Rarely'], scores: [1, 2, 3] },
        { id: 'int_10', category: 'Focus & Attention', question: 'Classroom activity participation:', options: ['Active', 'Needs reminders', 'Avoids'], scores: [1, 2, 3] },
        { id: 'int_11', category: 'Focus & Attention', question: 'Puzzle/task reaction:', options: ['Tries', 'Loses focus', 'Avoids'], scores: [1, 2, 3] },
        { id: 'int_12', category: 'Communication', question: 'Does your child follow 2-step directions?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'int_13', category: 'Sensory Sensitivity', question: 'Reaction to noisy places:', options: ['Comfortable', 'Slight discomfort', 'Very uncomfortable'], scores: [1, 2, 3] },
        { id: 'int_14', category: 'Eye Contact', question: 'Does your child show interest in others?', options: ['Often', 'Sometimes', 'Rarely'], scores: [1, 2, 3] },
        { id: 'int_15', category: 'Communication', question: 'Does your child stay on topic while talking?', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] }
      ]
    },
    advanced: {
      title: 'Level 3 - Advanced (Reasoning & Social Thinking)',
      description: 'Questions about complex social and cognitive skills',
      questions: [
        { id: 'adv_1', category: 'Social Interaction', question: 'If a friend is sad, your child:', options: ['Helps', 'Watches', 'Ignores'], scores: [1, 2, 3] },
        { id: 'adv_2', category: 'Focus & Attention', question: 'Handling 2 tasks at once:', options: ['Successful', 'Focuses on one', 'Confused'], scores: [1, 2, 3] },
        { id: 'adv_3', category: 'Communication', question: 'Describing feelings:', options: ['Easy', 'Sometimes struggles', 'Rarely expresses'], scores: [1, 2, 3] },
        { id: 'adv_4', category: 'Repetitive Behavior', question: 'Adapting to changes in games:', options: ['Tries new ways', 'Hesitant', 'Refuses'], scores: [1, 2, 3] },
        { id: 'adv_5', category: 'Focus & Attention', question: 'Reaction to new learning activity:', options: ['Engages', 'Needs help', 'Avoids'], scores: [1, 2, 3] },
        { id: 'adv_6', category: 'Social Interaction', question: 'Group play rule following:', options: ['Follows', 'Sometimes', 'Creates own rules'], scores: [1, 2, 3] },
        { id: 'adv_7', category: 'Repetitive Behavior', question: 'If routine is disrupted:', options: ['Adjusts', 'Hesitant', 'Upset'], scores: [1, 2, 3] },
        { id: 'adv_8', category: 'Social Interaction', question: 'If child makes a mistake in a game:', options: ['Continues', 'Slightly upset', 'Very upset'], scores: [1, 2, 3] },
        { id: 'adv_9', category: 'Communication', question: 'Understanding new rules:', options: ['Quickly', 'Slowly', 'Difficulty'], scores: [1, 2, 3] },
        { id: 'adv_10', category: 'Communication', question: 'Explaining why they are upset:', options: ['Yes', 'Sometimes', 'Rarely'], scores: [1, 2, 3] },
        { id: 'adv_11', category: 'Social Interaction', question: 'Turn-taking in games:', options: ['Yes', 'Sometimes', 'Rarely'], scores: [1, 2, 3] },
        { id: 'adv_12', category: 'Communication', question: 'Talking about past events:', options: ['Clearly', 'Difficulty', 'Almost never'], scores: [1, 2, 3] },
        { id: 'adv_13', category: 'Social Interaction', question: 'Reaction to losing a game:', options: ['Accepts', 'Slightly upset', 'Avoids playing again'], scores: [1, 2, 3] },
        { id: 'adv_14', category: 'Communication', question: 'Understanding jokes:', options: ['Yes', 'Sometimes', 'No'], scores: [1, 2, 3] },
        { id: 'adv_15', category: 'Eye Contact', question: 'Guessing others\' feelings:', options: ['Often', 'Sometimes', 'Rarely'], scores: [1, 2, 3] }
      ]
    },
    sensory: {
      title: 'Bonus - Sensory & Attention',
      description: 'Questions about sensory processing and attention',
      questions: [
        { id: 'sen_1', category: 'Sensory Sensitivity', question: 'Clothing texture preference:', options: ['No preference', 'Sometimes bothered', 'Yes, very particular'], scores: [1, 2, 3] },
        { id: 'sen_2', category: 'Focus & Attention', question: 'Easily distracted during homework?', options: ['No', 'Sometimes', 'Yes'], scores: [1, 2, 3] },
        { id: 'sen_3', category: 'Repetitive Behavior', question: 'Interest in lights/spinning objects?', options: ['Rarely', 'Sometimes', 'Often'], scores: [1, 2, 3] },
        { id: 'sen_4', category: 'Sensory Sensitivity', question: 'Strong reaction to smells?', options: ['No', 'Sometimes', 'Yes'], scores: [1, 2, 3] },
        { id: 'sen_5', category: 'Sensory Sensitivity', question: 'Covering ears at sudden sounds?', options: ['Rarely', 'Sometimes', 'Often'], scores: [1, 2, 3] }
      ]
    }
  });

  // Fetch assessments on component mount
  useEffect(() => {
    fetchAssessments();
  }, []);

  // When a child is selected, load their personalized quiz
  useEffect(() => {
    if (selectedChild?._id) {
      fetchChildQuiz(selectedChild._id);
    } else {
      // No child selected — revert to global assessments
      fetchAssessments();
    }
    // Reset answers when child changes
    setAnswers({});
    setShowResults(false);
  }, [selectedChild?._id]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await assessmentService.getAssessments();
      if (response.success && response.data) {
        const transformedData = {};
        Object.keys(response.data).forEach(level => {
          if (response.data[level]) {
            transformedData[level] = {
              title: response.data[level].title,
              description: response.data[level].description,
              questions: response.data[level].questions
            };
          }
        });
        if (Object.keys(transformedData).length > 0) {
          setAssessmentData(transformedData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
      showToast('Using default assessment questions', 'info');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildQuiz = async (childId) => {
    try {
      setLoading(true);
      const response = await assessmentService.getChildQuiz(childId);
      if (response.success && response.data) {
        const quizData = {};
        ['easy', 'intermediate', 'advanced', 'sensory'].forEach(level => {
          if (response.data[level]) {
            quizData[level] = {
              title: response.data[level].title,
              description: response.data[level].description,
              questions: response.data[level].questions,
              isPersonalized: response.data[level].isPersonalized
            };
          }
        });
        if (Object.keys(quizData).length > 0) {
          setAssessmentData(quizData);
          const hasPersonalized = Object.values(quizData).some(q => q.isPersonalized);
          if (hasPersonalized) {
            showToast(`Loaded personalized quiz for ${selectedChild?.name}`, 'info');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch child quiz, falling back to global:', error);
      fetchAssessments();
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAnswer = (questionId, optionIndex, score) => {
    setAnswers({
      ...answers,
      [questionId]: { optionIndex, score }
    });
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

    Object.keys(assessmentData).forEach(level => {
      assessmentData[level].questions.forEach(q => {
        if (answers[q.id]) {
          totalScore += answers[q.id].score;
          totalQuestions++;
          
          // Track category scores
          if (categoryScores[q.category]) {
            categoryScores[q.category].score += answers[q.id].score;
            categoryScores[q.category].total += 1;
          }
        }
      });
    });

    return { totalScore, totalQuestions, categoryScores };
  };

  const getAutismLevel = (score, total) => {
    const percentage = (score / (total * 3)) * 100;
    
    if (percentage <= 40) {
      return {
        level: 'Beginner Level',
        color: 'success',
        message: 'The child shows mild or minimal autism characteristics. They may require basic support and intervention.',
        icon: 'bi-star-fill',
        description: 'Low support needs - Child demonstrates good functional abilities with minimal assistance required.'
      };
    } else if (percentage <= 60) {
      return {
        level: 'Intermediate Level',
        color: 'warning',
        message: 'The child shows moderate autism characteristics. They may benefit from regular therapeutic support and structured interventions.',
        icon: 'bi-star-half',
        description: 'Moderate support needs - Child requires consistent support in daily activities and social interactions.'
      };
    } else {
      return {
        level: 'Advanced Level',
        color: 'danger',
        message: 'The child shows significant autism characteristics. They may require intensive support, specialized interventions, and professional guidance.',
        icon: 'bi-stars',
        description: 'High support needs - Child needs substantial assistance across multiple areas of development.'
      };
    }
  };

  const getScoreInterpretation = (score, total) => {
    const percentage = (score / (total * 3)) * 100;
    
    if (percentage <= 40) {
      return {
        level: 'Typical Development',
        color: 'success',
        message: 'The responses indicate typical developmental patterns. Continue encouraging positive behaviors.',
        icon: 'bi-check-circle-fill'
      };
    } else if (percentage <= 60) {
      return {
        level: 'Some Areas of Observation',
        color: 'warning',
        message: 'Some responses suggest areas that may benefit from observation or support. Consider consulting with specialists.',
        icon: 'bi-exclamation-triangle-fill'
      };
    } else {
      return {
        level: 'Further Assessment Recommended',
        color: 'info',
        message: 'The responses indicate several areas that may benefit from professional evaluation and support.',
        icon: 'bi-info-circle-fill'
      };
    }
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

    // Save results to backend if a child is selected
    if (selectedChild?._id) {
      try {
        const { categoryScores } = calculateScore();
        const answersArray = Object.entries(answers).map(([questionId, val]) => ({
          questionId,
          optionIndex: val.optionIndex,
          score: val.score
        }));

        await assessmentService.submitResult(selectedChild._id, {
          totalScore,
          totalQuestions,
          categoryScores,
          answers: answersArray,
          assessmentLevel: 'all'
        });

        showToast(`Results saved! ${selectedChild.name}'s next quiz will be updated automatically.`, 'success');
      } catch (err) {
        console.error('Failed to save result:', err);
        showToast('Could not save results to server. Results shown locally only.', 'warning');
      }
    }
  };

  const getTotalQuestions = () => {
    return Object.values(assessmentData).reduce((sum, level) => sum + level.questions.length, 0);
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const resetAssessment = () => {
    setAnswers({});
    setShowResults(false);
    setCurrentLevel('easy');
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      'Eye Contact': 'success',
      'Social Interaction': 'warning',
      'Communication': 'success',
      'Repetitive Behavior': 'info',
      'Sensory Sensitivity': 'warning',
      'Focus & Attention': 'info'
    };
    return colors[category] || 'secondary';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Eye Contact': 'bi-eye',
      'Social Interaction': 'bi-people',
      'Communication': 'bi-chat-dots',
      'Repetitive Behavior': 'bi-arrow-repeat',
      'Sensory Sensitivity': 'bi-lightbulb',
      'Focus & Attention': 'bi-crosshair'
    };
    return icons[category] || 'bi-circle';
  };

  // Check if caregiver and no child selected
  const requiresChildSelection = user?.role === 'caregiver' && !selectedChild;

  if (loading) {
    return (
      <div className="container mt-4 mb-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading assessments...</span>
          </div>
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
          <div className="mb-4 fade-in-up">
            <h1 className="text-primary-custom" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              <i className="bi bi-clipboard-check me-3" style={{ fontSize: '2.5rem' }}></i>
              AutiSmart Assessment Quiz
            </h1>
            <p className="text-muted" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
              <strong>Age Group: 8-10 years</strong> | Complete behavioral screening with 50 questions
            </p>

            {/* Child Selector */}
            <div className="mb-4">
              <ChildSelector />
            </div>

            {/* Child Selection Warning */}
            {requiresChildSelection && (
              <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
                <div>
                  <h5 className="alert-heading mb-2">Child Selection Required</h5>
                  <p className="mb-2">Please select a child above before starting the assessment. The results will be recorded for the selected child.</p>
                </div>
              </div>
            )}

            {selectedChild && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-person-check-fill me-3 fs-4"></i>
                <div>
                  Playing as <strong>{selectedChild.name}</strong> - Progress will be recorded automatically!
                </div>
              </div>
            )}

            <div className="alert alert-info fade-in-up" style={{ 
              borderRadius: '15px', 
              border: 'none', 
              boxShadow: '0 4px 15px rgba(93, 188, 175, 0.3)',
              background: '#5DBCAF',
              borderLeft: '5px solid #4aa89c',
              color: '#ffffff'
            }}>
              <div className="d-flex align-items-start">
                <i className="bi bi-info-circle-fill me-3" style={{ fontSize: '1.5rem', color: '#ffffff' }}></i>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>Important:</strong> This is a behavioral observation tool, not a medical diagnosis. 
                  Results provide insights for further professional consultation if needed.
                </div>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <Card className="mb-4 fade-in-up" style={{ border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0" style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                <i className="bi bi-graph-up me-2" style={{ color: '#0d6efd' }}></i>
                Assessment Progress
              </h5>
              <span className="badge bg-primary fs-6" style={{ fontSize: '1.1rem', padding: '10px 20px' }}>
                {getAnsweredCount()} / {getTotalQuestions()} Answered
              </span>
            </div>
            <div className="progress" style={{ height: '25px', borderRadius: '25px' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ 
                  width: `${(getAnsweredCount() / getTotalQuestions()) * 100}%`,
                  fontSize: '1rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {Math.round((getAnsweredCount() / getTotalQuestions()) * 100)}%
              </div>
            </div>
          </Card>

          {/* Results Display */}
          {showResults && (
            <Card className="mb-4 border-success">
              <div className="text-center">
                <h3 className="text-success mb-3">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Assessment Complete!
                </h3>
                {(() => {
                  const { totalScore, totalQuestions, categoryScores } = calculateScore();
                  const interpretation = getScoreInterpretation(totalScore, totalQuestions);
                  const autismLevel = getAutismLevel(totalScore, totalQuestions);
                  return (
                    <>
                      {/* Autism Level Display - Main Highlight */}
                      <div className={`alert alert-${autismLevel.color} mb-4`} style={{ 
                        borderRadius: '20px', 
                        border: 'none', 
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        padding: '2rem'
                      }}>
                        <div className="mb-3">
                          <i className={`${autismLevel.icon} me-2`} style={{ fontSize: '3rem' }}></i>
                        </div>
                        <h2 className="mb-3" style={{ fontWeight: '800', fontSize: '2.2rem' }}>
                          {autismLevel.level}
                        </h2>
                        <p className="mb-2" style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                          {autismLevel.message}
                        </p>
                        <p className="mb-0" style={{ fontSize: '1rem', opacity: '0.9' }}>
                          <i className="bi bi-info-circle me-2"></i>
                          {autismLevel.description}
                        </p>
                      </div>

                      <div className={`alert alert-${interpretation.color} mb-3`}>
                        <h4>
                          <i className={`${interpretation.icon} me-2`}></i>
                          {interpretation.level}
                        </h4>
                        <p className="mb-0">{interpretation.message}</p>
                      </div>
                      <div className="row text-center mb-4">
                        <div className="col-md-4 mb-3">
                          <div className="stats-box">
                            <h5 className="text-muted mb-1">Total Score</h5>
                            <h2 className="mb-0">{totalScore}</h2>
                            <small className="text-muted">out of {totalQuestions * 3}</small>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="stats-box">
                            <h5 className="text-muted mb-1">Questions</h5>
                            <h2 className="mb-0">{totalQuestions}</h2>
                            <small className="text-muted">completed</small>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="stats-box">
                            <h5 className="text-muted mb-1">Score %</h5>
                            <h2 className="mb-0">
                              {Math.round((totalScore / (totalQuestions * 3)) * 100)}%
                            </h2>
                            <small className="text-muted">overall</small>
                          </div>
                        </div>
                      </div>

                      {/* Symptom Progress Overview */}
                      <div className="card mb-4 fade-in-up" style={{ borderRadius: '20px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                        <div className="card-body" style={{ padding: '2.5rem' }}>
                          <h4 className="mb-4" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                            <i className="bi bi-bar-chart-fill me-2" style={{ color: '#0d6efd' }}></i>
                            Symptom Progress Overview
                          </h4>
                          {Object.entries(categoryScores).map(([category, data]) => {
                            if (data.total === 0) return null;
                            const percentage = Math.round(((data.total * 3 - data.score) / (data.total * 3)) * 100);
                            const isImproving = percentage >= 50;
                            const barColor = percentage >= 60 ? 'success' : percentage >= 40 ? 'warning' : 'info';
                            
                            return (
                              <div key={category} className={`symptom-progress-item ${barColor}-category`}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                    <i className={`${getCategoryIcon(category)} me-2`} style={{ fontSize: '1.3rem' }}></i>
                                    {category}
                                    {isImproving ? (
                                      <i className="bi bi-arrow-up-circle-fill text-success ms-2" style={{ fontSize: '1.2rem' }}></i>
                                    ) : (
                                      <i className="bi bi-arrow-down-circle-fill text-danger ms-2" style={{ fontSize: '1.2rem' }}></i>
                                    )}
                                  </div>
                                  <span className={`badge bg-${barColor} fs-6`} style={{ padding: '8px 16px', fontSize: '1.1rem' }}>
                                    {percentage}%
                                  </span>
                                </div>
                                <div className="progress category-progress" style={{ height: '22px', borderRadius: '15px' }}>
                                  <div
                                    className={`progress-bar bg-${barColor}`}
                                    role="progressbar"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="d-flex gap-3 justify-content-center">
                        <button 
                          className="btn btn-primary" 
                          onClick={() => window.print()}
                          style={{ backgroundColor: '#59B5AA', borderColor: '#59B5AA' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#4a9d93'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#59B5AA'}
                        >
                          <i className="bi bi-printer me-2"></i>
                          Print Results
                        </button>
                        <button 
                          className="btn btn-outline-primary" 
                          onClick={resetAssessment}
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
                          Retake Assessment
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>
          )}

          {/* Level Navigation */}
          <div className="mb-4">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${currentLevel === 'easy' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentLevel('easy')}
                style={{
                  backgroundColor: currentLevel === 'easy' ? '#59B5AA' : 'transparent',
                  borderColor: '#59B5AA',
                  color: currentLevel === 'easy' ? '#fff' : '#59B5AA'
                }}
                onMouseEnter={(e) => {
                  if (currentLevel !== 'easy') {
                    e.target.style.backgroundColor = '#59B5AA';
                    e.target.style.color = '#fff';
                  } else {
                    e.target.style.backgroundColor = '#4a9d93';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLevel !== 'easy') {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#59B5AA';
                  } else {
                    e.target.style.backgroundColor = '#59B5AA';
                  }
                }}
              >
                <i className="bi bi-1-circle me-2"></i>
                Level 1: Easy
                <span className="badge bg-light text-dark ms-2">
                  {assessmentData.easy.questions.filter(q => answers[q.id]).length}/{assessmentData.easy.questions.length}
                </span>
              </button>
              <button
                type="button"
                className={`btn ${currentLevel === 'intermediate' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentLevel('intermediate')}
                style={{
                  backgroundColor: currentLevel === 'intermediate' ? '#59B5AA' : 'transparent',
                  borderColor: '#59B5AA',
                  color: currentLevel === 'intermediate' ? '#fff' : '#59B5AA'
                }}
                onMouseEnter={(e) => {
                  if (currentLevel !== 'intermediate') {
                    e.target.style.backgroundColor = '#59B5AA';
                    e.target.style.color = '#fff';
                  } else {
                    e.target.style.backgroundColor = '#4a9d93';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLevel !== 'intermediate') {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#59B5AA';
                  } else {
                    e.target.style.backgroundColor = '#59B5AA';
                  }
                }}
              >
                <i className="bi bi-2-circle me-2"></i>
                Level 2: Intermediate
                <span className="badge bg-light text-dark ms-2">
                  {assessmentData.intermediate.questions.filter(q => answers[q.id]).length}/{assessmentData.intermediate.questions.length}
                </span>
              </button>
              <button
                type="button"
                className={`btn ${currentLevel === 'advanced' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentLevel('advanced')}
                style={{
                  backgroundColor: currentLevel === 'advanced' ? '#59B5AA' : 'transparent',
                  borderColor: '#59B5AA',
                  color: currentLevel === 'advanced' ? '#fff' : '#59B5AA'
                }}
                onMouseEnter={(e) => {
                  if (currentLevel !== 'advanced') {
                    e.target.style.backgroundColor = '#59B5AA';
                    e.target.style.color = '#fff';
                  } else {
                    e.target.style.backgroundColor = '#4a9d93';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLevel !== 'advanced') {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#59B5AA';
                  } else {
                    e.target.style.backgroundColor = '#59B5AA';
                  }
                }}
              >
                <i className="bi bi-3-circle me-2"></i>
                Level 3: Advanced
                <span className="badge bg-light text-dark ms-2">
                  {assessmentData.advanced.questions.filter(q => answers[q.id]).length}/{assessmentData.advanced.questions.length}
                </span>
              </button>
              <button
                type="button"
                className={`btn ${currentLevel === 'sensory' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentLevel('sensory')}
                style={{
                  backgroundColor: currentLevel === 'sensory' ? '#59B5AA' : 'transparent',
                  borderColor: '#59B5AA',
                  color: currentLevel === 'sensory' ? '#fff' : '#59B5AA'
                }}
                onMouseEnter={(e) => {
                  if (currentLevel !== 'sensory') {
                    e.target.style.backgroundColor = '#59B5AA';
                    e.target.style.color = '#fff';
                  } else {
                    e.target.style.backgroundColor = '#4a9d93';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLevel !== 'sensory') {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#59B5AA';
                  } else {
                    e.target.style.backgroundColor = '#59B5AA';
                  }
                }}
              >
                <i className="bi bi-stars me-2"></i>
                Sensory
                <span className="badge bg-light text-dark ms-2">
                  {assessmentData.sensory.questions.filter(q => answers[q.id]).length}/{assessmentData.sensory.questions.length}
                </span>
              </button>
            </div>
          </div>

          {/* Current Level Questions */}
          <Card className="mb-4 fade-in-up" style={{ borderRadius: '20px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
            <div className="mb-4">
              <h3 className="text-primary-custom" style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                <i className="bi bi-clipboard-check-fill me-2"></i>
                {assessmentData[currentLevel].title}
              </h3>
              <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>{assessmentData[currentLevel].description}</p>
            </div>

            <form onSubmit={handleSubmit}>
              {assessmentData[currentLevel].questions.map((q, index) => (
                <div key={q.id} className={`question-card ${index > 0 ? 'mt-4' : ''}`}>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <div className="mb-3 d-flex align-items-center flex-wrap gap-2">
                          <span className="question-number">{index + 1}</span>
                          <span className={`badge bg-${getCategoryBadgeColor(q.category)}`} style={{ fontSize: '0.9rem' }}>
                            <i className={`${getCategoryIcon(q.category)} me-1`}></i>
                            {q.category}
                          </span>
                        </div>
                        <h6 className="mb-0" style={{ fontSize: '1.15rem', fontWeight: '600', lineHeight: '1.6' }}>{q.question}</h6>
                      </div>
                      {answers[q.id] && (
                        <i className="bi bi-check-circle-fill text-success ms-3" style={{ fontSize: '1.8rem' }}></i>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-3 mt-3">
                      {q.options.map((option, optIndex) => (
                        <div key={optIndex} className="form-check flex-grow-1" style={{ minWidth: '200px' }}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name={q.id}
                            id={`${q.id}-${optIndex}`}
                            checked={answers[q.id]?.optionIndex === optIndex}
                            onChange={() => handleAnswer(q.id, optIndex, q.scores[optIndex])}
                          />
                          <label className="form-check-label w-100" htmlFor={`${q.id}-${optIndex}`}>
                            <div className="p-3 border rounded hover-shadow" style={{ cursor: 'pointer', borderRadius: '12px', fontSize: '1rem' }}>
                              {option}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Buttons */}
              <div className="mt-4 pt-4 border-top">
                <div className="d-flex justify-content-between">
                  <div>
                    {currentLevel !== 'easy' && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const levels = ['easy', 'intermediate', 'advanced', 'sensory'];
                          const currentIndex = levels.indexOf(currentLevel);
                          if (currentIndex > 0) setCurrentLevel(levels[currentIndex - 1]);
                        }}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Previous Level
                      </button>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    {currentLevel !== 'sensory' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          const levels = ['easy', 'intermediate', 'advanced', 'sensory'];
                          const currentIndex = levels.indexOf(currentLevel);
                          if (currentIndex < levels.length - 1) setCurrentLevel(levels[currentIndex + 1]);
                        }}
                        style={{ backgroundColor: '#59B5AA', borderColor: '#59B5AA' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#4a9d93'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#59B5AA'}
                      >
                        Next Level
                        <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    )}
                    {currentLevel === 'sensory' && (
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={getAnsweredCount() < getTotalQuestions() || requiresChildSelection}
                        style={{ 
                          backgroundColor: getAnsweredCount() < getTotalQuestions() || requiresChildSelection ? '#6c757d' : '#59B5AA', 
                          borderColor: getAnsweredCount() < getTotalQuestions() || requiresChildSelection ? '#6c757d' : '#59B5AA' 
                        }}
                        onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#4a9d93')}
                        onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#59B5AA')}
                        title={requiresChildSelection ? 'Please select a child first' : getAnsweredCount() < getTotalQuestions() ? `Please answer all questions (${getAnsweredCount()}/${getTotalQuestions()})` : 'Submit Assessment'}
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        {requiresChildSelection ? 'Select Child First' : getAnsweredCount() < getTotalQuestions() ? `Answer All (${getAnsweredCount()}/${getTotalQuestions()})` : 'Submit Assessment'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </Card>

          {/* Quick Stats */}
          <div className="row">
            <div className="col-md-3 mb-3">
              <Card className="text-center fade-in-up" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}>
                <div className="p-3">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>
                    <i className="bi bi-1-circle-fill" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
                  </div>
                  <h6 className="mt-2" style={{ fontWeight: '700', fontSize: '1.1rem' }}>Level 1</h6>
                  <p className="text-muted small mb-0">
                    <strong>{assessmentData.easy.questions.filter(q => answers[q.id]).length}</strong>/15 answered
                  </p>
                </div>
              </Card>
            </div>
            <div className="col-md-3 mb-3">
              <Card className="text-center fade-in-up" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}>
                <div className="p-3">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>
                    <i className="bi bi-2-circle-fill" style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
                  </div>
                  <h6 className="mt-2" style={{ fontWeight: '700', fontSize: '1.1rem' }}>Level 2</h6>
                  <p className="text-muted small mb-0">
                    <strong>{assessmentData.intermediate.questions.filter(q => answers[q.id]).length}</strong>/15 answered
                  </p>
                </div>
              </Card>
            </div>
            <div className="col-md-3 mb-3">
              <Card className="text-center fade-in-up" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}>
                <div className="p-3">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>
                    <i className="bi bi-3-circle-fill" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
                  </div>
                  <h6 className="mt-2" style={{ fontWeight: '700', fontSize: '1.1rem' }}>Level 3</h6>
                  <p className="text-muted small mb-0">
                    <strong>{assessmentData.advanced.questions.filter(q => answers[q.id]).length}</strong>/15 answered
                  </p>
                </div>
              </Card>
            </div>
            <div className="col-md-3 mb-3">
              <Card className="text-center fade-in-up" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}>
                <div className="p-3">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>
                    <i className="bi bi-stars" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
                  </div>
                  <h6 className="mt-2" style={{ fontWeight: '700', fontSize: '1.1rem' }}>Sensory</h6>
                  <p className="text-muted small mb-0">
                    <strong>{assessmentData.sensory.questions.filter(q => answers[q.id]).length}</strong>/5 answered
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
