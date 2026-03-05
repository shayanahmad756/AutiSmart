import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Toast from '../components/Toast';
import { assessmentService } from '../services';
import { childService } from '../services';

const AssessmentManagement = () => {
  const [children, setChildren] = useState([]);
  const [childQuizSummaries, setChildQuizSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [generatingChild, setGeneratingChild] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchChildren(); }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childService.getAllChildren();
      const kids = response.data || [];
      setChildren(kids);
      const summaries = {};
      await Promise.all(kids.map(async (child) => {
        try {
          const quizResp = await assessmentService.getChildQuiz(child._id);
          summaries[child._id] = quizResp.success ? quizResp.data : null;
        } catch { summaries[child._id] = null; }
      }));
      setChildQuizSummaries(summaries);
    } catch (error) {
      console.warn('Could not load children:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleGenerateChildQuiz = async (childId, childName) => {
    try {
      setGeneratingChild(childId);
      await assessmentService.generateChildQuiz(childId);
      showToast(`Personalized quiz regenerated for ${childName}!`, 'success');
      try {
        const quizResp = await assessmentService.getChildQuiz(childId);
        if (quizResp.success) setChildQuizSummaries(prev => ({ ...prev, [childId]: quizResp.data }));
      } catch { /* best-effort */ }
    } catch (error) {
      showToast(`Failed to generate quiz for ${childName}: ${error.message}`, 'danger');
    } finally {
      setGeneratingChild(null);
    }
  };

  const filteredChildren = children.filter(child =>
    child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (child.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quizReadyCount = children.filter(c => {
    const s = childQuizSummaries[c._id];
    return s && !s.pending && s.questions?.length > 0;
  }).length;

  const pendingCount = children.filter(c => {
    const s = childQuizSummaries[c._id];
    return !s || s.pending || !s.questions?.length;
  }).length;

  return (
    <div className="container-fluid mt-4 mb-5">
      {toast.show && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 10000, maxWidth: '400px' }}>
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-primary-custom"><i className="bi bi-stars me-2"></i>Child Quiz Management</h1>
        <p className="text-muted">Personalized quizzes are generated automatically by Gemini AI when a child profile is created or updated.</p>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <Card className="card-stat">
            <div className="d-flex justify-content-between align-items-center">
              <div><div className="stat-value">{children.length}</div><div className="stat-label">Total Children</div></div>
              <i className="bi bi-people fs-1 text-muted opacity-50"></i>
            </div>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="card-success">
            <div className="d-flex justify-content-between align-items-center">
              <div><div className="stat-value">{quizReadyCount}</div><div className="stat-label">Quizzes Ready</div></div>
              <i className="bi bi-check-circle-fill fs-1 text-success opacity-50"></i>
            </div>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="card-warning">
            <div className="d-flex justify-content-between align-items-center">
              <div><div className="stat-value">{pendingCount}</div><div className="stat-label">Pending Generation</div></div>
              <i className="bi bi-hourglass-split fs-1 text-warning opacity-50"></i>
            </div>
          </Card>
        </div>
      </div>

      <div className="alert alert-info mb-4 d-flex align-items-start gap-2">
        <i className="bi bi-info-circle-fill mt-1 flex-shrink-0"></i>
        <div>
          <strong>Automatic Quiz Generation:</strong> When a caregiver creates or updates a child profile,
          Gemini AI instantly generates a personalized quiz using the child's name, age, gender, date of birth,
          diagnosis, special needs, and notes. Past assessment results are also used to focus on weaker areas.
          Use <strong>Regenerate</strong> to refresh a child's quiz with the latest profile data.
        </div>
      </div>

      {/* Search */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control" placeholder="Search by child name or diagnosis..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="col-md-6 d-flex align-items-center">
          <span className="text-muted small">Showing {filteredChildren.length} of {children.length} children</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            <p className="text-muted mt-2">Loading children and quiz status...</p>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people fs-1 text-muted"></i>
            <p className="text-muted mt-2">{children.length === 0 ? 'No children found. Children will appear here after caregivers register them.' : 'No children match your search.'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Age / Gender</th>
                  <th>Diagnosis / Special Needs</th>
                  <th>Quiz Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.map((child) => {
                  const quiz = childQuizSummaries[child._id];
                  let statusBadge;
                  if (quiz === undefined) {
                    statusBadge = <span className="badge bg-secondary">Loading...</span>;
                  } else if (!quiz || quiz.pending || !quiz.questions?.length) {
                    statusBadge = (
                      <span className="badge bg-warning text-dark">
                        <i className="bi bi-hourglass-split me-1"></i>Pending
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="badge bg-success" title={`${quiz.questions.length} questions — iteration ${quiz.iteration}`}>
                        <i className="bi bi-stars me-1"></i>Ready ({quiz.questions.length} Qs)
                      </span>
                    );
                  }
                  return (
                    <tr key={child._id}>
                      <td>
                        <div className="fw-medium">{child.name}</div>
                        {child.notes && <div className="text-muted small text-truncate" style={{ maxWidth: 180 }} title={child.notes}>{child.notes}</div>}
                      </td>
                      <td>
                        <div>{child.age} yrs</div>
                        <div className="text-muted small">{child.gender || '—'}</div>
                      </td>
                      <td>
                        <div className="small">{child.diagnosis || '—'}</div>
                        {child.specialNeeds && <div className="text-muted small">{child.specialNeeds}</div>}
                      </td>
                      <td>{statusBadge}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleGenerateChildQuiz(child._id, child.name)}
                          disabled={generatingChild === child._id}
                          title="Regenerate personalized Gemini AI quiz for this child"
                        >
                          {generatingChild === child._id
                            ? <><span className="spinner-border spinner-border-sm me-1"></span>Generating...</>
                            : <><i className="bi bi-arrow-clockwise me-1"></i>Regenerate</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AssessmentManagement;
