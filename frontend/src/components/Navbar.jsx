import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeMenu();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="navbar-overlay" 
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
      
      <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
        <div className="container-fluid px-4">
            <Link className="navbar-brand fw-bold d-flex align-items-center" to="/" onClick={closeMenu}>
            <img src="/logo.PNG" alt="AutiSmart Logo" style={{ height: '40px' }} />
          </Link>
          <button
            className={`navbar-toggler ${isOpen ? 'active' : ''}`}
            type="button"
            onClick={toggleMenu}
            aria-controls="navbarNav"
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
            style={{ border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
          </button>
          <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {!isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/" end onClick={closeMenu}>Home</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/resources" onClick={closeMenu}>Resources</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/about" onClick={closeMenu}>About</NavLink>
                </li>
              </>
            )}
            
            {isAuthenticated && user?.role === 'user' && (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/children" onClick={closeMenu}>My Children</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/assessment" onClick={closeMenu}>Assessment</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/games" onClick={closeMenu}>Therapy Games</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/child-reports" onClick={closeMenu}>Reports</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/tracker" onClick={closeMenu}>Tracker</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/resources" onClick={closeMenu}>Resources</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/about" onClick={closeMenu}>About</NavLink>
                </li>
              </>
            )}
            
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/admin" end onClick={closeMenu}>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/admin-users" onClick={closeMenu}>Users</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/admin/expert-assignments" onClick={closeMenu}>Expert Assignments</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/assessment-management" onClick={closeMenu}>Assessments</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/about" onClick={closeMenu}>About</NavLink>
                </li>
              </>
            )}
            
            {isAuthenticated && user?.role === 'caregiver' && (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/caregiver-dashboard" onClick={closeMenu}>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/child-management" onClick={closeMenu}>Children</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/autism-detection" onClick={closeMenu}>Detection</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/assessment" onClick={closeMenu}>Assessment</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/games" onClick={closeMenu}>Therapy Games</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/child-reports" onClick={closeMenu}>Reports</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/tracker" onClick={closeMenu}>Tracker</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/communication" onClick={closeMenu}>Chat</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/my-expert" onClick={closeMenu}>My Expert</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/resources" onClick={closeMenu}>Resources</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/about" onClick={closeMenu}>About</NavLink>
                </li>
              </>
            )}
            
            {isAuthenticated && user?.role === 'expert' && (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/expert-dashboard" onClick={closeMenu}>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/tracker" onClick={closeMenu}>Tracker</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/child-reports" onClick={closeMenu}>Reports</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/expert-quiz-results" onClick={closeMenu}>Quiz Results</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/communication" onClick={closeMenu}>Chat</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/resources" onClick={closeMenu}>Resources</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} to="/about" onClick={closeMenu}>About</NavLink>
                </li>
              </>
            )}
            
            {/* Theme Toggle Button */}
            <li className="nav-item ms-2">
              <ThemeToggle />
            </li>
            
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <span className="nav-link text-white">
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.name}
                  </span>
                </li>
                <li className="nav-item ms-3">
                  <button className="btn btn-light btn-sm px-3 py-2 shadow-sm" onClick={handleLogout} style={{borderRadius: '8px', fontWeight: '500'}}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item ms-3">
                <Link className="btn btn-light btn-sm px-3 py-2 shadow-sm" to="/login" onClick={closeMenu} style={{borderRadius: '8px', fontWeight: '500'}}>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
    </>
  );
};

export default Navbar;
