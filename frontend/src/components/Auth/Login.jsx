import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, sessionExpired, setSessionExpired } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (sessionExpired) {
      setError('Session expired due to inactivity. Please login again.');
      setSessionExpired(false);
    }
  }, [sessionExpired, setSessionExpired]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const payload = { email: formData.email, password: formData.password };
        
      const response = await login(payload);
      
      if (response.success) {
        // Navigate based on user role
        const userRole = response.data.user.role;
        switch (userRole) {
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          case 'caregiver':
            navigate('/caregiver-dashboard', { replace: true });
            break;
          case 'expert':
            navigate('/expert-dashboard', { replace: true });
            break;
          default:
            navigate('/dashboard', { replace: true });
            break;
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Login to AutiSmart</h2>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute"
                      onClick={togglePasswordVisibility}
                      style={{
                        right: '5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'none',
                        padding: '0',
                        color: '#6c757d'
                      }}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <p className="mb-2">
                  <a href="/forgot-password" className="text-decoration-none" style={{ color: '#5BB8AC' }}>
                    Forgot password?
                  </a>
                </p>
                <p className="mb-0">
                  Don't have an account?{' '}
                  <a href="/register" className="text-decoration-none" style={{ color: '#5BB8AC' }}>
                    Register here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
