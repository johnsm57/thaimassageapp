// API Configuration
// Centralized configuration for API endpoints

import { Platform } from 'react-native';

// Detect if running on Android emulator
// For Android emulator: use 10.0.2.2 (special IP that maps to host machine)
// For physical device: use your computer's local IP
// For iOS simulator: use localhost (works on simulator)

/**
 * Get the base API URL based on the platform
 */
const getBaseAPIUrl = () => {
  // Check environment variable first
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  // For Android emulator
  if (Platform.OS === 'android') {
    // You can detect emulator by checking if running in development mode
    // For now, defaulting to physical device IP
    // Change to 'http://10.0.2.2:3000' if using Android emulator
    return __DEV__ ? 'http://10.0.2.2:3000' : 'http://192.168.18.51:3000';
  }

  // For iOS simulator, localhost works
  if (Platform.OS === 'ios') {
    return 'http://localhost:3000';
  }

  // Default fallback (physical device IP)
  return 'http://192.168.18.51:3000';
};

/**
 * Get chat backend URL
 */
const getChatBackendUrl = () => {
  if (process.env.CHAT_BACKEND_URL) {
    return process.env.CHAT_BACKEND_URL;
  }

  if (Platform.OS === 'android') {
    return __DEV__ ? 'http://10.0.2.2:5001' : 'http://192.168.18.51:5001';
  }

  if (Platform.OS === 'ios') {
    return 'http://localhost:5001';
  }

  return 'http://192.168.18.51:5001';
};

export const API_BASE_URL = getBaseAPIUrl();
export const CHAT_BACKEND_URL = getChatBackendUrl();

console.log(`🌐 API Configuration - Platform: ${Platform.OS}, API_BASE_URL: ${API_BASE_URL}, CHAT_BACKEND_URL: ${CHAT_BACKEND_URL}`);
