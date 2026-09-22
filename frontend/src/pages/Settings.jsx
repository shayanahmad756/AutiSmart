import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { getAutoNavigateSetting, setAutoNavigateSetting } from '../utils/settingsStorage';

const Settings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    emailNotifications: true,
    smsNotifications: false,
    theme: 'light',
    language: 'en',
    autoNavigate: getAutoNavigateSetting(),
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;

    if (name === 'autoNavigate') {
      setAutoNavigateSetting(nextValue);
    }

    setFormData({
      ...formData,
      [name]: nextValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // API call to update settings
      // await updateSettings(formData);
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update settings. Please try again.');
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h2 className="mb-4">
            <i className="bi bi-gear me-2 text-primary"></i>
            Account Settings
          </h2>

          {success && (
            <div className="alert alert-success alert-dismissible fade show">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          )}

          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {/* Profile Information */}
          <Card title="Profile Information" className="mb-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Role</label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.role || 'User'}
                  disabled
                />
                <small className="text-muted">Contact admin to change your role</small>
              </div>
            </form>
          </Card>

          {/* Notification Preferences */}
          <Card title="Notification Preferences" className="mb-4">
            <div className="mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="emailNotifications"
                  id="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="emailNotifications">
                  Email Notifications
                </label>
              </div>
              <small className="text-muted">Receive updates via email</small>
            </div>

            <div className="mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="smsNotifications"
                  id="smsNotifications"
                  checked={formData.smsNotifications}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="smsNotifications">
                  SMS Notifications
                </label>
              </div>
              <small className="text-muted">Receive updates via SMS</small>
            </div>
          </Card>

          {/* App Preferences */}
          <Card title="App Preferences" className="mb-4">
            <div className="mb-3">
              <label className="form-label">Theme</label>
              <select
                className="form-select"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Language</label>
              <select
                className="form-select"
                name="language"
                value={formData.language}
                onChange={handleChange}
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            <div className="mb-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="autoNavigate"
                  id="autoNavigate"
                  checked={formData.autoNavigate}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="autoNavigate">
                  Automatically start next therapy game after assessment
                </label>
              </div>
              <small className="text-muted">When enabled, the assessment results will count down and move to therapy games automatically.</small>
            </div>
          </Card>

          {/* Save Button */}
          <div className="d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary" onClick={() => window.history.back()}>
              <i className="bi bi-arrow-left me-2"></i>
              Back
            </button>
            <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
              <i className="bi bi-save me-2"></i>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
