import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ChildProvider } from '../context/ChildContext';
import Register from '../components/Auth/Register';
import Login from '../components/Auth/Login';
import VerifyOtp from '../components/Auth/VerifyOtp';
import ForgotPassword from '../components/Auth/ForgotPassword';
import ResetPassword from '../components/Auth/ResetPassword';
import Dashboard from './Dashboard';
import AdminDashboard from './Admin/AdminDashboard';
import CaregiverDashboard from './CaregiverDashboard';
import ExpertDashboard from './ExpertDashboard';

// Import new pages
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Home from '../pages/Home';
import Assessment from '../pages/Assessment';
import Games from '../pages/Games';
import MemoryMatchGame from '../pages/MemoryMatchGame';
import SoundMatchingGame from '../pages/SoundMatchingGame';
import ColorMatchingGame from '../pages/ColorMatchingGame';
import EmotionExplorerGame from '../pages/EmotionExplorerGame';
import CommunicationBuilderGame from '../pages/CommunicationBuilderGame';
import Tracker from '../pages/Tracker';
import Therapy from '../pages/Therapy';
import Communication from '../pages/Communication';
import DashboardPage from '../pages/DashboardPage';
import Resources from '../pages/Resources';
import AdminUsers from '../pages/AdminUsers';
import AssessmentManagement from '../pages/AssessmentManagement';
import Reports from '../pages/Reports';
import Sessions from '../pages/Sessions';
import Leaderboard from '../pages/Leaderboard';
import Profile from '../pages/Profile';
import About from '../pages/About';
import Settings from '../pages/Settings';
import ChangePassword from '../pages/ChangePassword';
import Notifications from '../pages/Notifications';
import Help from '../pages/Help';
import ChildManagement from '../pages/ChildManagement';
import ChildReports from '../pages/ChildReports';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect admin users to admin panel
    return user?.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />;
  }

  return children;
};

function AppContent() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Public Pages */}
        <Route path="/games" element={<Games />} />
        <Route path="/games/memory-match" element={<MemoryMatchGame />} />
        <Route path="/games/sound-matching" element={<SoundMatchingGame />} />
        <Route path="/games/color-matching" element={<ColorMatchingGame />} />
        <Route path="/games/emotion-explorer" element={<EmotionExplorerGame />} />
        <Route path="/games/communication-builder" element={<CommunicationBuilderGame />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/about" element={<About />} />
        
        {/* Protected User Pages */}
        <Route
          path="/assessment"
          element={
            <ProtectedRoute>
              <Assessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver-dashboard"
          element={
            <ProtectedRoute>
              <CaregiverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expert-dashboard"
          element={
            <ProtectedRoute>
              <ExpertDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <Tracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapy"
          element={
            <ProtectedRoute>
              <Therapy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communication"
          element={
            <ProtectedRoute>
              <Communication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <Sessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />
        <Route
          path="/child-management"
          element={
            <ProtectedRoute>
              <ChildManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/child-reports"
          element={
            <ProtectedRoute>
              <ChildReports />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Pages */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment-management"
          element={
            <ProtectedRoute>
              <AssessmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assessments"
          element={
            <ProtectedRoute>
              <AssessmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Child Management Routes */}
        <Route
          path="/children"
          element={
            <ProtectedRoute>
              <ChildManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/child-reports"
          element={
            <ProtectedRoute>
              <ChildReports />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ChildProvider>
            <div className="min-vh-100 bg-light">
              <AppContent />
            </div>
          </ChildProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
