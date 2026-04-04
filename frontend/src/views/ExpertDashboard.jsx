import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { childService } from '../services';

const ExpertDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'expert') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await childService.getAllChildren();
      if (response.success) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError(error.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const patientRows = patients.map(child => ({
    id: child._id,
    name: child.name,
    age: child.age,
    diagnosis: child.diagnosis || 'General Care',
    lastUpdated: child.updatedAt ? new Date(child.updatedAt).toISOString().split('T')[0] : 'N/A',
    caregiver: child.caregiverId?.name || 'Unknown'
  }));

  return (
    <div className="min-vh-100 caregiver-dashboard-wrapper">
      <div className="container mt-4 mb-5">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{
              background: '#A6A2CF',
              borderRadius: '20px',
              overflow: 'hidden'
            }}>
              <div className="card-body p-4 p-md-5 text-white position-relative">
                <div className="position-absolute top-0 end-0 opacity-10 d-none d-md-block" style={{ fontSize: '10rem', right: '-2rem', top: '-2rem' }}>
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <div className="position-relative" style={{ zIndex: 1 }}>
                  <h1 className="mb-3 fw-bold d-flex align-items-center flex-wrap" style={{
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    lineHeight: '1.3'
                  }}>
                    <i className="bi bi-person-badge-fill me-2 me-md-3"></i>
                    <span>Expert Dashboard</span>
                  </h1>
                  <p className="mb-0 opacity-90" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: '1.6' }}>
                    Welcome back, <strong>Dr. {user?.name}</strong>!{' '}
                    {patientRows.length > 0
                      ? `You have ${patientRows.length} ${patientRows.length === 1 ? 'patient' : 'patients'} in the system.`
                      : 'Patients will appear here once caregivers add children.'}
                  </p>
                  {error && (
                    <div className="alert alert-warning mt-2 mb-0" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{
              borderRadius: '16px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div style={{
                      background: '#5EBEB0',
                      borderRadius: '16px',
                      padding: '1rem',
                      color: 'white'
                    }}>
                      <i className="bi bi-person-badge fs-3"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="text-muted small mb-1">Account Status</div>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ background: '#5EBEB0', color: 'white', borderRadius: '20px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: 600 }}><i className="bi bi-check-circle me-1"></i>Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{
              borderRadius: '16px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div style={{
                      background: '#5EBEB0',
                      borderRadius: '16px',
                      padding: '1rem',
                      color: 'white'
                    }}>
                      <i className="bi bi-shield-check fs-3"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="text-muted small mb-1">Email Verified</div>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ background: '#5EBEB0', color: 'white', borderRadius: '20px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: 600 }}><i className="bi bi-patch-check-fill me-1"></i>Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{
              borderRadius: '16px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div style={{
                      background: '#5EBEB0',
                      borderRadius: '16px',
                      padding: '1rem',
                      color: 'white'
                    }}>
                      <i className="bi bi-award fs-3"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="text-muted small mb-1">Your Role</div>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ background: '#5EBEB0', color: 'white', borderRadius: '20px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: 600 }}><i className="bi bi-mortarboard-fill me-1"></i>Expert</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Patients + Quick Actions */}
        <div className="row g-4">
          <div className="col-lg-9">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 px-4">
                <h5 className="mb-0 fw-bold"><i className="bi bi-people-fill me-2" style={{ color: '#5EBEB0' }}></i>My Patients</h5>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: '#5EBEB0' }} role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading patients...</p>
                  </div>
                ) : patientRows.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-people fs-1" style={{ color: '#5EBEB0', opacity: 0.4 }}></i>
                    <p className="mt-3 text-muted">No patients found in the database</p>
                    <p className="text-muted small">Patients will appear here once caregivers add children to the system</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead style={{ background: 'rgba(94,190,176,0.08)' }}>
                        <tr>
                          <th className="px-4 py-3 border-0">Patient</th>
                          <th className="py-3 border-0">Age</th>
                          <th className="py-3 border-0">Diagnosis</th>
                          <th className="py-3 border-0">Caregiver</th>
                          <th className="py-3 border-0">Last Updated</th>
                          <th className="py-3 border-0">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientRows.map((patient) => (
                          <tr key={patient.id} style={{ transition: 'background 0.2s ease' }}>
                            <td className="fw-bold px-4 py-3"><i className="bi bi-person-circle me-2" style={{ color: '#5EBEB0' }}></i>{patient.name}</td>
                            <td className="py-3">{patient.age} years</td>
                            <td className="py-3">
                              <Badge variant="info"><i className="bi bi-activity me-1"></i>{patient.diagnosis}</Badge>
                            </td>
                            <td className="py-3">
                              <small className="text-muted"><i className="bi bi-person-fill me-1"></i>{patient.caregiver}</small>
                            </td>
                            <td className="text-muted py-3"><i className="bi bi-calendar3 me-1"></i>{patient.lastUpdated}</td>
                            <td className="py-3">
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm rounded-pill px-3"
                                  style={{ border: '1.5px solid #5EBEB0', color: '#5EBEB0', background: 'transparent' }}
                                  onClick={() => navigate(`/child-reports?childId=${patient.id}`)}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5EBEB0'; e.currentTarget.style.color = 'white'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5EBEB0'; }}>
                                  <i className="bi bi-file-earmark-bar-graph me-1"></i>Report
                                </button>
                                <button className="btn btn-sm rounded-pill px-3"
                                  style={{ border: '1.5px solid #5EBEB0', color: '#5EBEB0', background: 'transparent' }}
                                  onClick={() => navigate(`/expert/child/${patient.id}/quiz-results`)}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5EBEB0'; e.currentTarget.style.color = 'white'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5EBEB0'; }}>
                                  <i className="bi bi-clipboard2-check me-1"></i>Quiz
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '14px' }}>
              <div className="card-header bg-white border-0 pt-3 px-4 pb-0">
                <h6 className="mb-0 fw-bold" style={{ fontSize: '0.95rem' }}><i className="bi bi-lightning-charge-fill me-2" style={{ color: '#5EBEB0' }}></i>Quick Actions</h6>
              </div>
              <div className="card-body p-3 px-4 d-grid gap-2">
                <button className="btn btn-sm" style={{ border: '1.5px solid #5EBEB0', color: '#5EBEB0', background: 'transparent', borderRadius: '8px', fontSize: '0.85rem', padding: '6px 10px' }}
                  onClick={() => navigate('/child-reports')}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5EBEB0'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5EBEB0'; }}>
                  <i className="bi bi-file-earmark-bar-graph-fill me-1"></i>View Reports
                </button>
                <button className="btn btn-sm" style={{ border: '1.5px solid #5EBEB0', color: '#5EBEB0', background: 'transparent', borderRadius: '8px', fontSize: '0.85rem', padding: '6px 10px' }}
                  onClick={() => navigate('/expert-quiz-results')}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5EBEB0'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5EBEB0'; }}>
                  <i className="bi bi-clipboard2-check me-1"></i>Quiz Results
                </button>
                <button className="btn btn-sm" style={{ border: '1.5px solid #5EBEB0', color: '#5EBEB0', background: 'transparent', borderRadius: '8px', fontSize: '0.85rem', padding: '6px 10px' }}
                  onClick={() => navigate('/communication')}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5EBEB0'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5EBEB0'; }}>
                  <i className="bi bi-chat-dots me-1"></i>Message Caregivers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
