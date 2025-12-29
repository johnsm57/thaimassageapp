# Chat Testing Guide: Web App ↔ Mobile App

This guide will help you test real-time chat between the web app (salon owner) and mobile app (customer).

## Prerequisites

1. **Backend server** running and accessible
2. **Web app** running
3. **Mobile app** running on Android device/emulator
4. All devices on the **same network**

---

## Step 1: Find Your Computer's IP Address

### On Mac/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### On Windows:
```bash
ipconfig
```
Look for `IPv4 Address` under your active network adapter (usually starts with `192.168.x.x` or `10.x.x.x`)

**Example IP:** `192.168.1.100`

---

## Step 2: Configure Backend Server

1. **Update backend port** (if needed):
   - Edit `/Users/hammadsiddiq/Downloads/chat-backend/server.js`
   - Line 553: Change to `const PORT = process.env.PORT || 5000;` (or your preferred port)

2. **Start backend server:**
   ```bash
   cd /Users/hammadsiddiq/Downloads/chat-backend
   node server.js
   ```

   You should see:
   ```
   ╔════════════════════════════════════════╗
   ║   🚀 Chat Server Running               ║
   ║   📡 Port: 5000                        ║
   ║   🌐 http://localhost:5000              ║
   ║   💾 MongoDB: Connected                ║
   ║   ⚡ Socket.IO: Active                 ║
   ╚════════════════════════════════════════╝
   ```

---

## Step 3: Configure Mobile App

1. **Update mobile app config:**
   - Edit `src/config/chatConfig.js`
   - Replace `localhost` with your computer's IP address:

   ```javascript
   // Replace YOUR_IP_ADDRESS with your actual IP (e.g., 192.168.1.100)
   const CHAT_BACKEND_URL = 'http://YOUR_IP_ADDRESS:5000';
   ```

   **Example:**
   ```javascript
   const CHAT_BACKEND_URL = 'http://192.168.1.100:5000';
   ```

2. **Rebuild the app:**
   ```bash
   npm run android
   ```

---

## Step 4: Configure Web App

1. **Update web app environment:**
   - Edit `/Users/hammadsiddiq/Documents/GitHub/luci-web-app/.env.local` (create if doesn't exist)
   - Add:

   ```bash
   NEXT_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:5000
   NEXT_PUBLIC_SOCKET_URL=http://YOUR_IP_ADDRESS:5000
   ```

   **Example:**
   ```bash
   NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
   NEXT_PUBLIC_SOCKET_URL=http://192.168.1.100:5000
   ```

2. **Restart web app:**
   ```bash
   cd /Users/hammadsiddiq/Documents/GitHub/luci-web-app
   npm run dev
   ```

---

## Step 5: Testing Flow

### Test 1: User Registration

1. **Mobile App:**
   - Open the app and log in
   - Navigate to Messages screen
   - The app should automatically register the user with the chat backend
   - Check console logs for: `"User registered successfully"` or similar

2. **Web App:**
   - Open browser and navigate to chat page
   - The web app should automatically create/load a salon owner user
   - Check browser console (F12) for any errors

### Test 2: Create Conversation

1. **Mobile App:**
   - Go to Messages screen
   - You should see conversations list (may be empty initially)

2. **Web App:**
   - In the chat interface, you should see users list
   - Select a user (customer from mobile app) to start chatting

### Test 3: Send Message from Web to Mobile

1. **Web App:**
   - Type a message in the chat input
   - Press Enter or click send button
   - Message should appear in the web chat

2. **Mobile App:**
   - Open Messages screen
   - Tap on the conversation
   - You should see the message appear in real-time
   - Check message status (sent/delivered/read)

### Test 4: Send Message from Mobile to Web

1. **Mobile App:**
   - Open a chat conversation
   - Type a message and send
   - Message should appear immediately

2. **Web App:**
   - The message should appear in real-time in the web chat
   - Check message status indicators

### Test 5: Online Status

1. **Web App:**
   - Check if mobile user shows as online (green indicator)
   - When mobile app is closed, status should change to offline

2. **Mobile App:**
   - Check if salon owner shows as online/offline in chat header

### Test 6: Image Messages

1. **Mobile App:**
   - In chat, tap the gallery/image icon
   - Select an image
   - Image should upload and send

2. **Web App:**
   - Image should appear in the chat
   - Click to view full size

### Test 7: Typing Indicators

1. **Mobile App:**
   - Start typing a message
   - Web app should show "Typing..." indicator

2. **Web App:**
   - Start typing a message
   - Mobile app should show typing indicator in chat header

---

## Troubleshooting

### Issue: "Unable to connect to server"

**Solutions:**
- ✅ Verify backend is running: `curl http://YOUR_IP:5000/health`
- ✅ Check firewall settings (allow port 5000)
- ✅ Ensure mobile device and computer are on same WiFi network
- ✅ Verify IP address is correct in both apps

### Issue: "Messages not appearing"

**Solutions:**
- ✅ Check browser console (F12) for errors
- ✅ Check React Native logs: `npx react-native log-android`
- ✅ Verify Socket.IO connection in Network tab (WebSocket)
- ✅ Check MongoDB connection in backend logs

### Issue: "User not found"

**Solutions:**
- ✅ Ensure user is registered in chat backend
- ✅ Check user ID matches between Firebase and chat backend
- ✅ Verify user registration in backend logs

### Issue: "CORS errors"

**Solutions:**
- ✅ Backend CORS is already configured to allow all origins
- ✅ If issues persist, check backend `server.js` CORS settings

---

## Quick Test Checklist

- [ ] Backend server running on port 5000
- [ ] Mobile app configured with correct IP address
- [ ] Web app configured with correct IP address
- [ ] Both apps on same network
- [ ] User registered in chat backend (automatic)
- [ ] Can send message from web → mobile
- [ ] Can send message from mobile → web
- [ ] Messages appear in real-time
- [ ] Online status works
- [ ] Image messages work
- [ ] Typing indicators work

---

## Network Configuration Summary

```
┌─────────────────┐
│  Backend Server │
│  Port: 5000     │
│  IP: YOUR_IP    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐  ┌──▼────┐
│ Web   │  │Mobile│
│ App   │  │ App  │
└───────┘  └──────┘
```

**All three must be on the same network and use the same IP address!**

---

## Next Steps

Once basic chat is working:
1. Test booking request flow
2. Test notification system
3. Test multiple concurrent conversations
4. Test offline message queuing
5. Test message delivery confirmation

---

## Need Help?

Check logs:
- **Backend:** Terminal where `node server.js` is running
- **Web App:** Browser console (F12)
- **Mobile App:** `npx react-native log-android` or Android Studio Logcat

