import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import { assessmentService } from '../services';
import { childService } from '../services';

const AssessmentManagement = () => {
  const [activeTab, setActiveTab] = useState('assessments'); // 'assessments' | 'childQuizzes'
  const [assessments, setAssessments] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [aiConfig, setAiConfig] = useState({ categories: ['Social Interaction', 'Communication'], count: 5 });
  const [generatingChild, setGeneratingChild] = useState(null); // childId being regenerated

  // Manual question builder state
  const [newQuestion, setNewQuestion] = useState({
    category: 'Social Interaction',
    question: '',
    option1: '', option2: '', option3: '',
    score1: 1, score2: 2, score3: 3
  });
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    level: 'easy',
    title: '',
    description: '',
    questions: [],
    formDefinition: [],
    isActive: true,
  });

  const categories = [
    'Eye Contact',
    'Social Interaction',
    'Communication',
    'Repetitive Behavior',
    'Sensory Sensitivity',
    'Focus & Attention'
  ];

  const levels = [
    { value: 'easy', label: 'Level 1 - Easy' },
    { value: 'intermediate', label: 'Level 2 - Intermediate' },
    { value: 'advanced', label: 'Level 3 - Advanced' },
    { value: 'sensory', label: 'Bonus - Sensory & Attention' }
  ];

  // Fetch assessments
  useEffect(() => {
    fetchAssessments();
    fetchChildren();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await assessmentService.getAllAssessments();
      setAssessments(response.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to fetch assessments', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await childService.getAllChildren();
      setChildren(response.data || []);
    } catch (error) {
      console.warn('Could not load children:', error.message);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleCreateNew = () => {
    setModalMode('create');
    setFormData({
      level: 'easy',
      title: '',
      description: '',
      questions: [],
      formDefinition: [],
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (assessment) => {
    setModalMode('edit');
    setSelectedAssessment(assessment);
    setFormData({
      level: assessment.level,
      title: assessment.title,
      description: assessment.description,
      questions: assessment.questions || [],
      formDefinition: assessment.formDefinition || [],
      isActive: assessment.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (assessmentId) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;

    try {
      await assessmentService.deleteAssessment(assessmentId);
      showToast('Assessment deleted successfully', 'success');
      fetchAssessments();
    } catch (error) {
      showToast(error.message || 'Failed to delete assessment', 'danger');
    }
  };

  const handleAddManualQuestion = () => {
    const { category, question, option1, option2, option3, score1, score2, score3 } = newQuestion;
    if (!question.trim() || !option1.trim() || !option2.trim() || !option3.trim()) {
      showToast('Please fill in the question and all 3 options', 'warning');
      return;
    }
    const q = {
      id: `q_${Date.now()}`,
      category,
      question: question.trim(),
      options: [option1.trim(), option2.trim(), option3.trim()],
      scores: [Number(score1), Number(score2), Number(score3)]
    };
    setFormData(prev => ({ ...prev, questions: [...prev.questions, q] }));
    setNewQuestion({ category: 'Social Interaction', question: '', option1: '', option2: '', option3: '', score1: 1, score2: 2, score3: 3 });
    setAddingQuestion(false);
  };

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Gemini AI: generate questions and append to the list
  const handleGenerateQuestions = async () => {
    if (aiConfig.categories.length === 0) {
      showToast('Select at least one category for AI generation', 'warning');
      return;
    }
    try {
      setGenerating(true);
      const response = await assessmentService.generateQuestions({
        level: formData.level,
        categories: aiConfig.categories,
        count: aiConfig.count
      });
      const generatedQuestions = response.data?.questions || [];
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...generatedQuestions]
      }));
      showToast(`${generatedQuestions.length} questions generated and added!`, 'success');
    } catch (error) {
      showToast(`AI generation unavailable: ${error.message}`, 'danger');
    } finally {
      setGenerating(false);
    }
  };

  // Admin: regenerate child's personalized quiz
  const handleGenerateChildQuiz = async (childId, childName) => {
    try {
      setGeneratingChild(childId);
      await assessmentService.generateChildQuiz(childId, null);
      showToast(`Personalized quiz generated for ${childName}!`, 'success');
    } catch (error) {
      showToast(`Failed to generate quiz for ${childName}: ${error.message}`, 'danger');
    } finally {
      setGeneratingChild(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description) {
      showToast('Please fill all required fields (title and description)', 'warning');
      return;
    }

    // Title validation
    if (formData.title.trim().length < 3) {
      showToast('Title must be at least 3 characters long', 'warning');
      return;
    }

    if (formData.title.trim().length > 100) {
      showToast('Title must not exceed 100 characters', 'warning');
      return;
    }

    // Description validation
    if (formData.description.trim().length < 10) {
      showToast('Description must be at least 10 characters long', 'warning');
      return;
    }

    if (formData.description.trim().length > 500) {
      showToast('Description must not exceed 500 characters', 'warning');
      return;
    }

    // Level validation
    const validLevels = ['easy', 'intermediate', 'advanced', 'sensory'];
    if (!validLevels.includes(formData.level)) {
      showToast('Please select a valid assessment level', 'warning');
      return;
    }

    if (formData.questions.length === 0) {
      showToast('Please add at least one question using the AI generator or manual builder', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        level: formData.level,
        title: formData.title,
        description: formData.description,
        questions: formData.questions,
        formDefinition: formData.formDefinition,
        isActive: formData.isActive
      };
      if (modalMode === 'create') {
        await assessmentService.createAssessment(payload);
        showToast('Assessment created successfully', 'success');
      } else {
        await assessmentService.updateAssessment(selectedAssessment._id, payload);
        showToast('Assessment updated successfully', 'success');
      }
      setShowModal(false);
      await fetchAssessments();
    } catch (error) {
      console.error('Submit error:', error);
      let errorMessage = 'Failed to save assessment';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      showToast(errorMessage, 'danger');
      // Keep modal open on error
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !filterLevel || assessment.level === filterLevel;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && assessment.isActive) ||
                         (filterStatus === 'inactive' && !assessment.isActive);
    return matchesSearch && matchesLevel && matchesStatus;
  });

  return (
    <div className="container-fluid mt-4 mb-5">
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 10000,
            maxWidth: '400px',
          }}
        >
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-primary-custom">
          <i className="bi bi-clipboard-data me-2"></i>
          Quiz Assessment Management
        </h1>
        <p className="text-muted">Create and manage quiz-based assessments</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'assessments' ? 'active fw-semibold' : ''}`}
            onClick={() => setActiveTab('assessments')}
          >
            <i className="bi bi-clipboard-check me-2"></i>Global Assessments
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'childQuizzes' ? 'active fw-semibold' : ''}`}
            onClick={() => setActiveTab('childQuizzes')}
          >
            <i className="bi bi-person-heart me-2"></i>Child Quizzes
            {children.length > 0 && (
              <span className="badge bg-primary ms-2">{children.length}</span>
            )}
          </button>
        </li>
      </ul>

      {/* ──── ASSESSMENTS TAB ──── */}
      {activeTab === 'assessments' && (
        <>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-primary" onClick={handleCreateNew}>
              <i className="bi bi-plus-lg me-2"></i>Create New Assessment
            </button>
          </div>

          {/* Stats */}
          <div className="row g-4 mb-4">
        <div className="col-md-3">
          <Card className="card-stat">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-value">{assessments.length}</div>
                <div className="stat-label">Total Assessments</div>
              </div>
              <i className="bi bi-clipboard-check fs-1 text-muted opacity-50"></i>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="card-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-value">{assessments.filter(a => a.isActive).length}</div>
                <div className="stat-label">Active</div>
              </div>
              <i className="bi bi-check-circle-fill fs-1 text-success opacity-50"></i>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="card-warning">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-value">{assessments.filter(a => !a.isActive).length}</div>
                <div className="stat-label">Inactive</div>
              </div>
              <i className="bi bi-slash-circle fs-1 text-warning opacity-50"></i>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="card-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-value">
                  {assessments.reduce((acc, a) => acc + a.questions.length, 0)}
                </div>
                <div className="stat-label">Total Questions</div>
              </div>
              <i className="bi bi-question-circle fs-1 text-info opacity-50"></i>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Assessments Table */}
      <Card>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted"></i>
            <p className="text-muted mt-2">No assessments found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Title</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment._id}>
                    <td>
                      <Badge variant="info">
                        {levels.find(l => l.value === assessment.level)?.label || assessment.level}
                      </Badge>
                    </td>
                    <td>
                      <div className="fw-medium">{assessment.title}</div>
                      <div className="text-muted small">{assessment.description}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{assessment.questions.length} Questions</span>
                    </td>
                    <td>
                      <Badge variant={assessment.isActive ? 'success' : 'secondary'}>
                        {assessment.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-muted small">
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(assessment)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(assessment._id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalMode === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  {/* Basic Info */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Level *</label>
                      <select
                        className="form-select"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        required
                      >
                        {levels.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label className="form-check-label">
                          {formData.isActive ? 'Active' : 'Inactive'}
                        </label>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description *</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      ></textarea>
                    </div>
                  </div>

                  {/* AI Generation Panel */}
                  <div className="card mb-4 border-primary">
                    <div className="card-header bg-primary text-white d-flex align-items-center">
                      <i className="bi bi-stars me-2"></i>
                      <h6 className="mb-0">Generate Questions with Gemini AI</h6>
                    </div>
                    <div className="card-body">
                      <div className="row g-3 align-items-end">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Focus Categories</label>
                          <div className="d-flex flex-wrap gap-2">
                            {categories.map(cat => (
                              <div key={cat} className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`ai-cat-${cat}`}
                                  checked={aiConfig.categories.includes(cat)}
                                  onChange={(e) => {
                                    setAiConfig(prev => ({
                                      ...prev,
                                      categories: e.target.checked
                                        ? [...prev.categories, cat]
                                        : prev.categories.filter(c => c !== cat)
                                    }));
                                  }}
                                />
                                <label className="form-check-label small" htmlFor={`ai-cat-${cat}`}>{cat}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Number of Questions</label>
                          <input
                            type="number"
                            className="form-control"
                            min="1" max="15"
                            value={aiConfig.count}
                            onChange={(e) => setAiConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 5 }))}
                          />
                        </div>
                        <div className="col-md-3">
                          <button
                            type="button"
                            className="btn btn-primary w-100"
                            onClick={handleGenerateQuestions}
                            disabled={generating}
                          >
                            {generating ? (
                              <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                            ) : (
                              <><i className="bi bi-stars me-2"></i>Generate</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Questions ({formData.questions.length})</h6>
                      {formData.questions.length > 0 && (
                        <button type="button" className="btn btn-sm btn-outline-danger"
                          onClick={() => setFormData(prev => ({ ...prev, questions: [] }))}
                        >
                          <i className="bi bi-trash me-1"></i>Clear All
                        </button>
                      )}
                    </div>
                    {formData.questions.length > 0 && (
                      <div className="list-group mb-3">
                        {formData.questions.map((q, index) => (
                          <div key={index} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="fw-medium">{index + 1}. {q.question}</div>
                                <div className="text-muted small">Category: {q.category}</div>
                                <div className="mt-1">
                                  {q.options.map((opt, i) => (
                                    <span key={i} className="badge bg-light text-dark me-2">
                                      {opt} (Score: {q.scores[i]})
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveQuestion(index)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Question Builder */}
                  <div className="card mb-4 border-secondary">
                    <div className="card-header d-flex align-items-center justify-content-between">
                      <div>
                        <i className="bi bi-ui-checks-grid me-2"></i>
                        <h6 className="mb-0 d-inline">Add Question Manually</h6>
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={() => setAddingQuestion(v => !v)}>
                        <i className={`bi bi-${addingQuestion ? 'dash' : 'plus'}-lg me-1`}></i>
                        {addingQuestion ? 'Collapse' : 'Add Question'}
                      </button>
                    </div>
                    {addingQuestion && (
                      <div className="card-body">
                        <div className="row g-2">
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">Category</label>
                            <select className="form-select form-select-sm"
                              value={newQuestion.category}
                              onChange={e => setNewQuestion(p => ({ ...p, category: e.target.value }))}>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold">Question Text *</label>
                            <input type="text" className="form-control form-control-sm"
                              placeholder="Enter question..."
                              value={newQuestion.question}
                              onChange={e => setNewQuestion(p => ({ ...p, question: e.target.value }))} />
                          </div>
                          {[1,2,3].map(i => (
                            <div key={i} className="col-md-8">
                              <label className="form-label small fw-semibold">Option {i} *</label>
                              <div className="input-group input-group-sm">
                                <input type="text" className="form-control"
                                  placeholder={`Option ${i}`}
                                  value={newQuestion[`option${i}`]}
                                  onChange={e => setNewQuestion(p => ({ ...p, [`option${i}`]: e.target.value }))} />
                                <span className="input-group-text">Score</span>
                                <select className="form-select" style={{ maxWidth: 80 }}
                                  value={newQuestion[`score${i}`]}
                                  onChange={e => setNewQuestion(p => ({ ...p, [`score${i}`]: Number(e.target.value) }))}>
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                </select>
                              </div>
                            </div>
                          ))}
                          <div className="col-12 mt-2">
                            <button type="button" className="btn btn-sm btn-success" onClick={handleAddManualQuestion}>
                              <i className="bi bi-plus-circle me-1"></i>Add to List
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {modalMode === 'create' ? 'Creating...' : 'Updating...'}
                        </>
                      ) : (
                        modalMode === 'create' ? 'Create Assessment' : 'Update Assessment'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* ──── CHILD QUIZZES TAB ──── */}
      {activeTab === 'childQuizzes' && (
        <>
          <div className="alert alert-info mb-4">
            <i className="bi bi-info-circle me-2"></i>
            Each child gets a personalized quiz generated by Gemini AI based on their assessment history.
            Quizzes auto-update after each submission. You can also manually regenerate below.
          </div>

          <Card>
            {children.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-people fs-1 text-muted"></i>
                <p className="text-muted mt-2">No children found. Children will appear here after caregivers register them.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Child</th>
                      <th>Age</th>
                      <th>Diagnosis</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((child) => (
                      <tr key={child._id}>
                        <td>
                          <div className="fw-medium">{child.name}</div>
                          <div className="text-muted small">{child.gender}</div>
                        </td>
                        <td>{child.age} yrs</td>
                        <td>
                          <span className="text-muted small">{child.diagnosis || '—'}</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleGenerateChildQuiz(child._id, child.name)}
                            disabled={generatingChild === child._id}
                            title="Generate personalized AI quiz for this child"
                          >
                            {generatingChild === child._id ? (
                              <><span className="spinner-border spinner-border-sm me-1"></span>Generating...</>
                            ) : (
                              <><i className="bi bi-stars me-1"></i>Regenerate AI Quiz</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default AssessmentManagement;
