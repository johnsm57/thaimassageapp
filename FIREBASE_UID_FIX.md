# Firebase UID Integration Fix

## Issues Fixed

1. ✅ **Firebase UID vs MongoDB ObjectId**: Backend now supports both Firebase UIDs and MongoDB ObjectIds
2. ✅ **Phone field requirement**: Made phone optional with default empty string
3. ✅ **User lookup**: Backend can find users by Firebase UID or MongoDB ObjectId

## Changes Made

### Backend (`/Users/hammadsiddiq/Downloads/chat-backend/server.js`)

1. **User Schema** - Added `firebaseUid` field:
   ```javascript
   firebaseUid: { type: String, unique: true, sparse: true }
   phone: { type: String, default: '' } // Now optional
   ```

2. **User Registration** - Accepts `firebaseUid`:
   ```javascript
   firebaseUid: firebaseUid || undefined
   phone: phone || '' // Default empty string
   ```

3. **User Lookup** - Supports both formats:
   - MongoDB ObjectId (24 hex characters)
   - Firebase UID (any string)

4. **Socket Handlers** - Updated to handle Firebase UIDs:
   - `user_connected`: Finds user by firebaseUid or ObjectId
   - `send_message`: Converts Firebase UIDs to MongoDB ObjectIds

### Mobile App (`src/chat/MessagesScreen.js`)

1. **User Registration** - Now includes Firebase UID:
   ```javascript
   firebaseUid: currentUser.uid
   phone: userData.phone || '0000000000' // Default phone
   ```

## How It Works

### User Registration Flow

1. Mobile app registers user with Firebase UID:
   ```javascript
   {
     firebaseUid: "h9pIyGPVEUUiBMRddhFzu6cLlOS2",
     name: "User Name",
     email: "user@example.com",
     phone: "0000000000",
     avatar: ""
   }
   ```

2. Backend stores user with:
   - MongoDB `_id`: Auto-generated ObjectId
   - `firebaseUid`: Firebase UID string
   - Other fields: name, email, phone, avatar

### User Lookup

Backend can find users by:
- **MongoDB ObjectId**: `GET /api/users/507f1f77bcf86cd799439011`
- **Firebase UID**: `GET /api/users/h9pIyGPVEUUiBMRddhFzu6cLlOS2`

### Conversation Creation

When creating conversations:
1. Mobile app sends Firebase UIDs: `userId1`, `userId2`
2. Backend finds users by `firebaseUid`
3. Backend creates conversation with MongoDB ObjectIds: `[user1._id, user2._id]`

## Testing

After restarting the backend server:

1. **Clear old data** (if needed):
   ```bash
   # Connect to MongoDB and clear users collection if you have old data
   ```

2. **Restart backend**:
   ```bash
   cd /Users/hammadsiddiq/Downloads/chat-backend
   node server.js
   ```

3. **Test mobile app**:
   - Open Messages screen
   - User should register automatically
   - No more "Cast to ObjectId failed" errors
   - No more "phone required" errors

## Notes

- **Backward Compatible**: Backend still supports MongoDB ObjectIds for web app users
- **Phone Field**: Now optional, defaults to empty string
- **Firebase UID**: Stored separately from MongoDB `_id` for flexibility

