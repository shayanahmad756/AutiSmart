import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import { useAuth } from '../context/AuthContext';
import { childService, assessmentService } from '../services';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import '../styles/childReports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChildReports = () => {
  const { childrenList, loading: childrenLoading } = useChild();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isExpertMode = user?.role === 'expert';
  const expertChildId = searchParams.get('childId');
  const [selectedChildId, setSelectedChildId] = useState(expertChildId || '');
  const [reportData, setReportData] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChildList, setShowChildList] = useState(false);
  const [allChildren, setAllChildren] = useState([]);
  const [allChildrenLoading, setAllChildrenLoading] = useState(false);

  // For experts: fetch all children across all caregivers
  useEffect(() => {
    if (!isExpertMode) return;
    const fetchAll = async () => {
      try {
        setAllChildrenLoading(true);
        const res = await childService.getAllChildren();
        const list = (res.data || []).map(c => ({ ...c, id: c._id || c.id }));
        setAllChildren(list);
        if (list.length > 0 && !selectedChildId) {
          setSelectedChildId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching all children:', err);
      } finally {
        setAllChildrenLoading(false);
      }
    };
    fetchAll();
  }, [isExpertMode]);

  const displayChildren = isExpertMode ? allChildren : childrenList;

  // Load saved child ID from localStorage or use first child (caregiver only)
  useEffect(() => {
    if (isExpertMode) return;
    if (childrenList.length > 0 && !selectedChildId) {
      const savedChildId = localStorage.getItem('lastSelectedChildForReport');
      
      // Check if saved child still exists in the list
      const childExists = savedChildId && childrenList.some(child => child.id === savedChildId);
      
      if (childExists) {
        setSelectedChildId(savedChildId);
      } else {
        setSelectedChildId(childrenList[0].id);
      }
    }
  }, [childrenList, isExpertMode]);

  // Save selected child ID to localStorage whenever it changes
  useEffect(() => {
    if (selectedChildId) {
      localStorage.setItem('lastSelectedChildForReport', selectedChildId);
      loadReport();
    }
  }, [selectedChildId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showChildList && !event.target.closest('.position-relative')) {
        setShowChildList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChildList]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const [reportResponse, assessmentResponse] = await Promise.allSettled([
        childService.getChildReport(selectedChildId),
        assessmentService.getChildResults(selectedChildId)
      ]);

      if (reportResponse.status === 'fulfilled') {
        const { child, ...statistics } = reportResponse.value.data;
        setReportData({ child, statistics });
      } else {
        throw reportResponse.reason;
      }

      if (assessmentResponse.status === 'fulfilled') {
        setAssessmentResults(assessmentResponse.value.data);
      } else {
        setAssessmentResults(null);
      }
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setError(''); // Clear any previous errors
      const blob = await childService.downloadChildReportPDF(selectedChildId);
      
      // Check if blob is valid
      if (!blob || blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const child = childrenList.find(c => c.id === selectedChildId);
      
      // Format date for filename
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const childName = child?.name.replace(/\s+/g, '-').toLowerCase() || 'child';
      
      a.download = `AutiSmart-Progress-Report-${childName}-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error('PDF Download Error:', err);
      alert('Failed to download PDF. ' + (err.message || 'Please try again.'));
    }
  };

  if ((childrenLoading && !isExpertMode) || allChildrenLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isExpertMode && childrenList.length === 0) {
    return (
      <div className="container mt-5">
        <div className="empty-state">
          <i className="bi bi-person-plus-fill"></i>
          <h4>No Children Added Yet</h4>
          <p>Add a child to view their progress reports</p>
        </div>
      </div>
    );
  }

  if (isExpertMode && allChildren.length === 0) {
    return (
      <div className="container mt-5">
        <div className="empty-state">
          <i className="bi bi-people"></i>
          <h4>No Children Found</h4>
          <p>No children have been registered in the system yet.</p>
        </div>
      </div>
    );
  }

  const selectedChild = isExpertMode
    ? allChildren.find(c => c.id === selectedChildId) || reportData?.child
    : childrenList.find(c => c.id === selectedChildId);

  // Prepare chart data
  const progressChartData = reportData?.statistics?.progressOverTime ? {
    labels: reportData.statistics.progressOverTime.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    ),
    datasets: [{
      label: 'Average Score (%)',
      data: reportData.statistics.progressOverTime.map(item => item.averageScore),
      borderColor: '#61C3B4',
      backgroundColor: 'rgba(97, 195, 180, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#61C3B4',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  } : null;

  const activityChartData = reportData?.statistics?.byActivityType ? {
    labels: Object.keys(reportData.statistics.byActivityType),
    datasets: [{
      label: 'Average Score (%)',
      data: Object.values(reportData.statistics.byActivityType).map(item => item.averageScore.toFixed(1)),
      backgroundColor: [
        '#61C3B4',
        '#79C9A0',
        '#b4a7d6',
        '#f4a261',
        '#5EBEB0',
        '#52b788'
      ],
      borderColor: '#fff',
      borderWidth: 2,
      borderRadius: 8
    }]
  } : null;

  return (
    <div className="child-reports-container">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="page-title">
            <i className="bi bi-file-earmark-bar-graph me-2"></i>
            Progress Reports
          </h2>
          {reportData && (
            <button className="btn btn-primary" onClick={handleDownloadPDF}>
              <i className="bi bi-download me-2"></i>
              Download PDF
            </button>
          )}
        </div>

        {/* Child Selector */}
        <div className="mb-4 position-relative">
          <label className="form-label">Select Child:</label>
          <div className="d-flex gap-2 align-items-center">
            <button 
              className="btn d-flex align-items-center justify-content-between w-100"
              style={{ 
                maxWidth: '400px',
                border: '2px solid #5EBDB0',
                color: '#5EBDB0',
                backgroundColor: 'transparent'
              }}
              onClick={() => setShowChildList(!showChildList)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5EBDB0';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#5EBDB0';
              }}
            >
              <span>
                <i className="bi bi-person-circle me-2"></i>
                {selectedChild ? `${selectedChild.name} - ${selectedChild.age} years` : 'Select a child'}
              </span>
              <i className={`bi bi-chevron-${showChildList ? 'up' : 'down'}`}></i>
            </button>
          </div>
          
          {/* Dropdown List */}
          {showChildList && (
            <div 
              className="card position-absolute shadow-lg mt-2" 
              style={{ 
                maxWidth: '400px', 
                width: '100%',
                zIndex: 1050,
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              <div className="list-group list-group-flush">
                {displayChildren.map(child => (
                  <button
                    key={child.id}
                    className={`list-group-item list-group-item-action d-flex align-items-center`}
                    style={{
                      backgroundColor: child.id === selectedChildId ? '#5EBDB0' : 'transparent',
                      color: child.id === selectedChildId ? '#fff' : 'inherit',
                      border: 'none',
                      borderBottom: '1px solid #dee2e6'
                    }}
                    onClick={() => {
                      setSelectedChildId(child.id);
                      localStorage.setItem('lastSelectedChildForReport', child.id);
                      setShowChildList(false);
                    }}
                  >
                    <div className="d-flex align-items-center w-100">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: '50px',
                          height: '50px',
                          backgroundColor: child.id === selectedChildId ? '#fff' : '#5EBDB0',
                          color: child.id === selectedChildId ? '#5EBDB0' : '#fff',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {child.profileImage ? (
                          <img 
                            src={child.profileImage} 
                            alt={child.name}
                            className="rounded-circle"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          child.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-0">{child.name}</h6>
                        <small className={child.id === selectedChildId ? 'text-white-50' : 'text-muted'}>
                          {child.age} years old {child.gender && `• ${child.gender}`}
                        </small>
                      </div>
                      {child.id === selectedChildId && (
                        <i className="bi bi-check-circle-fill text-white"></i>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {reportData && !loading && (
          <>
            {/* Child Bio Section */}
            <div className="report-section">
              <h3 className="section-title">Child Information</h3>
              <div className="child-bio-card">
                <div className="row">
                  <div className="col-md-2 text-center">
                    <div className="child-avatar-large">
                      {selectedChild?.profileImage ? (
                        <img src={selectedChild.profileImage} alt={selectedChild.name} />
                      ) : (
                        <div className="avatar-placeholder-large">
                          {selectedChild?.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-10">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <strong>Name:</strong> {reportData.child.name}
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>Age:</strong> {reportData.child.age} years
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>Gender:</strong> {reportData.child.gender}
                      </div>
                      {reportData.child.dateOfBirth && (
                        <div className="col-md-6 mb-3">
                          <strong>Date of Birth:</strong> {new Date(reportData.child.dateOfBirth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                      {reportData.child.diagnosis && (
                        <div className="col-md-12 mb-3">
                          <strong>Diagnosis:</strong> {reportData.child.diagnosis}
                        </div>
                      )}
                      {reportData.child.specialNeeds && (
                        <div className="col-md-12 mb-3">
                          <strong>Special Needs:</strong> {reportData.child.specialNeeds}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="report-section">
              <h3 className="section-title">Activity Summary</h3>
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-activity"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{reportData.statistics.totalActivities}</div>
                      <div className="stat-label">Total Activities</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-controller"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{reportData.statistics.totalGames}</div>
                      <div className="stat-label">Games Played</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-clipboard-check"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{reportData.statistics.totalAssessments}</div>
                      <div className="stat-label">Assessments</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-graph-up-arrow"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{reportData.statistics.averageScore.toFixed(1)}%</div>
                      <div className="stat-label">Average Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cognitive Assessment */}
            {reportData.cognitiveAssessment && (
              <div className="report-section">
                <h3 className="section-title">Cognitive Assessment</h3>
                <div className="assessment-card">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="assessment-item">
                        <strong>Overall Level:</strong>
                        <span className={`badge ms-2 bg-${getLevelBadgeClass(reportData.cognitiveAssessment.overallLevel)}`}>
                          {reportData.cognitiveAssessment.overallLevel}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="assessment-item">
                        <strong>Progress Trend:</strong>
                        <span className={`badge ms-2 bg-${getTrendBadgeClass(reportData.cognitiveAssessment.progressTrend)}`}>
                          {reportData.cognitiveAssessment.progressTrend}
                        </span>
                      </div>
                    </div>
                  </div>

                  {reportData.cognitiveAssessment.strengths && reportData.cognitiveAssessment.strengths.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-success">
                        <i className="bi bi-star-fill me-2"></i>Strengths
                      </h5>
                      <ul>
                        {reportData.cognitiveAssessment.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reportData.cognitiveAssessment.areasForImprovement && reportData.cognitiveAssessment.areasForImprovement.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>Areas for Improvement
                      </h5>
                      <ul>
                        {reportData.cognitiveAssessment.areasForImprovement.map((area, index) => (
                          <li key={index}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reportData.cognitiveAssessment.recommendations && reportData.cognitiveAssessment.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-primary">
                        <i className="bi bi-lightbulb me-2"></i>Recommendations
                      </h5>
                      <ul>
                        {reportData.cognitiveAssessment.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Charts */}
            {progressChartData && (
              <div className="report-section">
                <h3 className="section-title">Progress Over Time</h3>
                <div className="chart-container">
                  <Line 
                    data={progressChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          display: true,
                          position: 'top',
                          labels: {
                            font: { size: 14, weight: '600' },
                            padding: 15,
                            usePointStyle: true
                          }
                        },
                        title: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12,
                          titleFont: { size: 14, weight: 'bold' },
                          bodyFont: { size: 13 },
                          cornerRadius: 8,
                          displayColors: true,
                          callbacks: {
                            label: function(context) {
                              return `Score: ${context.parsed.y.toFixed(1)}%`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function(value) {
                              return value + '%';
                            },
                            font: { size: 12 }
                          },
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        x: {
                          ticks: {
                            font: { size: 12 }
                          },
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {activityChartData && (
              <div className="report-section">
                <h3 className="section-title">Performance by Activity</h3>
                <div className="chart-container">
                  <Bar 
                    data={activityChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12,
                          titleFont: { size: 14, weight: 'bold' },
                          bodyFont: { size: 13 },
                          cornerRadius: 8,
                          callbacks: {
                            label: function(context) {
                              return `Average: ${context.parsed.y}%`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function(value) {
                              return value + '%';
                            },
                            font: { size: 12 }
                          },
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        x: {
                          ticks: {
                            font: { size: 12 }
                          },
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Game Progress by Type */}
            {reportData.statistics.byActivityType && Object.keys(reportData.statistics.byActivityType).filter(name => 
              ['Memory Match', 'Color Matching', 'Sound Matching'].includes(name)
            ).length > 0 && (
              <div className="report-section">
                <h3 className="section-title">
                  <i className="bi bi-controller me-2"></i>
                  Game Progress Details
                </h3>
                <div className="row g-3">
                  {Object.entries(reportData.statistics.byActivityType)
                    .filter(([name]) => ['Memory Match', 'Color Matching', 'Sound Matching'].includes(name))
                    .map(([gameName, stats]) => (
                    <div key={gameName} className="col-md-4">
                      <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <div className="me-3">
                              {gameName === 'Memory Match' && <i className="bi bi-grid-3x3-gap fs-2 text-primary"></i>}
                              {gameName === 'Color Matching' && <i className="bi bi-palette fs-2 text-success"></i>}
                              {gameName === 'Sound Matching' && <i className="bi bi-music-note-beamed fs-2 text-info"></i>}
                            </div>
                            <div>
                              <h5 className="mb-0">{gameName}</h5>
                              <small className="text-muted">Times Played: {stats.count}</small>
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="d-flex justify-content-between mb-1">
                              <small>Average Score</small>
                              <small className="fw-bold">{stats.averageScore.toFixed(1)}%</small>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div 
                                className={`progress-bar ${
                                  stats.averageScore >= 80 ? 'bg-success' : 
                                  stats.averageScore >= 60 ? 'bg-primary' : 
                                  stats.averageScore >= 40 ? 'bg-warning' : 'bg-danger'
                                }`}
                                style={{ width: `${stats.averageScore}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-top">
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">
                                <i className="bi bi-trophy-fill text-warning me-1"></i>
                                Total Points
                              </span>
                              <span className="fw-bold">{Math.round(stats.totalScore)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Games History */}
            {reportData.statistics.gamesList && reportData.statistics.gamesList.length > 0 && (
              <div className="report-section">
                <h3 className="section-title">Games History</h3>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Game Name</th>
                        <th>Score</th>
                        <th>Time Taken</th>
                        <th>Date Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.statistics.gamesList.map((game, index) => (
                        <tr key={index}>
                          <td>
                            <i className="bi bi-controller me-2 text-primary"></i>
                            {game.name}
                          </td>
                          <td>
                            <span className={`badge bg-${getScoreBadgeClass(game.score)}`}>
                              {game.score ? `${game.score.toFixed(1)}%` : 'N/A'}
                            </span>
                          </td>
                          <td>
                            {game.timeTaken ? 
                              `${Math.floor(game.timeTaken / 60)}m ${game.timeTaken % 60}s` : 
                              'N/A'}
                          </td>
                          <td>
                            {new Date(game.completedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Assessments History */}
            {reportData.statistics.assessmentsList && reportData.statistics.assessmentsList.length > 0 && (
              <div className="report-section">
                <h3 className="section-title">Assessments History</h3>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Assessment Name</th>
                        <th>Category</th>
                        <th>Score</th>
                        <th>Date Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.statistics.assessmentsList.map((assessment, index) => (
                        <tr key={index}>
                          <td>
                            <i className="bi bi-clipboard-check me-2 text-success"></i>
                            {assessment.name}
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {assessment.category}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${getScoreBadgeClass(assessment.score)}`}>
                              {assessment.score ? `${assessment.score.toFixed(1)}%` : 'N/A'}
                            </span>
                          </td>
                          <td>
                            {new Date(assessment.completedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Activities */}
            {reportData.statistics.recentActivities && reportData.statistics.recentActivities.length > 0 && (
              <div className="report-section">
                <h3 className="section-title">Recent Activities</h3>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Activity</th>
                        <th>Type</th>
                        <th>Score</th>
                        <th>Duration</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.statistics.recentActivities.slice(0, 10).map((activity, index) => (
                        <tr key={index}>
                          <td>
                            {activity.activityName === 'Memory Match' && <i className="bi bi-grid-3x3-gap me-2 text-primary"></i>}
                            {activity.activityName === 'Color Matching' && <i className="bi bi-palette me-2 text-success"></i>}
                            {activity.activityName === 'Sound Matching' && <i className="bi bi-music-note-beamed me-2 text-info"></i>}
                            {activity.activityName}
                            {activity.details?.level && (
                              <span className="badge bg-secondary ms-2" style={{ fontSize: '0.7rem' }}>
                                Level {activity.details.level}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge bg-${getActivityTypeBadgeClass(activity.activityType)}`}>
                              {activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${getScoreBadgeClass(activity.percentage)}`}>
                              {activity.score}/{activity.maxScore} ({activity.percentage.toFixed(1)}%)
                            </span>
                          </td>
                          <td>
                            {activity.duration ? 
                              `${Math.floor(activity.duration / 60)}m ${activity.duration % 60}s` : 
                              'N/A'}
                          </td>
                          <td>
                            {activity.completedAt ? 
                              new Date(activity.completedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 
                              'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper functions for badge colors
function getLevelBadgeClass(level) {
  switch (level) {
    case 'Excellent': return 'success';
    case 'Good': return 'primary';
    case 'Fair': return 'warning';
    case 'Needs Support': return 'danger';
    default: return 'secondary';
  }
}

function getTrendBadgeClass(trend) {
  switch (trend) {
    case 'Improving': return 'success';
    case 'Declining': return 'danger';
    case 'Stable': return 'info';
    default: return 'secondary';
  }
}

function getActivityTypeBadgeClass(type) {
  switch (type) {
    case 'game': return 'primary';
    case 'assessment': return 'info';
    case 'therapy': return 'success';
    default: return 'secondary';
  }
}

function getScoreBadgeClass(percentage) {
  if (percentage >= 80) return 'success';
  if (percentage >= 60) return 'primary';
  if (percentage >= 40) return 'warning';
  return 'danger';
}

export default ChildReports;
