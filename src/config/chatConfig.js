// Chat backend configuration
// Update these URLs to match your backend server

// ⚠️ WHY IP ADDRESS INSTEAD OF LOCALHOST?
// - Android devices can't use 'localhost' - it refers to the device itself, not your computer
// - Your backend runs on your computer, so Android needs your computer's IP address
// - Web app can use localhost because it runs on the same machine as the backend
//
// 📱 FOR ANDROID EMULATOR:
//   Use: 'http://10.0.2.2:5000' (special IP that maps to host machine)
//
// 📱 FOR PHYSICAL ANDROID DEVICE:
//   Use your computer's local IP: 'http://192.168.x.x:5000'
//   Find your IP: 
//   - Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
//   - Windows: ipconfig
//
// 🌐 FOR PRODUCTION:
//   Use your deployed backend URL: 'https://your-backend.com'

// Production chat backend URL
const CHAT_BACKEND_URL = 'https://api-4evlextkmq-uc.a.run.app';

export const CHAT_CONFIG = {
  SOCKET_URL: CHAT_BACKEND_URL,
  API_URL: `${CHAT_BACKEND_URL}/api`,
};

export default CHAT_CONFIG;

