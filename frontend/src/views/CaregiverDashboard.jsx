import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';

const CaregiverDashboard = () => {
  const { user, logout } = useAuth();
  const { childrenList, loading: childrenLoading } = useChild();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'caregiver') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-vh-100 caregiver-dashboard-wrapper">
      <div className="container mt-4 mb-5">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{
              background: '#5EBEB0',
              borderRadius: '20px',
              overflow: 'hidden'
            }}>
              <div className="card-body p-4 p-md-5 text-white position-relative">
                <div className="position-absolute top-0 end-0 opacity-10 d-none d-md-block" style={{ fontSize: '10rem', right: '-2rem', top: '-2rem' }}>
                  <i className="bi bi-heart-fill"></i>
                </div>
                <div className="position-relative" style={{ zIndex: 1 }}>
                  <h1 className="mb-3 fw-bold d-flex align-items-center flex-wrap" style={{
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    lineHeight: '1.3'
                  }}>
                    <i className="bi bi-heart-fill me-2 me-md-3"></i>
                    <span>Caregiver Dashboard</span>
                  </h1>
                  <p className="mb-0 opacity-90" style={{
                    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                    lineHeight: '1.6',
                    maxWidth: '100%',
                    wordWrap: 'break-word'
                  }}>
                    Welcome back, <strong>{user?.name}</strong>!{' '}
                    {childrenList.length > 0 
                      ? `Manage your ${childrenList.length} ${childrenList.length === 1 ? 'child' : 'children'} and track their progress.` 
                      : 'Add children to start tracking their progress.'}
                  </p>
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
                      <Badge variant="success"><i className="bi bi-check-circle me-1"></i>Active</Badge>
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
                      <Badge variant="success"><i className="bi bi-patch-check-fill me-1"></i>Verified</Badge>
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
                      <Badge variant="primary"><i className="bi bi-star-fill me-1"></i>Caregiver</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{
              borderRadius: '16px',
              borderLeft: '4px solid #5EBEB0',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="text-muted small text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>
                      Total Children
                    </div>
                    <div className="fs-1 fw-bold" style={{
                      background: 'linear-gradient(135deg, #5EBEB0 0%, #61C3B4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {childrenList.length}
                    </div>
                  </div>
                  <div className="fs-2" style={{ color: '#5EBEB0', opacity: '0.5' }}>
                    <i className="bi bi-people"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{
              borderRadius: '16px',
              borderLeft: '4px solid #5EBEB0',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="text-muted small text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>
                      Your Name
                    </div>
                    <div className="fs-3 fw-bold text-capitalize" style={{ color: '#5EBEB0' }}>
                      {user?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="fs-2" style={{ color: '#5EBEB0', opacity: '0.5' }}>
                    <i className="bi bi-person"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{
              borderRadius: '16px',
              borderLeft: '4px solid #5EBEB0',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="text-muted small text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>
                      Account Type
                    </div>
                    <div className="fs-3 fw-bold text-capitalize" style={{ color: '#5EBEB0' }}>
                      {user?.role || 'Caregiver'}
                    </div>
                  </div>
                  <div className="fs-2" style={{ color: '#5EBEB0', opacity: '0.5' }}>
                    <i className="bi bi-person-badge"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Child Management Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #5EBEB010 0%, #61C3B410 100%)' }}>
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h4 className="mb-2 fw-bold">
                      <i className="bi bi-people-fill me-2" style={{ color: '#5EBEB0' }}></i>
                      Child Management
                    </h4>
                    <p className="text-muted mb-3 mb-md-0">
                      Manage your children's profiles, track their progress, and view detailed reports for each child.
                    </p>
                  </div>
                  <div className="col-md-4">
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-lg shadow-sm"
                        onClick={() => navigate('/child-management')}
                        style={{ borderRadius: '12px', background: '#5EBEB0', color: 'white' }}
                      >
                        <i className="bi bi-person-plus-fill me-2"></i>
                        Manage Children
                      </button>
                      <button 
                        className="btn btn-lg"
                        onClick={() => navigate('/child-reports')}
                        style={{ borderRadius: '12px', border: '2px solid #5EBEB0', color: '#5EBEB0', background: 'transparent' }}
                      >
                        <i className="bi bi-file-earmark-bar-graph-fill me-2"></i>
                        View Reports
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Main Content */}
          <div className="col-lg-8">
            {childrenLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading children data...</p>
              </div>
            ) : childrenList.length === 0 ? (
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                <div className="card-body p-5 text-center">
                  <div className="mb-4">
                    <i className="bi bi-info-circle" style={{ fontSize: '4rem', color: '#5EBEB0' }}></i>
                  </div>
                  <h4 className="mb-3">No Children Added Yet</h4>
                  <p className="text-muted mb-4">
                    Add your first child to start tracking their progress, assessments, and therapy activities. 
                    Once you add children and they complete assessments or games, their data will appear here.
                  </p>
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate('/child-management')}
                    style={{ borderRadius: '12px' }}
                  >
                    <i className="bi bi-person-plus-fill me-2"></i>
                    Add Your First Child
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Children List */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                  <div className="card-header border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold"><i className="bi bi-people-fill me-2" style={{ color: '#5EBEB0' }}></i>Your Children</h5>
                    <button 
                      className="btn btn-sm"
                      onClick={() => navigate('/child-management')}
                      style={{ borderRadius: '8px', background: '#5EBEB0', color: 'white' }}
                    >
                      <i className="bi bi-pencil-square me-1"></i>Manage
                    </button>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      {childrenList.map((child) => (
                        <div key={child._id} className="col-md-6">
                          <div 
                            className="p-4 rounded-3 border h-100 child-card-bg" 
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => navigate('/child-reports')}
                          >
                            <div className="d-flex align-items-center mb-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  background: '#5EBEB0'
                                }}
                              >
                                <i className="bi bi-person-fill fs-4"></i>
                              </div>
                              <div>
                                <h6 className="mb-0 fw-bold">{child.name}</h6>
                                <small className="text-muted">{child.age} years old</small>
                              </div>
                            </div>
                            {child.gender && (
                              <div className="mb-2">
                                <small className="text-muted">
                                  <i className="bi bi-gender-ambiguous me-1"></i>
                                  {child.gender}
                                </small>
                              </div>
                            )}
                            {child.notes && (
                              <div className="text-muted small" style={{ 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }}>
                                <i className="bi bi-sticky me-1"></i>
                                {child.notes}
                              </div>
                            )}
                            <div className="mt-3">
                              <Badge variant="info">
                                <i className="bi bi-bar-chart-fill me-1"></i>View Reports
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info Card */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-3 fw-bold">
                      <i className="bi bi-lightbulb-fill me-2 text-warning"></i>
                      Next Steps
                    </h5>
                    <ul className="mb-0" style={{ paddingLeft: '1.5rem' }}>
                      <li className="mb-2">Select a child and have them complete assessments or play therapy games</li>
                      <li className="mb-2">View detailed progress reports in the "View Reports" section</li>
                      <li className="mb-0">Download PDF reports to share with professionals</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Quick Actions */}
            <Card title="Quick Actions" className="mb-4">
              <div className="d-grid gap-2">
                <button className="btn" style={{ border: '2px solid #5EBEB1', color: '#5EBEB1', background: 'transparent' }} onClick={() => navigate('/child-management')}>
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Manage Children
                </button>
                <button className="btn" style={{ border: '2px solid #5EBEB1', color: '#5EBEB1', background: 'transparent' }} onClick={() => navigate('/child-reports')}>
                  <i className="bi bi-file-earmark-bar-graph-fill me-2"></i>
                  View Reports
                </button>
                <button className="btn" style={{ border: '2px solid #5EBEB1', color: '#5EBEB1', background: 'transparent' }} onClick={() => navigate('/assessment')}>
                  <i className="bi bi-clipboard-check me-2"></i>
                  Start Assessment
                </button>
                <button className="btn" style={{ border: '2px solid #5EBEB1', color: '#5EBEB1', background: 'transparent' }} onClick={() => navigate('/games')}>
                  <i className="bi bi-controller me-2"></i>
                  Play Therapy Games
                </button>
                <button className="btn" style={{ border: '2px solid #5EBEB1', color: '#5EBEB1', background: 'transparent' }} onClick={() => navigate('/communication')}>
                  <i className="bi bi-chat-dots me-2"></i>
                  Message Expert
                </button>
              </div>
            </Card>

            {/* Getting Started Guide */}
            <Card title="Getting Started" className="mb-4">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: '32px', height: '32px', fontSize: '14px', flexShrink: 0, background: '#5EBEB1' }}
                  >
                    1
                  </div>
                  <div>
                    <h6 className="mb-1">Add Children</h6>
                    <small className="text-muted">Create profiles for your children</small>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: '32px', height: '32px', fontSize: '14px', flexShrink: 0, background: '#5EBEB1' }}
                  >
                    2
                  </div>
                  <div>
                    <h6 className="mb-1">Select Child</h6>
                    <small className="text-muted">Choose a child before starting activities</small>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: '32px', height: '32px', fontSize: '14px', flexShrink: 0, background: '#5EBEB1' }}
                  >
                    3
                  </div>
                  <div>
                    <h6 className="mb-1">Complete Activities</h6>
                    <small className="text-muted">Play games and do assessments</small>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: '32px', height: '32px', fontSize: '14px', flexShrink: 0, background: '#5EBEB1' }}
                  >
                    4
                  </div>
                  <div>
                    <h6 className="mb-1">Track Progress</h6>
                    <small className="text-muted">View reports and download PDFs</small>
                  </div>
                </div>
              </div>
            </Card>

            {/* Help Card */}
            <Card title="Need Help?" className="card-info">
              <p className="mb-3 small">
                If you have questions or need assistance, feel free to reach out to our support team.
              </p>
              <button className="btn w-100" style={{ background: '#5EBEB1', color: 'white' }} onClick={() => navigate('/help')}>
                <i className="bi bi-question-circle me-2"></i>
                Visit Help Center
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaregiverDashboard;
