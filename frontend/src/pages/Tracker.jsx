import { useState, useEffect } from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import ChildSelector from '../components/ChildSelector';
import { useChild } from '../context/ChildContext';
import { assessmentService } from '../services';
import '../styles/assessment.css';

const CATEGORY_ICONS = {
  'Eye Contact': 'bi-eye',
  'Social Interaction': 'bi-people',
  'Communication': 'bi-chat-dots',
  'Repetitive Behavior': 'bi-arrow-repeat',
  'Sensory Sensitivity': 'bi-lightbulb',
  'Focus & Attention': 'bi-crosshair',
};

const CATEGORY_NAMES = [
  'Eye Contact',
  'Social Interaction',
  'Communication',
  'Repetitive Behavior',
  'Sensory Sensitivity',
  'Focus & Attention'
];

function getSeverityColor(pct) {
  if (pct >= 60) return 'success';
  if (pct >= 40) return 'warning';
  return 'danger';
}

function getLevelColor(autismLevel) {
  if (autismLevel === 'Beginner Level') return 'success';
  if (autismLevel === 'Intermediate Level') return 'warning';
  return 'danger';
}

const Tracker = () => {
  const { selectedChild } = useChild();
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedChild?.id) {
      setAssessmentData(null);
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await assessmentService.getChildResults(selectedChild.id);
        setAssessmentData(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedChild?.id]);

  // For each category independently, find the most recent result that actually assessed it (total > 0).
  // This means a focused assessment (e.g. Eye Contact only) won't reset unrelated category bars.
  const allResults = assessmentData?.results || [];
  const latestResult = allResults[0] || null;

  const symptoms = CATEGORY_NAMES.map((name, idx) => {
    const resultsWithData = allResults.filter(
      (r) => (r.categoryScores?.[name]?.total ?? 0) > 0
    );
    const current = resultsWithData[0] || null;
    const previous = resultsWithData[1] || null;

    const cat = current?.categoryScores?.[name];
    const prevCat = previous?.categoryScores?.[name];
    const severity = cat && cat.total > 0 ? Math.round(((cat.total * 3 - cat.score) / (cat.total * 3)) * 100) : 0;
    const prevSeverity = prevCat && prevCat.total > 0 ? Math.round(((prevCat.total * 3 - prevCat.score) / (prevCat.total * 3)) * 100) : null;
    const trend = prevSeverity === null ? 'up' : severity >= prevSeverity ? 'up' : 'down';
    const hasData = current !== null;
    return { id: idx + 1, name, severity, trend, color: getSeverityColor(severity), hasData };
  });

  // Derive recent logs from last 5 assessment results
  const recentLogs = (assessmentData?.results || []).slice(0, 5).map((result) => {
    const d = new Date(result.createdAt);
    return {
      date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      symptom: `Assessment completed — ${result.assessmentLevel} level`,
      mood: result.autismLevel,
      notes: `Score: ${result.scorePercentage}%`
    };
  });

  // Stat card values
  const totalResults = assessmentData?.stats?.totalAttempts ?? 0;
  const overallProgress = latestResult ? `${latestResult.scorePercentage}%` : '—';
  const activeSymptoms = latestResult
    ? CATEGORY_NAMES.filter(n => (latestResult.categoryScores?.[n]?.total ?? 0) > 0).length
    : 0;

  const hasData = latestResult !== null;

  return (
    <div className="container mt-4 mb-5">
      <div className="mb-4">
        <h1 className="text-primary-custom">
          <i className="bi bi-graph-up me-2"></i>
          Symptom Tracker
        </h1>
        <p className="text-muted">
          Monitor and track your child's behavior patterns and progress
        </p>
      </div>

      {/* Child Selector */}
      <div className="mb-4">
        <ChildSelector />
      </div>

      {!selectedChild && (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Please select a child above to view their symptom tracking data.
        </div>
      )}

      {selectedChild && loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {selectedChild && error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {selectedChild && !loading && !error && !hasData && (
        <div className="alert alert-warning">
          <i className="bi bi-clipboard-x me-2"></i>
          No assessment data found for <strong>{selectedChild.name}</strong>. Please complete an assessment quiz first.
        </div>
      )}

      {selectedChild && !loading && hasData && (
        <>
          {/* Stats Overview */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <StatCard value={overallProgress} label="Latest Score" variant="success" />
            </div>
            <div className="col-md-3">
              <StatCard value={String(totalResults)} label="Assessments Taken" variant="info" />
            </div>
            <div className="col-md-3">
              <StatCard value={String(activeSymptoms)} label="Active Symptoms" variant="warning" />
            </div>
            <div className="col-md-3">
              <StatCard
                value={latestResult.autismLevel.replace(' Level', '')}
                label="Autism Level"
                variant={getLevelColor(latestResult.autismLevel) === 'success' ? 'success' : getLevelColor(latestResult.autismLevel) === 'warning' ? 'warning' : 'danger'}
              />
            </div>
          </div>

          {/* Latest Assessment Info */}
          <div className="mb-4">
            <div className="alert alert-secondary d-flex align-items-center gap-3 mb-0" style={{ borderRadius: '10px' }}>
              <i className="bi bi-clipboard-check fs-5"></i>
              <div>
                <strong>Latest Assessment:</strong>{' '}
                <span className="text-capitalize">{latestResult.assessmentLevel}</span> level &nbsp;|&nbsp;
                <strong>Date:</strong>{' '}
                {new Date(latestResult.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                &nbsp;|&nbsp;
                <strong>Severity:</strong>{' '}
                <span className={`badge bg-${getLevelColor(latestResult.autismLevel)}`}>
                  {latestResult.autismLevel}
                </span>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Symptom Progress */}
            <div className="col-lg-8">
              <Card>
                <h5 className="mb-3" style={{ color: 'var(--text-primary, #000)', fontWeight: '600' }}>
                  <i className="bi bi-bar-chart-fill me-2" style={{ color: '#0d6efd' }}></i>
                  Symptom Progress Overview
                </h5>
                {symptoms.map((symptom) => (
                  symptom.hasData ? (
                    <div key={symptom.id} className={`symptom-progress-item ${symptom.color}-category`} style={{ padding: '11px 14px', marginBottom: '10px' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                          <i className={`bi ${CATEGORY_ICONS[symptom.name] || 'bi-circle'} me-1`} style={{ fontSize: '1rem' }}></i>
                          {symptom.name}
                          {symptom.severity >= 50
                            ? <i className="bi bi-arrow-up-circle-fill text-success ms-1" style={{ fontSize: '0.95rem' }}></i>
                            : <i className="bi bi-arrow-down-circle-fill text-danger ms-1" style={{ fontSize: '0.95rem' }}></i>
                          }
                        </div>
                        <span className={`badge bg-${symptom.color}`} style={{ fontSize: '0.8rem', padding: '5px 12px' }}>{symptom.severity}%</span>
                      </div>
                      <div className="progress" style={{ height: '14px', borderRadius: '10px' }}>
                        <div className={`progress-bar bg-${symptom.color}`} role="progressbar" style={{ width: `${symptom.severity}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <div key={symptom.id} className="symptom-progress-item" style={{ opacity: 0.4, padding: '11px 14px', marginBottom: '10px' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                          <i className={`bi ${CATEGORY_ICONS[symptom.name] || 'bi-circle'} me-1`} style={{ fontSize: '1rem' }}></i>
                          {symptom.name}
                        </div>
                        <span className="badge bg-secondary" style={{ fontSize: '0.78rem' }}>Not assessed</span>
                      </div>
                      <div className="progress" style={{ height: '14px', borderRadius: '10px' }}>
                        <div className="progress-bar bg-secondary" role="progressbar" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  )
                ))}
              </Card>

              {/* Assessment History Table */}
              {assessmentData.results.length > 1 && (
                <Card className="mt-4">
                  <h5 className="mb-4" style={{ color: 'var(--text-primary, #000)' }}>
                    Assessment History
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Level</th>
                          <th>Score</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessmentData.results.map((result, index) => (
                          <tr key={result._id || index}>
                            <td>
                              <small>
                                {new Date(result.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric'
                                })}
                              </small>
                            </td>
                            <td>
                              <span className="badge bg-secondary text-capitalize">{result.assessmentLevel}</span>
                            </td>
                            <td>
                              <span className={`badge bg-${result.scorePercentage >= 70 ? 'success' : result.scorePercentage >= 40 ? 'warning' : 'danger'}`}>
                                {result.scorePercentage}%
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${getLevelColor(result.autismLevel)}`}>
                                {result.autismLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>

            {/* Recent Activity Log */}
            <div className="col-lg-4">
              <Card>
                <h5 className="mb-4" style={{ color: 'var(--text-primary, #000)' }}>
                  Recent Assessment Log
                </h5>
                <div className="d-grid gap-3">
                  {recentLogs.map((log, index) => (
                    <div key={index} className="p-3 rounded" style={{
                      backgroundColor: 'var(--bg-secondary, #f8f9fa)',
                      border: '1px solid var(--border-color, #dee2e6)'
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <small style={{ color: 'var(--text-secondary, #6c757d)' }}>
                          <i className="bi bi-calendar3 me-1"></i>
                          {log.date}
                        </small>
                        <small style={{ color: 'var(--text-secondary, #6c757d)' }}>{log.time}</small>
                      </div>
                      <p className="mb-1 fw-medium" style={{ color: 'var(--text-primary, #000)' }}>{log.symptom}</p>
                      <div className="d-flex gap-2 align-items-center flex-wrap">
                        <span className={`badge bg-${getLevelColor(log.mood)}`}>{log.mood}</span>
                        {log.notes && (
                          <small style={{ color: 'var(--text-secondary, #6c757d)' }}>{log.notes}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Tracker;
