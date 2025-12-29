// Socket.IO connection for main backend (booking notifications)
// Main backend runs on port 3000, chat backend runs on port 5001
import io from 'socket.io-client';

// IMPORTANT: This should match your main backend URL (not chat backend)
// IMPORTANT: This should match your main backend URL (not chat backend)
// For Android emulator: use "http://10.0.2.2:3000"
// For physical device: use your computer's IP (e.g., "http://192.168.18.51:3000")
const BOOKING_SOCKET_URL = process.env.API_BASE_URL || "http://192.168.18.51:3000";

let bookingSocket = null;

/**
 * Get booking socket connection (main backend)
 * @param {string} userId - User's Firebase UID or salon owner ID
 */
export const getBookingSocket = (userId) => {
  if (!bookingSocket || !bookingSocket.connected) {
    console.log('🔌 Attempting to connect booking socket to:', BOOKING_SOCKET_URL);
    
    bookingSocket = io(BOOKING_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: true, // Force a new connection
    });

    // Connect user when socket is ready
    if (userId) {
      bookingSocket.on('connect', () => {
        console.log('✅ Booking socket connected successfully, emitting user_connected:', userId);
        bookingSocket.emit('user_connected', userId);
      });
    }

    bookingSocket.on('disconnect', (reason) => {
      console.log('❌ Booking socket disconnected. Reason:', reason);
    });

    bookingSocket.on('connect_error', (error) => {
      console.error('❌ Booking socket connection error:', error.message);
      console.error('❌ Socket URL:', BOOKING_SOCKET_URL);
      console.error('❌ Error details:', error);
    });

    bookingSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Booking socket reconnected after', attemptNumber, 'attempts');
      if (userId) {
        bookingSocket.emit('user_connected', userId);
      }
    });

    bookingSocket.on('reconnect_error', (error) => {
      console.error('❌ Booking socket reconnection error:', error.message);
    });
  }

  return bookingSocket;
};

/**
 * Disconnect booking socket
 */
export const disconnectBookingSocket = () => {
  if (bookingSocket) {
    bookingSocket.disconnect();
    bookingSocket = null;
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

