import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { chatApi } from '../utils/chatApi';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
// Import your existing BottomNav component
import BottomNav from '../component/BottomNav';

const MessagesScreen = ({ navigation }) => {
  const { currentLanguage, t, formatText, translateDynamic } = useLanguage();
  
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);

  const [translatedCurrentBooking, setTranslatedCurrentBooking] = useState(null);
  const [translatedRecentChats, setTranslatedRecentChats] = useState([]);

  // Get current user ID
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      setCurrentUserId(currentUser.uid);
    }
  }, []);

  // Load conversations from backend
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  // Translate conversations when language changes
  useEffect(() => {
    translateConversations();
  }, [currentLanguage, conversations]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // First, ensure user is registered in chat backend
      await ensureUserRegistered();
      
      // Small delay to ensure user is fully registered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load conversations
      const conversationsData = await chatApi.getConversations(currentUserId);
      
      // Handle empty array (no conversations yet)
      if (!Array.isArray(conversationsData)) {
        console.warn('Conversations data is not an array:', conversationsData);
        setConversations([]);
        setLoading(false);
        return;
      }
      
      // Format conversations
      const formattedConversations = conversationsData.map((conv) => {
        // Find the other participant (not the current user)
        // Compare using MongoDB _id (ObjectId) or firebaseUid
        const otherParticipant = conv.participants?.find((p) => {
          const participantId = typeof p === 'object' ? (p._id?.toString() || p.firebaseUid) : p;
          const currentId = typeof currentUserId === 'string' && currentUserId.length === 24 
            ? currentUserId 
            : currentUserId;
          return participantId !== currentId && participantId !== currentUserId;
        });
        
        const participantData = typeof otherParticipant === 'object' 
          ? otherParticipant 
          : { _id: otherParticipant, name: 'Unknown User', avatar: '' };
        
        const lastMessage = conv.lastMessage || {};
        const lastMessageText = lastMessage.text || '';
        const lastMessageTime = lastMessage.createdAt || conv.lastMessageTime || new Date();
        
        // Use firebaseUid if available, otherwise use _id
        const receiverId = participantData.firebaseUid || participantData._id?.toString() || participantData._id;
        
        return {
          id: conv._id,
          conversationId: conv._id,
          name: participantData.name || 'Unknown',
          message: lastMessageText || t('messages.noMessages'),
          time: formatTime(lastMessageTime),
          avatar: participantData.avatar || 'https://via.placeholder.com/60',
          receiverId: receiverId,
          receiverMongoId: participantData._id?.toString() || participantData._id, // Store MongoDB ID separately
          isOnline: participantData.isOnline || false,
        };
      });
      
      setConversations(formattedConversations);
      
      // Set first conversation as current booking if available
      if (formattedConversations.length > 0) {
        setCurrentBooking(formattedConversations[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Don't show alert for empty conversations - just set empty array
      if (error.message && error.message.includes('User not found')) {
        console.log('User not registered yet, returning empty conversations');
        setConversations([]);
      } else {
        // Only show alert for actual errors
        console.error('Failed to load conversations:', error);
        setConversations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const ensureUserRegistered = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      // Get user data from Firestore
      const userDoc = await firestore()
        .collection('Useraccount')
        .doc(currentUser.uid)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Try to get user from chat backend
        let chatUser = null;
        try {
          chatUser = await chatApi.getUser(currentUser.uid);
          console.log('✅ User found in chat backend:', chatUser._id);
        } catch (error) {
          console.log('⚠️ User not found, registering...', error.message);
          // User doesn't exist in chat backend, register them
          try {
            const registrationResult = await chatApi.registerUser({
              firebaseUid: currentUser.uid, // Add Firebase UID
              name: userData.name || currentUser.displayName || 'User',
              email: userData.email || currentUser.email || `${currentUser.uid}@example.com`,
              phone: userData.phone || '0000000000', // Provide default phone
              avatar: userData.profileImage || userData.photoURL || '',
            });
            console.log('✅ User registered in chat backend:', registrationResult.user?._id);
            chatUser = registrationResult.user;
          } catch (regError) {
            // If registration fails with "already exists", try to get user again
            if (regError.message && regError.message.includes('already exists')) {
              console.log('⚠️ User already exists, fetching again...');
              chatUser = await chatApi.getUser(currentUser.uid);
            } else {
              throw regError;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring user registration:', error);
    }
  };

  const translateConversations = async () => {
      if (currentLanguage === 'th') {
        const translated = await Promise.all(
        conversations.map(async (chat) => {
            const translatedName = await translateDynamic(chat.name);
          const translatedMessage = await translateDynamic(chat.message);
            const translatedTime = await translateTime(chat.time);

            return {
              ...chat,
              name: translatedName,
              message: translatedMessage,
              time: translatedTime,
            };
          })
        );
        setTranslatedRecentChats(translated);
      
      if (currentBooking) {
        const translatedBookingName = await translateDynamic(currentBooking.name);
        const translatedBookingTime = await translateTime(currentBooking.time);
        setTranslatedCurrentBooking({
          ...currentBooking,
          name: translatedBookingName,
          time: translatedBookingTime,
        });
      }
      } else {
      setTranslatedRecentChats(conversations);
      setTranslatedCurrentBooking(currentBooking);
    }
  };

  const translateTime = async (time) => {
    if (currentLanguage === 'th') {
      // Convert time format (e.g., "3:00 PM" to Thai format)
      const timeRegex = /(\d+):(\d+)\s*(AM|PM)/i;
      const match = time.match(timeRegex);
      
      if (match) {
        const [_, hours, minutes, period] = match;
        const translatedHours = formatText(hours);
        const translatedMinutes = formatText(minutes);
        const translatedPeriod = period.toUpperCase() === 'AM' ? 'น.' : 'น.';
        
        return `${translatedHours}:${translatedMinutes} ${translatedPeriod}`;
      }
    }
    return time;
  };

  const handleChatPress = async (chat) => {
    if (!currentUserId) {
      Alert.alert(t('alerts.error'), 'User not logged in');
      return;
    }

    try {
      // Ensure conversation exists or create it
      let conversationId = chat.conversationId;
      
      if (!conversationId && chat.receiverId) {
        const conversation = await chatApi.createOrGetConversation(
          currentUserId,
          chat.receiverId
        );
        conversationId = conversation._id;
      }

      // Navigate to chat screen
    navigation.navigate('chat', {
        conversationId: conversationId,
        receiverId: chat.receiverId,
      receiverName: chat.name,
        currentUserId: currentUserId,
      });
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert(t('alerts.error'), 'Failed to open chat');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return t('messages.now');
    if (minutes < 60) return `${minutes}m ${t('messages.ago')}`;
    
    const hours = date.getHours();
    const minutes2 = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes2 < 10 ? `0${minutes2}` : minutes2;
    
    const timeString = `${formattedHours}:${formattedMinutes} ${period}`;
    
    if (currentLanguage === 'th') {
      return formatText(timeString.replace('AM', 'น.').replace('PM', 'น.'));
    }
    
    return timeString;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE5DD" />

      {/* Header */}
      <LinearGradient
        colors={['#DEAAB2', '#FFDDE5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('messages.header')}</Text>
          </View>
        </View>

        {/* Current Booking in Header */}
        {translatedCurrentBooking && (
        <View style={styles.currentBookingInHeader}>
          <Text style={styles.currentBookingLabel}>
            {t('messages.currentBooking')}
          </Text>
          <TouchableOpacity
            style={styles.currentBookingRow}
            onPress={() => handleChatPress(translatedCurrentBooking)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: translatedCurrentBooking.avatar }}
              style={styles.currentBookingAvatar}
            />
            <View style={styles.currentBookingTextContainer}>
              <Text style={styles.currentBookingName}>
                {translatedCurrentBooking.name}
              </Text>
              <Text style={styles.currentBookingTime}>
                {t('messages.at')} {translatedCurrentBooking.time}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        )}
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D96073" />
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent Chats Section */}
        <View style={styles.recentChatsSection}>
          <Text style={styles.sectionTitle}>{t('messages.recentChats')}</Text>
            {translatedRecentChats.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('messages.noConversations')}</Text>
              </View>
            ) : (
              translatedRecentChats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatItem}
              onPress={() => handleChatPress(chat)}
              activeOpacity={0.7}
            >
              <View style={styles.chatAvatarContainer}>
                <Image source={{ uri: chat.avatar }} style={styles.chatAvatar} />
                    {chat.isOnline && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                    <Text style={styles.chatMessage} numberOfLines={1}>
                      {chat.message}
                    </Text>
              </View>
            </TouchableOpacity>
              ))
            )}
        </View>
      </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNav navigation={navigation} active="messages" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE5DD',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for bottom nav
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    paddingTop: Platform.OS === 'ios' ? 44 : 32,
    shadowColor: '#D7B5BA',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 28,
    color: '#6B4C5C',
    fontWeight: '300',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4A2C3A',
    textAlign: 'center',
  },
  currentBookingInHeader: {
    paddingHorizontal: 4,
    marginTop: 8,
  },
  currentBookingLabel: {
    fontSize: 14,
    color: '#6B5B60',
    marginBottom: 8,
    fontWeight: '500',
  },
  currentBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentBookingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4A5B3',
    marginRight: 12,
  },
  currentBookingTextContainer: {
    flex: 1,
  },
  currentBookingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A2C32',
    marginBottom: 2,
  },
  currentBookingTime: {
    fontSize: 13,
    color: '#6B5B60',
  },
  recentChatsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#6B5B60',
    marginBottom: 12,
    fontWeight: '500',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6EF',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chatAvatarContainer: {
    marginRight: 12,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4A5B3',
  },
  chatAvatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF6EF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9B8B8F',
    textAlign: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A2C32',
  },
  chatTime: {
    fontSize: 12,
    color: '#9B8B8F',
  },
  chatMessage: {
    fontSize: 14,
    color: '#6B5B60',
  },
});

export default MessagesScreen;