// WebSocket functionality is disabled - Firebase Cloud Functions do not support persistent connections
console.warn('WebSocket disabled - Firebase Cloud Functions do not support persistent connections');

// Mock socket implementation to prevent crashes
const mockSocket = {
  connected: false,
  on: (event, callback) => {
    console.log(`[Mock Socket] Added ${event} listener`);
  },
  emit: (event, ...args) => {
    console.log(`[Mock Socket] Emitted ${event}`, args);
  },
  disconnect: () => {
    console.log('[Mock Socket] Disconnected');
  }
};

let socket = mockSocket;

/**
 * Get mock socket instance
 * @param {string} userId - User ID (not used in mock)
 * @returns {Object} Mock socket instance
 */
export const getSocket = (userId) => {
  console.warn('WebSocket disabled - getSocket called with userId:', userId);
  return socket;
};

/**
 * Disconnect socket (no-op in mock)
 */
export const disconnectSocket = () => {
  console.log('[Mock Socket] Disconnect requested');
  socket = mockSocket;
};

/**
 * Connect user (no-op in mock)
 * @param {string} userId - User ID to connect
 */
export const connectUser = (userId) => {
  console.warn('WebSocket disabled - connectUser called with userId:', userId);
};

