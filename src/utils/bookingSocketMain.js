// Socket.IO connection for main backend (booking notifications)
// Main backend runs on port 3000, chat backend runs on port 5001
import io from 'socket.io-client';
import { API_BASE_URL } from '../config/apiConfig';

// Use the centralized API_BASE_URL for the booking socket
const BOOKING_SOCKET_URL = API_BASE_URL;

// WebSocket functionality is disabled - Firebase Cloud Functions do not support persistent connections
console.warn('WebSocket disabled - Firebase Cloud Functions do not support persistent connections');

// Mock socket object to prevent crashes
const mockSocket = {
  connected: false,
  on: () => {},
  emit: () => {},
  disconnect: () => {}
};

let bookingSocket = mockSocket;

/**
 * Get booking socket connection (disabled)
 * @param {string} userId - User's Firebase UID or salon owner ID
 */
export const getBookingSocket = (userId) => {
  console.warn('WebSocket disabled - getBookingSocket called with userId:', userId);
  return bookingSocket;
};

/**
 * Disconnect booking socket
 */
export const disconnectBookingSocket = () => {
  try {
    if (bookingSocket) {
      if (typeof bookingSocket.disconnect === 'function') {
        bookingSocket.disconnect();
      } else if (bookingSocket.close) {
        bookingSocket.close();
      }
      bookingSocket = null;
    }
  } catch (error) {
    console.warn('Error disconnecting booking socket:', error);
  }
};

/**
 * Connect user to booking socket
 */
export const connectBookingUser = (userId) => {
  if (!bookingSocket) {
    bookingSocket = getBookingSocket(userId);
  } else if (bookingSocket.connected) {
    bookingSocket.emit('user_connected', userId);
  } else {
    bookingSocket.on('connect', () => {
      bookingSocket.emit('user_connected', userId);
    });
  }
};

