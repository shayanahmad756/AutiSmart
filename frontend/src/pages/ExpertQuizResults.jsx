import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { childService } from '../services';

const ExpertQuizResults = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await childService.getAllChildren();
        setChildren(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load children');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = children.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          <i className="bi bi-patch-question-fill me-2" style={{ color: '#5EBEB0' }}></i>
          Quiz Results
        </h2>
        <p className="text-muted mb-3">Select a child to view their personalized quiz results</p>
        <div style={{ maxWidth: 280 }}>
          <div className="input-group">
            <span className="input-group-text border-end-0" style={{ background: '#f5f5f5', border: '1px solid #dee2e6' }}>
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: '#f5f5f5', boxShadow: 'none' }}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
          <p className="mt-3 text-muted">Loading children…</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-people" style={{ fontSize: '4rem', opacity: 0.2 }}></i>
          <h5 className="mt-3 fw-normal">
            {search ? 'No children match your search' : 'No children found in the system'}
          </h5>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="row g-4">
          {filtered.map(child => (
            <div key={child._id || child.id} className="col-sm-6 col-lg-4 col-xl-3">
              <div
                className="card border-0 shadow-sm h-100"
                style={{ borderRadius: 16, transition: 'transform .2s, box-shadow .2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div className="card-body d-flex flex-column p-4">
                  {/* Avatar */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: '#5EBEB0',
                        color: '#fff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0
                      }}
                    >
                      {child.profileImage
                        ? <img src={child.profileImage} alt={child.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : child.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.97rem' }}>{child.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {child.age} yrs {child.gender ? `· ${child.gender}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  {child.diagnosis && (
                    <div className="mb-2">
                      <span className="badge" style={{ background: '#e8f5f3', color: '#61C3B4', fontSize: '0.75rem' }}>
                        <i className="bi bi-clipboard2-pulse me-1"></i>{child.diagnosis}
                      </span>
                    </div>
                  )}

                  <div className="mt-auto pt-3">
                    <button
                      className="btn w-100 btn-sm fw-semibold"
                      style={{ background: '#5EBEB0', color: '#fff', borderRadius: 8, border: 'none' }}
                      onClick={() => navigate(`/expert/child/${child._id || child.id}/quiz-results`)}
                    >
                      <i className="bi bi-bar-chart-line me-2"></i>View Quiz Results
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpertQuizResults;
