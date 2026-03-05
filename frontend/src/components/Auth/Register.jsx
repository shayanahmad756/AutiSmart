import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
  });
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name, value, data) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required.';
        if (!/^[A-Za-z\s]+$/.test(value)) return 'Full name can only contain letters and spaces.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        if (value.trim().length > 50) return 'Full name must not exceed 50 characters.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required.';
        if (!/^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
          return 'Please enter a valid email address.';
        return '';
      case 'role':
        if (!value) return 'Please select a role.';
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Password must be at least 6 characters.';
        if (value.length > 50) return 'Password must not exceed 50 characters.';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter.';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number.';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== (data ? data.password : '')) return 'Passwords do not match.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    setServerError('');
    const newErrors = { ...errors, [name]: validateField(name, value, newFormData) };
    if (name === 'password' && newFormData.confirmPassword) {
      newErrors.confirmPassword = validateField('confirmPassword', newFormData.confirmPassword, newFormData);
    }
    setErrors(newErrors);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const fields = ['name', 'email', 'role', 'password', 'confirmPassword'];
    const newErrors = {};
    let hasError = false;
    for (const field of fields) {
      const msg = validateField(field, formData[field], formData);
      newErrors[field] = msg;
      if (msg) hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);

    try {
      // Email Registration
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      const response = await register(payload);

      if (response.success) {
        navigate('/verify-otp', { state: { email: formData.email } });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setServerError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Register for AutiSmart</h2>

              {serverError && (
                <div className="alert alert-danger" role="alert">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Full Name
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control${errors.name ? ' is-invalid' : formData.name ? ' is-valid' : ''}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                  />
                  {errors.name && (
                    <div style={{ color: 'red', fontSize: '0.875em', marginTop: '4px' }}>{errors.name}</div>
                  )}
                </div>

                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control${errors.email ? ' is-invalid' : formData.email ? ' is-valid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <div style={{ color: 'red', fontSize: '0.875em', marginTop: '4px' }}>{errors.email}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="role" className="form-label">
                    Role
                    <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select${errors.role ? ' is-invalid' : formData.role ? ' is-valid' : ''}`}
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="">Select a role</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="expert">Expert</option>
                  </select>
                  {errors.role && (
                    <div style={{ color: 'red', fontSize: '0.875em', marginTop: '4px' }}>{errors.role}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                    <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control${errors.password ? ' is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password (min 6 characters)"
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
                  {errors.password && (
                    <div style={{ color: 'red', fontSize: '0.875em', marginTop: '4px' }}>{errors.password}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                    <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-control${errors.confirmPassword ? ' is-invalid' : ''}`}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute"
                      onClick={toggleConfirmPasswordVisibility}
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
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div style={{ color: 'red', fontSize: '0.875em', marginTop: '4px' }}>{errors.confirmPassword}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <p className="mb-0">
                  Already have an account?{' '}
                  <a href="/login" className="text-decoration-none" style={{ color: '#5BB8AC' }}>
                    Login here
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

export default Register;
