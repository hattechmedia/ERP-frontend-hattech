// Mock socket with in-browser event dispatcher
// Zero network calls, zero WebSocket connections
const listeners = {};

const socket = {
  on: (event, fn) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  },
  off: (event, fn) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((cb) => cb !== fn);
    }
  },
  emit: (event, data) => {
    // Local no-op for rooms
  },
  trigger: (event, data) => {
    if (listeners[event]) {
      listeners[event].forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error("Socket mock listener error:", e);
        }
      });
    }
  },
  connect: () => {},
  disconnect: () => {},
  connected: true,
};

export default socket;
