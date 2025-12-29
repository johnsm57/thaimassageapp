// Booking Socket.IO handlers for mobile app
// Uses main backend socket (port 3000) for booking notifications
// Uses chat backend socket (port 5001) for chat messages
import { getBookingSocket, connectBookingUser } from './bookingSocketMain';
import { getSocket } from './socket'; // Chat socket
import { chatApi } from './chatApi';

/**
 * Setup booking notification listeners
 * @param {string} firebaseUID - User's Firebase UID
 * @param {object} callbacks - Callback functions for different events
 * @param {function} callbacks.onBookingAccepted - Called when booking is accepted
 * @param {function} callbacks.onBookingRejected - Called when booking is rejected
 * @param {function} callbacks.onChatRoomCreated - Called when chat room is created
 * @param {function} callbacks.onBookingStatusUpdate - Called when booking status updates
 */
export const setupBookingListeners = (firebaseUID, callbacks = {}) => {
  // Use booking socket (main backend) for booking notifications
  const socket = getBookingSocket(firebaseUID);
  connectBookingUser(firebaseUID);

  // Listen for booking status updates
  socket.on('booking_status_update', async (data) => {
    console.log('📬 Booking status update received:', data);
    
    const { bookingId, status, booking, conversationId } = data;

    if (callbacks.onBookingStatusUpdate) {
      callbacks.onBookingStatusUpdate({ bookingId, status, booking, conversationId });
    }

    // Handle specific statuses
    if (status === 'accepted' && callbacks.onBookingAccepted) {
      callbacks.onBookingAccepted({ bookingId, booking, conversationId });
    } else if (status === 'rejected' && callbacks.onBookingRejected) {
      callbacks.onBookingRejected({ bookingId, booking });
    }
  });

  // Listen for chat room created
  socket.on('chat_room_created', async (data) => {
    console.log('💬 Chat room created:', data);
    
    const { conversationId, bookingId, salonOwnerId, salonOwnerName } = data;

    if (callbacks.onChatRoomCreated) {
      callbacks.onChatRoomCreated({
        conversationId,
        bookingId,
        salonOwnerId,
        salonOwnerName,
      });
    }
  });

  // Listen for booking notifications
  socket.on('booking_notification', (data) => {
    console.log('📬 Booking notification received:', data);
    
    if (callbacks.onBookingNotification) {
      callbacks.onBookingNotification(data);
    }
  });

  return socket;
};

/**
 * Remove booking listeners
 */
export const removeBookingListeners = (firebaseUID) => {
  const socket = getBookingSocket(firebaseUID);
  
  socket.off('booking_status_update');
  socket.off('chat_room_created');
  socket.off('booking_notification');
};

/**
 * Navigate to chat when booking is accepted
 * This helper function can be used in navigation context
 */
export const navigateToChat = async (navigation, conversationId, salonOwnerId, salonOwnerName) => {
  try {
    console.log('🚀 navigateToChat called with:', { conversationId, salonOwnerId, salonOwnerName });
    
    // Get or create conversation
    const currentUser = require('@react-native-firebase/auth').default().currentUser;
    if (!currentUser) {
      console.error('❌ User not authenticated');
      return;
    }

    console.log('👤 Current user UID:', currentUser.uid);

    // If we have a conversationId, try to navigate directly first
    if (conversationId) {
      console.log('📱 Attempting direct navigation with conversationId:', conversationId);
      try {
        // Try to get the conversation to verify it exists
        const conversations = await chatApi.getConversations(currentUser.uid);
        console.log('📋 User conversations:', conversations);
        
        const foundConv = conversations.find(
          (conv) => {
            const convId = conv._id?.toString() || conv._id;
            const targetId = conversationId?.toString() || conversationId;
            return convId === targetId;
          }
        );
      
        if (foundConv) {
          const otherParticipant = foundConv.participants.find(
            (p) => {
              const pId = typeof p === 'object' ? p._id : p;
              return pId !== currentUser.uid && pId.toString() !== currentUser.uid;
            }
          );

          console.log('📱 Navigating to chat with conversationId:', foundConv._id);
          navigation.navigate('chat', {
            conversationId: foundConv._id.toString(),
            receiverId: typeof otherParticipant === 'object' ? otherParticipant._id.toString() : otherParticipant.toString(),
            receiverName: typeof otherParticipant === 'object' ? otherParticipant.name : salonOwnerName || 'Salon Owner',
            currentUserId: currentUser.uid,
          });
          return; // Successfully navigated
        }
      } catch (error) {
        console.error('⚠️ Error fetching conversations, will create new one:', error);
      }
    }

    // If no conversationId or conversation not found, create/get one
    if (!salonOwnerId) {
      console.error('❌ salonOwnerId is required to create conversation');
      return;
    }

    console.log('📱 Creating/getting conversation with salonOwnerId:', salonOwnerId);
    try {
      const newConv = await chatApi.createOrGetConversation(currentUser.uid, salonOwnerId);
      console.log('✅ Conversation created/retrieved:', newConv._id);
      navigation.navigate('chat', {
        conversationId: newConv._id.toString(),
        receiverId: salonOwnerId.toString(),
        receiverName: salonOwnerName || 'Salon Owner',
        currentUserId: currentUser.uid,
      });
    } catch (createError) {
      console.error('❌ Error creating conversation:', createError);
      throw createError; // Re-throw to show error to user
    }
  } catch (error) {
    console.error('❌ Error in navigateToChat:', error);
    throw error; // Re-throw so caller can handle it
  }
};
