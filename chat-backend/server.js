require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// MONGODB CONNECTION
// ============================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thaimassageapp:thai12345678@cluster0.6wpsnbz.mongodb.net/?appName=Cluster0';

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// ============================================
// MONGODB SCHEMAS & MODELS
// ============================================

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    avatar: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    socketId: { type: String, default: '' },
  },
  { timestamps: true }
);

// Conversation Schema
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastMessageTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
conversationSchema.index({ participants: 1 });

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messageType: { type: String, enum: ['text', 'image'], default: 'text' },
    text: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Create Models
const User = mongoose.model('User', userSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

// ============================================
// SOCKET.IO SETUP
// ============================================
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Store online users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // ============================================
  // EVENT: USER CONNECTED
  // ============================================
  socket.on('user_connected', async (userId) => {
    try {
      console.log(`👤 User ${userId} connected`);
      
      onlineUsers.set(userId, socket.id);

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        socketId: socket.id,
        lastSeen: new Date(),
      });

      io.emit('user_status', {
        userId,
        isOnline: true,
      });
    } catch (error) {
      console.error('❌ Error in user_connected:', error);
    }
  });

  // ============================================
  // EVENT: SEND MESSAGE
  // ============================================
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, receiverId, text, messageType, imageUrl, tempId } = data;

      console.log('📤 Sending message:', { senderId, receiverId });

      // Find or create conversation
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
      }

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
        });
      }

      // Create message
      const newMessage = await Message.create({
        conversationId: conversation._id,
        sender: senderId,
        receiver: receiverId,
        messageType: messageType || 'text',
        text: text || '',
        imageUrl: imageUrl || '',
        isDelivered: false,
        isRead: false,
      });

      // Populate sender info
      await newMessage.populate('sender', 'name avatar');

      // Update conversation
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: newMessage._id,
        lastMessageTime: new Date(),
      });

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', {
          message: {
            _id: newMessage._id,
            conversationId: conversation._id,
            sender: newMessage.sender,
            text: newMessage.text,
            imageUrl: newMessage.imageUrl,
            messageType: newMessage.messageType,
            createdAt: newMessage.createdAt,
          },
        });

        // Mark as delivered
        await Message.findByIdAndUpdate(newMessage._id, {
          isDelivered: true,
          deliveredAt: new Date(),
        });
      }

      // Send confirmation to sender
      socket.emit('message_sent', {
        message: {
          _id: newMessage._id,
          conversationId: conversation._id,
          tempId: tempId,
          text: newMessage.text,
          imageUrl: newMessage.imageUrl,
          messageType: newMessage.messageType,
          createdAt: newMessage.createdAt,
          isDelivered: receiverSocketId ? true : false,
        },
      });

      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error in send_message:', error);
      socket.emit('message_error', { error: error.message });
    }
  });

  // ============================================
  // EVENT: MESSAGE DELIVERED
  // ============================================
  socket.on('message_delivered', async (messageId) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { isDelivered: true, deliveredAt: new Date() },
        { new: true }
      );

      if (message) {
        const senderSocketId = onlineUsers.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_status_update', {
            messageId,
            isDelivered: true,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error in message_delivered:', error);
    }
  });

  // ============================================
  // EVENT: MESSAGE READ
  // ============================================
  socket.on('message_read', async (data) => {
    try {
      const { messageId, conversationId, userId } = data;

      await Message.findByIdAndUpdate(messageId, {
        isRead: true,
        readAt: new Date(),
      });

      // Mark all messages in conversation as read
      await Message.updateMany(
        { conversationId, receiver: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      const message = await Message.findById(messageId);
      if (message) {
        const senderSocketId = onlineUsers.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_status_update', {
            messageId,
            conversationId,
            isRead: true,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error in message_read:', error);
    }
  });

  // ============================================
  // EVENT: TYPING INDICATOR
  // ============================================
  socket.on('typing', (data) => {
    const { receiverId, isTyping, userId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        userId,
        isTyping,
      });
    }
  });

  // ============================================
  // EVENT: DISCONNECT
  // ============================================
  socket.on('disconnect', async () => {
    console.log('❌ Client disconnected:', socket.id);

    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      try {
        await User.findByIdAndUpdate(disconnectedUserId, {
          isOnline: false,
          lastSeen: new Date(),
          socketId: '',
        });

        io.emit('user_status', {
          userId: disconnectedUserId,
          isOnline: false,
        });
      } catch (error) {
        console.error('❌ Error updating user status:', error);
      }
    }
  });
});

// ============================================
// REST API ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    message: 'Chat API Server',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    onlineUsers: onlineUsers.size
  });
});

// ============================================
// USER ROUTES
// ============================================

// Create/Register User
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    user = await User.create({
      name,
      email,
      phone,
      avatar: avatar || '',
    });

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-socketId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for user list)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-socketId').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONVERSATION ROUTES
// ============================================

// Get user's conversations
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'name avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or get conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] },
    }).populate('participants', 'name avatar isOnline lastSeen');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId1, userId2],
      });

      await conversation.populate('participants', 'name avatar isOnline lastSeen');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MESSAGE ROUTES
// ============================================

// Get messages for a conversation
app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
app.post('/api/messages/mark-read', async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread message count
app.get('/api/messages/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// IMAGE UPLOAD (Simple Base64 Storage)
// ============================================
app.post('/api/upload', async (req, res) => {
  try {
    const { image, filename } = req.body;
    
    // In production, upload to Cloudinary/AWS S3
    // For now, we'll just return a placeholder
    // You can store base64 directly in MongoDB or use cloud storage
    
    const imageUrl = `data:image/jpeg;base64,${image}`;
    
    res.json({ 
      success: true,
      url: imageUrl 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🚀 Chat Server Running               ║
  ║   📡 Port: ${PORT}                       ║
  ║   🌐 http://localhost:${PORT}            ║
  ║   💾 MongoDB: Connected                ║
  ║   ⚡ Socket.IO: Active                 ║
  ╚════════════════════════════════════════╝
  `);
});