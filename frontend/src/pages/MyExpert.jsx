import { useState, useEffect, useCallback } from 'react';
import userAPI from '../api/user.api';
import Card from '../components/Card';

const STATUS_BADGE = {
  pending:  { cls: 'bg-warning text-dark', label: '⏳ Pending' },
  approved: { cls: 'bg-success text-white', label: '✓ Assigned' },
  rejected: { cls: 'bg-danger  text-white', label: '✗ Rejected' },
};

const MyExpert = () => {
  const [experts,   setExperts]   = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [actionId,  setActionId]  = useState(null); // expertId currently being acted on
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, reqRes] = await Promise.all([
        userAPI.getExperts(),
        userAPI.getMyExpertRequests(),
      ]);
      setExperts(expRes.data || []);
      setRequests(reqRes.data || []);
    } catch {
      showToast('Failed to load expert data', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const requestStatusFor = (expertId) =>
    requests.find((r) => r.expertId?._id === expertId || r.expertId === expertId);

  const handleRequest = async (expertId) => {
    setActionId(expertId);
    try {
      await userAPI.requestExpert(expertId);
      showToast('Request sent! Waiting for admin approval.');
      await load();
    } catch (err) {
      showToast(err.message || 'Failed to send request', 'danger');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (expertId) => {
    setActionId(expertId);
    try {
      await userAPI.cancelExpertRequest(expertId);
      showToast('Request cancelled.');
      await load();
    } catch (err) {
      showToast(err.message || 'Failed to cancel request', 'danger');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <span className="spinner-border spinner-border-sm me-2"></span> Loading experts…
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* Toast */}
      {toast && (
        <div
          className={`alert alert-${toast.type} alert-dismissible position-fixed`}
          style={{ top: 20, right: 20, zIndex: 9999, minWidth: 280 }}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-primary-custom">
          <i className="bi bi-person-badge me-2"></i>My Expert
        </h1>
        <p className="text-muted">
          Browse available experts and request one to be assigned to you.
          An admin will review your request and approve or reject it.
        </p>
      </div>

      {/* ── My Current Requests ─────────────────────────────────────────── */}
      {requests.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-3">
            <i className="bi bi-list-check me-2"></i>Your Requests
          </h4>
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Expert</th>
                  <th>Email</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                  const expertId = r.expertId?._id || r.expertId;
                  return (
                    <tr key={expertId}>
                      <td>{r.expertId?.name || '—'}</td>
                      <td>{r.expertId?.email || '—'}</td>
                      <td>
                        {r.requestedAt
                          ? new Date(r.requestedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td>
                        {r.status === 'pending' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancel(expertId)}
                            disabled={actionId === expertId}
                          >
                            {actionId === expertId
                              ? <span className="spinner-border spinner-border-sm"></span>
                              : 'Cancel'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── All Experts Grid ──────────────────────────────────────────────── */}
      <h4 className="mb-3">
        <i className="bi bi-people me-2"></i>Available Experts
      </h4>

      {experts.length === 0 ? (
        <div className="alert alert-info">No experts are available at the moment.</div>
      ) : (
        <div className="row g-4">
          {experts.map((expert) => {
            const req = requestStatusFor(expert._id);
            const busy = actionId === expert._id;

            let actionBtn;
            if (!req) {
              actionBtn = (
                <button
                  className="btn btn-primary w-100"
                  onClick={() => handleRequest(expert._id)}
                  disabled={busy}
                >
                  {busy
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending…</>
                    : <><i className="bi bi-send me-2"></i>Request Expert</>}
                </button>
              );
            } else if (req.status === 'pending') {
              actionBtn = (
                <div className="d-flex gap-2">
                  <span className="badge bg-warning text-dark py-2 px-3 flex-grow-1 d-flex align-items-center justify-content-center">
                    ⏳ Pending Approval
                  </span>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleCancel(expert._id)}
                    disabled={busy}
                  >
                    {busy
                      ? <span className="spinner-border spinner-border-sm"></span>
                      : 'Cancel'}
                  </button>
                </div>
              );
            } else if (req.status === 'approved') {
              actionBtn = (
                <span className="btn btn-success w-100 disabled">
                  <i className="bi bi-check-circle me-2"></i>Assigned
                </span>
              );
            } else {
              // rejected — allow requesting again
              actionBtn = (
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => handleRequest(expert._id)}
                  disabled={busy}
                >
                  {busy
                    ? <span className="spinner-border spinner-border-sm me-2"></span>
                    : <><i className="bi bi-arrow-repeat me-2"></i>Request Again</>}
                </button>
              );
            }

            return (
              <div key={expert._id} className="col-md-6 col-lg-4">
                <Card className="h-100">
                  <div className="text-center mb-3">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center bg-primary text-white mb-3"
                      style={{ width: 64, height: 64, fontSize: 28 }}
                    >
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <h5 className="mb-1">{expert.name}</h5>
                    <p className="text-muted small mb-0">{expert.email}</p>
                    <span className="badge bg-info text-dark mt-1">Expert</span>
                  </div>
                  <p className="text-muted small text-center mb-3">
                    Member since {new Date(expert.createdAt).toLocaleDateString()}
                  </p>
                  {actionBtn}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyExpert;
