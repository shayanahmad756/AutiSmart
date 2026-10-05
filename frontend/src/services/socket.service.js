import { io } from 'socket.io-client';

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || '/api').replace('/api', '');

let socket = null;

const socketService = {
  /**
   * Connect to the server with the user's JWT token.
   * Returns the socket instance.
   */
  connect(token) {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
    socket.on('connect_error', (err) => console.warn('[Socket] Connection error:', err.message));

    return socket;
  },

  /**
   * Disconnect and clear the socket instance.
   */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  /** Get the underlying socket instance (may be null). */
  getSocket() {
    return socket;
  },

  /** Subscribe to a socket event. */
  on(event, callback) {
    socket?.on(event, callback);
  },

  /** Unsubscribe from a socket event. */
  off(event, callback) {
    socket?.off(event, callback);
  },

  /** Emit an event to the server. */
  emit(event, data) {
    socket?.emit(event, data);
  },
};

export default socketService;
