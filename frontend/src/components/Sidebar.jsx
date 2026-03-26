import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/profile', icon: 'bi-person-circle', label: 'Profile' },
    { path: '/games', icon: 'bi-controller', label: 'Therapy Games' },
    { path: '/assessment', icon: 'bi-clipboard-check', label: 'Assessment' },
    { path: '/tracker', icon: 'bi-graph-up', label: 'Tracker' },
    { path: '/therapy', icon: 'bi-chat-dots', label: 'Discussion' },
    { path: '/sessions', icon: 'bi-calendar-event', label: 'Sessions' },
    { path: '/communication', icon: 'bi-chat-dots', label: 'Communication' },
    { path: '/resources', icon: 'bi-book', label: 'Resources' },
    { path: '/leaderboard', icon: 'bi-trophy', label: 'Leaderboard' },
    { path: '/autism-detection', icon: 'bi-camera-fill', label: 'Autism Detection' },
  ];
  
  const adminItems = [
    { path: '/admin/users', icon: 'bi-people', label: 'Users' },
    { path: '/admin/assessments', icon: 'bi-clipboard-data', label: 'Assessments' },
    { path: '/admin/reports', icon: 'bi-file-earmark-text', label: 'Reports' },
  ];

  return (
    <div className="sidebar d-none d-lg-block">
      <div className="mb-4">
        <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
          Main Menu
        </h6>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon} me-2`}></i>
            {item.label}
          </Link>
        ))}
      </div>
      
      <div>
        <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
          Admin
        </h6>
        {adminItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon} me-2`}></i>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
