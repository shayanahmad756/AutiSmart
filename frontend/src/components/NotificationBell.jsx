import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import http from '../api/http';

const POLL_INTERVAL = 30_000; // 30 seconds

function getSeenKey(userId) {
  return `notif_seen_${userId}`;
}

function getSeenIds(userId) {
  try {
    return JSON.parse(localStorage.getItem(getSeenKey(userId)) || '[]');
  } catch {
    return [];
  }
}

function saveSeenIds(userId, ids) {
  localStorage.setItem(getSeenKey(userId), JSON.stringify(ids));
}

const TYPE_STYLES = {
  success: { border: '#198754', bg: '#d1e7dd', icon: 'bi-check-circle-fill', color: '#0f5132' },
  danger:  { border: '#dc3545', bg: '#f8d7da', icon: 'bi-x-circle-fill',     color: '#842029' },
  warning: { border: '#ffc107', bg: '#fff3cd', icon: 'bi-exclamation-circle-fill', color: '#664d03' },
  info:    { border: '#0dcaf0', bg: '#cff4fc', icon: 'bi-info-circle-fill',   color: '#055160' },
};

export default function NotificationBell() {
  const { isAuthenticated, user } = useAuth();
  // Backend stores user with `id` (not `_id`)
  const userId = user?.id || user?._id;
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);
  const intervalRef = useRef(null);

  const computeUnread = useCallback((notifs, uid) => {
    const seen = getSeenIds(uid);
    return notifs.filter((n) => !seen.includes(n.id)).length;
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    try {
      const res = await http.get('/auth/notifications');
      const notifs = res.data?.data || [];
      setNotifications(notifs);
      setUnread(computeUnread(notifs, userId));
    } catch {
      // silently ignore — non-critical
    }
  }, [isAuthenticated, userId, computeUnread]);

  // Initial fetch + polling
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [isAuthenticated, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleMarkAllRead = () => {
    if (!userId) return;
    saveSeenIds(userId, notifications.map((n) => n.id));
    setUnread(0);
  };

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  if (!isAuthenticated) return null;

  return (
    <div
      ref={panelRef}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}
    >
      {/* Floating panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            right: 0,
            width: 340,
            maxHeight: 420,
            overflowY: 'auto',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            background: 'var(--bs-body-bg, #fff)',
            border: '1px solid var(--bs-border-color, #dee2e6)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15 }}>Notifications</span>
            {unread > 0 && (
              <button
                className="btn btn-sm btn-link p-0 text-decoration-none"
                style={{ fontSize: 13 }}
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6c757d', fontSize: 14 }}>
              <i className="bi bi-bell-slash me-2" />
              No notifications yet
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
              {notifications.map((n) => {
                const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                const seen = getSeenIds(userId).includes(n.id);
                return (
                  <li
                    key={n.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 16px',
                      borderLeft: `4px solid ${style.border}`,
                      background: seen ? 'transparent' : style.bg,
                      marginBottom: 2,
                    }}
                  >
                    <i
                      className={`bi ${style.icon}`}
                      style={{ color: style.border, fontSize: 16, marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, color: style.color, lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                      {n.createdAt && (
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6c757d' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {!seen && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: style.border,
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Bell button */}
      <button
        onClick={handleToggle}
        title="Notifications"
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 'none',
          background: '#ffc107',
          color: '#212529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
          cursor: 'pointer',
          position: 'relative',
          fontSize: 22,
        }}
      >
        <i className={`bi ${unread > 0 ? 'bi-bell-fill' : 'bi-bell'}`} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#dc3545',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              border: '2px solid #fff',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
