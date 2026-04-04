import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const statsData = await userService.getStats();
      setStats(statsData.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100">
      <div className="container-fluid px-4 mt-4">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, var(--danger) 0%, var(--danger-light) 100%)'}}>
              <div className="card-body p-4 text-white">
                <h2 className="mb-2" style={{textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>
                  <i className="bi bi-shield-lock me-2"></i>
                  Admin Dashboard
                </h2>
                <p className="mb-0 opacity-90">
                  Welcome back, {user?.name}! Manage users and system settings.
                </p>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)'}}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <i className="bi bi-people-fill fs-1 me-3 text-white opacity-75"></i>
                  <div>
                    <div className="text-white opacity-75 small">Total Users</div>
                    <h2 className="text-white mb-0">{stats?.totalUsers || 0}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, var(--success) 0%, var(--success-light) 100%)'}}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <i className="bi bi-check-circle-fill fs-1 me-3 text-white opacity-75"></i>
                  <div>
                    <div className="text-white opacity-75 small">Verified</div>
                    <h2 className="text-white mb-0">{stats?.verifiedUsers || 0}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, var(--warning) 0%, var(--warning-light) 100%)'}}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock-fill fs-1 me-3 text-white opacity-75"></i>
                  <div>
                    <div className="text-white opacity-75 small">Unverified</div>
                    <h2 className="text-white mb-0">{stats?.unverifiedUsers || 0}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, var(--info) 0%, var(--info-light) 100%)'}}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <i className="bi bi-star-fill fs-1 me-3 text-white opacity-75"></i>
                  <div>
                    <div className="text-white opacity-75 small">Experts</div>
                    <h2 className="text-white mb-0">{stats?.experts || 0}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div 
              className="card border-0 shadow-sm h-100 cursor-pointer"
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/admin-users')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div 
                    className="rounded-circle p-3 me-3"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      width: '70px',
                      height: '70px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="bi bi-people-fill fs-1 text-white"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-1 text-primary-custom">User Management</h5>
                    <p className="text-muted mb-0 small">
                      Create, edit, and manage all platform users
                    </p>
                  </div>
                  <i className="bi bi-arrow-right-circle fs-3 text-muted"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div 
              className="card border-0 shadow-sm h-100 cursor-pointer"
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/assessment-management')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div 
                    className="rounded-circle p-3 me-3"
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      width: '70px',
                      height: '70px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="bi bi-clipboard-data-fill fs-1 text-white"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-1 text-primary-custom">Quiz Assessments</h5>
                    <p className="text-muted mb-0 small">
                      Create and manage quiz-based assessments
                    </p>
                  </div>
                  <i className="bi bi-arrow-right-circle fs-3 text-muted"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
