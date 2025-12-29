// Socket.IO connection utility
import io from 'socket.io-client';
import { CHAT_CONFIG } from '../config/chatConfig';

const SOCKET_URL = CHAT_CONFIG.SOCKET_URL;

let socket = null;

export const getSocket = (userId) => {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    // Connect user when socket is ready
    if (userId) {
      socket.on('connect', () => {
        console.log('Socket connected, emitting user_connected:', userId);
        socket.emit('user_connected', userId);
      });
    }
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const connectUser = (userId) => {
  if (!socket) {
    socket = getSocket(userId);
  } else if (socket.connected) {
    socket.emit('user_connected', userId);
  } else {
    socket.on('connect', () => {
      socket.emit('user_connected', userId);
    });
  }
};

