const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Firebase Cloud Functions API is running',
    timestamp: new Date().toISOString()
  });
});

// GET /api/salons endpoint
app.get('/api/salons', async (req, res) => {
  try {
    const salonsSnapshot = await admin.firestore()
      .collection('salons')
      .where('isActive', '==', true)
      .get();
    
    const salons = [];
    
    salonsSnapshot.forEach(doc => {
      const data = doc.data();
      // Ensure rating and price are numbers
      const formattedData = {
        ...data,
        rating: typeof data.rating === 'string' ? parseFloat(data.rating) : data.rating,
        price: typeof data.price === 'string' ? parseFloat(data.price) : data.price
      };
      
      salons.push({
        id: doc.id,
        ...formattedData
      });
    });
    
    res.json({
      success: true,
      data: salons
    });
  } catch (error) {
    console.error('Error fetching salons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch salons',
      details: error.message
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Return sample user data if not found
      return res.json({
        success: true,
        data: {
          id: userId,
          name: 'Unknown User',
          email: '',
          photoURL: '',
          createdAt: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      details: error.message
    });
  }
});

// Get conversations for a user
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Query conversations where the user is a participant
    const conversationsSnapshot = await admin.firestore()
      .collection('conversations')
      .where('participants', 'array-contains', userId)
      .get();

    const conversations = [];
    
    conversationsSnapshot.forEach(doc => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
      details: error.message
    });
  }
});

// Register new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { firebaseUid, name, email, phone, avatar } = req.body;

    // Validate required fields
    if (!firebaseUid || !name || !email) {
      return res.status(400).json({
        success: false,
        error: 'firebaseUid, name, and email are required fields'
      });
    }

    const userData = {
      firebaseUid,
      name,
      email,
      phone: phone || '',
      avatar: avatar || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save user to Firestore
    await admin.firestore().collection('users').doc(firebaseUid).set(userData, { merge: true });

    res.status(201).json({
      success: true,
      data: {
        id: firebaseUid,
        ...userData
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      details: error.message
    });
  }
});

// Bookings request endpoint
app.post('/api/v1/bookings/request', async (req, res) => {
  try {
    const {
      firebaseUID,
      userId = firebaseUID, // Support both firebaseUID and userId for backward compatibility
      salonId,
      salonOwnerId,
      name,
      email,
      requestedDateTime,
      durationMinutes,
      age,
      weightKg
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: firebaseUID or userId is required'
      });
    }

    if (!salonId || !salonOwnerId || !name || !requestedDateTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: salonId, salonOwnerId, name, and requestedDateTime are required'
      });
    }

    const bookingData = {
      userId, // Store the user's ID (from firebaseUID or userId)
      salonId,
      salonOwnerId,
      name,
      email: email || '', // Make email optional but ensure it's always a string
      requestedDateTime,
      durationMinutes: Number(durationMinutes) || 60, // Default to 60 minutes if not provided
      age: Number(age) || null, // Make age optional
      weightKg: Number(weightKg) || 0,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const bookingRef = await admin.firestore().collection('bookings').add(bookingData);

    res.status(201).json({
      success: true,
      data: {
        id: bookingRef.id,
        ...bookingData
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      details: error.message
    });
  }
});

// Recommendations endpoint
app.get('/api/v1/recommendations/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const recommendationsSnapshot = await admin.firestore()
      .collection('salons')
      .where('isActive', '==', true)
      .limit(limit)
      .get();
    
    const recommendations = [];
    
    recommendationsSnapshot.forEach(doc => {
      const data = doc.data();
      // Ensure rating and price are numbers
      const formattedData = {
        ...data,
        rating: typeof data.rating === 'string' ? parseFloat(data.rating) : data.rating,
        price: typeof data.price === 'string' ? parseFloat(data.price) : data.price
      };
      
      recommendations.push({
        id: doc.id,
        ...formattedData
      });
    });
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
      details: error.message
    });
  }
});

// Private massagers endpoint
app.get('/api/private-massagers', (req, res) => {
  // Return empty array as requested
  res.json({
    success: true,
    data: []
  });
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);