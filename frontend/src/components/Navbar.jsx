import { Link, useNavigate } from 'react-router-dom';
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
                  <Link className="nav-link" to="/" onClick={closeMenu}>Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/resources" onClick={closeMenu}>Resources</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about" onClick={closeMenu}>About</Link>
                </li>
              </>
            )}
            
            {isAuthenticated && user?.role === 'user' && (
              <>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/dashboard" 
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/children" onClick={closeMenu}>My Children</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/assessment" onClick={closeMenu}>Assessment</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/games" onClick={closeMenu}>Therapy Games</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/child-reports" onClick={closeMenu}>Reports</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/tracker" onClick={closeMenu}>Tracker</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/therapy" onClick={closeMenu}>Discussion</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/resources" onClick={closeMenu}>Resources</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about" onClick={closeMenu}>About</Link>
                </li>
              </>
            )}
            
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin" onClick={closeMenu}>
                    <i className="bi bi-speedometer2 me-1"></i>Admin Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin-users" onClick={closeMenu}>
                    <i className="bi bi-people me-1"></i>Users
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/assessment-management" onClick={closeMenu}>
                    <i className="bi bi-clipboard-data me-1"></i>Assessments
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about" onClick={closeMenu}>About</Link>
                </li>
              </>
            )}
            
            {isAuthenticated && user?.role === 'caregiver' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/caregiver-dashboard" onClick={closeMenu}>Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/child-management" onClick={closeMenu}>Children</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/assessment" onClick={closeMenu}>Assessment</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/games" onClick={closeMenu}>Therapy Games</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/child-reports" onClick={closeMenu}>Reports</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/tracker" onClick={closeMenu}>Tracker</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/therapy" onClick={closeMenu}>Discussion</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/resources" onClick={closeMenu}>Resources</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about" onClick={closeMenu}>About</Link>
                </li>
              </>
            )}
            
            {isAuthenticated && user?.role === 'expert' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/expert-dashboard" onClick={closeMenu}>Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/assessment" onClick={closeMenu}>Assessment</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/games" onClick={closeMenu}>Therapy Games</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/tracker" onClick={closeMenu}>Tracker</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/therapy" onClick={closeMenu}>Discussion</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/resources" onClick={closeMenu}>Resources</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about" onClick={closeMenu}>About</Link>
                </li>
              </>
            )}
            
            {/* Run Detection button — visible to authenticated users only */}
            {isAuthenticated && (
              <li className="nav-item ms-2">
                <Link
                  className="btn btn-sm px-3 py-2 shadow-sm"
                  to="/autism-detection"
                  onClick={closeMenu}
                  style={{ background: '#61C3B4', color: '#fff', borderRadius: '8px', fontWeight: '500', whiteSpace: 'nowrap' }}
                >
                  <i className="bi bi-camera-fill me-2"></i>
                  Run Detection
                </Link>
              </li>
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
