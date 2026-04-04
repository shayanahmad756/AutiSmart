import { useState, useEffect, useCallback } from 'react';
import userAPI from '../api/user.api';
import Card from '../components/Card';

const AdminExpertAssignments = () => {
  const [activeTab,   setActiveTab]   = useState('pending');
  const [pending,     setPending]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [actionKey,   setActionKey]   = useState(null); // `${caregiverId}-${expertId}`
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendRes, assRes] = await Promise.all([
        userAPI.getAdminExpertRequests(),
        userAPI.getAdminExpertAssignments(),
      ]);
      setPending(pendRes.data || []);
      setAssignments(assRes.data || []);
    } catch {
      showToast('Failed to load assignment data', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const key = (caregiverId, expertId) => `${caregiverId}-${expertId}`;

  const handleApprove = async (caregiverId, expertId) => {
    setActionKey(key(caregiverId, expertId));
    try {
      await userAPI.approveExpertRequest(caregiverId, expertId);
      showToast('Request approved. Expert is now assigned.');
      await load();
    } catch (err) {
      showToast(err.message || 'Failed to approve', 'danger');
    } finally {
      setActionKey(null);
    }
  };

  const handleReject = async (caregiverId, expertId) => {
    setActionKey(key(caregiverId, expertId));
    try {
      await userAPI.rejectExpertRequest(caregiverId, expertId);
      showToast('Request rejected.', 'warning');
      await load();
    } catch (err) {
      showToast(err.message || 'Failed to reject', 'danger');
    } finally {
      setActionKey(null);
    }
  };

  const handleRemove = async (caregiverId, expertId) => {
    if (!window.confirm('Remove this expert assignment? The caregiver will need to request again.')) return;
    setActionKey(key(caregiverId, expertId));
    try {
      await userAPI.removeExpertAssignment(caregiverId, expertId);
      showToast('Assignment removed.', 'warning');
      await load();
    } catch (err) {
      showToast(err.message || 'Failed to remove', 'danger');
    } finally {
      setActionKey(null);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Toast */}
      {toast && (
        <div
          className={`alert alert-${toast.type} position-fixed`}
          style={{ top: 20, right: 20, zIndex: 9999, minWidth: 300 }}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-primary-custom">
          <i className="bi bi-person-lines-fill me-2"></i>Expert Assignments
        </h1>
        <p className="text-muted">
          Manage caregiver requests to be assigned an expert. Approve or reject pending
          requests, and remove active assignments when needed.
        </p>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <Card className="text-center">
            <h3 className="text-warning mb-1">{pending.length}</h3>
            <p className="text-muted mb-0">Pending Requests</p>
          </Card>
        </div>
        <div className="col-md-6">
          <Card className="text-center">
            <h3 className="text-success mb-1">{assignments.length}</h3>
            <p className="text-muted mb-0">Active Assignments</p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests
            {pending.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">{pending.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Assignments
            <span className="badge bg-success ms-2">{assignments.length}</span>
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center mt-4">
          <span className="spinner-border spinner-border-sm me-2"></span>Loading…
        </div>
      ) : (
        <>
          {/* ── Pending Requests Tab ──────────────────────────────────────── */}
          {activeTab === 'pending' && (
            <>
              {pending.length === 0 ? (
                <div className="alert alert-info">No pending requests at the moment.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Caregiver</th>
                        <th>Caregiver Email</th>
                        <th>Requested Expert</th>
                        <th>Expert Email</th>
                        <th>Requested On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((r) => {
                        const k = key(r.caregiverId, r.expertId);
                        const busy = actionKey === k;
                        return (
                          <tr key={k}>
                            <td>{r.caregiverName}</td>
                            <td>{r.caregiverEmail}</td>
                            <td>{r.expertName}</td>
                            <td>{r.expertEmail}</td>
                            <td>
                              {r.requestedAt
                                ? new Date(r.requestedAt).toLocaleDateString()
                                : '—'}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleApprove(r.caregiverId, r.expertId)}
                                  disabled={busy}
                                >
                                  {busy
                                    ? <span className="spinner-border spinner-border-sm"></span>
                                    : <><i className="bi bi-check-lg me-1"></i>Approve</>}
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleReject(r.caregiverId, r.expertId)}
                                  disabled={busy}
                                >
                                  {busy
                                    ? <span className="spinner-border spinner-border-sm"></span>
                                    : <><i className="bi bi-x-lg me-1"></i>Reject</>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Active Assignments Tab ────────────────────────────────────── */}
          {activeTab === 'active' && (
            <>
              {assignments.length === 0 ? (
                <div className="alert alert-info">No active assignments yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Caregiver</th>
                        <th>Caregiver Email</th>
                        <th>Assigned Expert</th>
                        <th>Expert Email</th>
                        <th>Since</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => {
                        const k = key(a.caregiverId, a.expertId);
                        const busy = actionKey === k;
                        return (
                          <tr key={k}>
                            <td>{a.caregiverName}</td>
                            <td>{a.caregiverEmail}</td>
                            <td>{a.expertName}</td>
                            <td>{a.expertEmail}</td>
                            <td>
                              {a.requestedAt
                                ? new Date(a.requestedAt).toLocaleDateString()
                                : '—'}
                            </td>
                            <td>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleRemove(a.caregiverId, a.expertId)}
                                disabled={busy}
                              >
                                {busy
                                  ? <span className="spinner-border spinner-border-sm"></span>
                                  : <><i className="bi bi-trash me-1"></i>Remove</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminExpertAssignments;
