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
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// IMPORTANT: Update this to your actual backend URL
const API_BASE_URL = 'http://localhost:3000';
const USE_BACKEND_API = false; // Set to true once backend endpoint is ready

const NotificationsScreen = ({ navigation }) => {
  const { currentLanguage, t, translateDynamic } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [translatedNotifications, setTranslatedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Translate notifications when language changes
  useEffect(() => {
    const translateNotifications = async () => {
      if (currentLanguage === 'th' && notifications.length > 0) {
        const translated = await Promise.all(
          notifications.map(async (notification) => {
            const translatedName = await translateDynamic(notification.name);
            const translatedMessage = await translateDynamic(notification.message);
            const translatedTimestamp = await translateTimestamp(notification.timestamp);

            return {
              ...notification,
              name: translatedName,
              message: translatedMessage,
              timestamp: translatedTimestamp,
            };
          })
        );
        setTranslatedNotifications(translated);
      } else {
        setTranslatedNotifications(notifications);
      }
    };

    translateNotifications();
  }, [currentLanguage, notifications]);

  // Main fetch function
  const fetchNotifications = async () => {
    if (USE_BACKEND_API) {
      await fetchFromBackend();
    } else {
      await fetchFromFirestore();
    }
  };

  // Fetch from Backend API (once endpoint is ready)
  const fetchFromBackend = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const firebaseUID = currentUser.uid;

      const response = await fetch(
        `${API_BASE_URL}/api/v1/bookings/user/${firebaseUID}`,
        {
          method: 'GET',
          headers:  {
            'Content-Type':  'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response. status}`);
      }

      const data = await response.json();

      if (data.success && data.bookings) {
        const transformedNotifications = data.bookings
          .filter(booking => booking.status === 'accepted' || booking.status === 'pending')
          .map((booking) => ({
            id: booking._id,
            bookingId: booking._id,
            name: booking. salonId?. salonName || 'Massage Studio',
            message: getNotificationMessage(booking. status),
            avatar: booking.salonId?.imageUrl || null,
            timestamp: getTimeAgo(booking.updatedAt || booking.createdAt),
            status: booking.status,
            type: booking.status === 'accepted' ? 'success' : 'pending',
            bookingDate: booking.requestedDateTime,
            duration: booking.durationMinutes,
            salonId: booking.salonId?._id,
            salonOwnerId: booking.salonOwnerId,
          }))
          .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

        setNotifications(transformedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching from backend:', err);
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch from Firestore (current temporary solution)
  const fetchFromFirestore = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth().currentUser;
      if (! currentUser) {
        throw new Error('User not authenticated');
      }

      const firebaseUID = currentUser.uid;

      // Fetch user's bookings from Firestore
      const bookingsSnapshot = await firestore()
        .collection('bookings')
        .where('firebaseUID', '==', firebaseUID)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      if (! bookingsSnapshot.empty) {
        const firestoreNotifications = bookingsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            
            // Only show accepted or pending bookings
            if (data.status !== 'accepted' && data.status !== 'pending') {
              return null;
            }

            return {
              id: doc.id,
              bookingId: doc.id,
              name: data.salonName || 'Massage Studio',
              message: getNotificationMessage(data.status),
              avatar: data.salonImage || null,
              timestamp:  getTimeAgo(data.updatedAt?. toDate() || data.createdAt?.toDate()),
              status: data.status,
              type: data.status === 'accepted' ? 'success' : 'pending',
              bookingDate: data.requestedDateTime,
              duration: data.durationMinutes || 60,
              salonId: data.salonId,
            };
          })
          .filter(n => n !== null); // Remove null entries
        
        setNotifications(firestoreNotifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching from Firestore:', err);
      setError('Unable to load notifications.  Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Get notification message based on booking status
  const getNotificationMessage = (status) => {
    switch (status) {
      case 'accepted':
        return 'Your massage has been confirmed!  🎉';
      case 'pending':
        return 'Your booking request is pending approval';
      case 'rejected': 
        return 'Your booking was declined';
      case 'cancelled':
        return 'Your booking was cancelled';
      default:
        return 'Booking update';
    }
  };

  // Calculate time ago from timestamp
  const getTimeAgo = (date) => {
    if (!date) return 'Recently';

    const now = new Date();
    const past = date instanceof Date ? date : new Date(date);
    const diffInMs = now - past;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return past.toLocaleDateString();
  };

  const translateTimestamp = async (timestamp) => {
    if (currentLanguage === 'th') {
      if (timestamp === 'Just now') return 'เมื่อสักครู่';
      if (timestamp === 'Recently') return 'เมื่อเร็วๆ นี้';
      if (timestamp. includes('m ago')) {
        const minutes = timestamp.match(/\d+/)?.[0] || '0';
        return `${minutes} นาทีที่แล้ว`;
      } else if (timestamp.includes('h ago')) {
        const hours = timestamp.match(/\d+/)?.[0] || '0';
        return `${hours} ชั่วโมงที่แล้ว`;
      } else if (timestamp.includes('d ago')) {
        const days = timestamp.match(/\d+/)?.[0] || '0';
        return `${days} วันที่แล้ว`;
      }
    }
    return timestamp;
  };

  const handleDeleteNotification = async (id) => {
    // Optimistically update UI
    setNotifications(notifications.filter(notification => notification.id !== id));

    try {
      if (USE_BACKEND_API) {
        // Backend delete - add this endpoint later if needed
        // await fetch(`${API_BASE_URL}/api/v1/notifications/${id}`, { method: 'DELETE' });
      } else {
        // Firestore delete
        await firestore().collection('bookings').doc(id).delete();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      // Revert if fails
      fetchNotifications();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = (notification) => {
    // Navigate to booking details or salon profile
    console.log('Notification pressed:', notification);
    // navigation.navigate('BookingDetails', { bookingId: notification.bookingId });
  };

  const notificationsToRender = translatedNotifications. length > 0 
    ? translatedNotifications 
    : notifications;

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E8C4D4" />
        <LinearGradient
          colors={['#DEAAB2', '#FFDDE5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles. header}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.header')}</Text>
        </LinearGradient>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D96073" />
          <Text style={styles.loadingText}>
            {t('notifications.loading') || 'Loading notifications...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8C4D4" />

      {/* Header */}
      <LinearGradient
        colors={['#DEAAB2', '#FFDDE5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles. backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles. headerTitle}>{t('notifications.header')}</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={fetchNotifications}
        >
          <Icon name="refresh" size={20} color="#6B4C5C" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Error State */}
      {error && (
        <View style={styles. errorBanner}>
          <Icon name="alert-circle" size={20} color="#D96073" />
          <Text style={styles. errorText}>{error}</Text>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D96073"
            colors={['#D96073']}
          />
        }
      >
        {notificationsToRender.length > 0 ? (
          notificationsToRender.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.notificationItem,
                item.type === 'success' && styles.notificationSuccess,
                item.type === 'pending' && styles.notificationPending,
              ]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.7}
            >
              {/* Status Indicator */}
              <View style={[
                styles.statusIndicator,
                item.type === 'success' && styles. statusSuccess,
                item.type === 'pending' && styles.statusPending,
              ]} />

              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {item.avatar ?  (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Icon name="spa" size={24} color="#D4A5B3" />
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.type === 'success' && (
                    <Icon name="check-circle" size={16} color="#4CAF50" />
                  )}
                  {item.type === 'pending' && (
                    <Icon name="clock-outline" size={16} color="#FF9800" />
                  )}
                </View>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                {item.bookingDate && (
                  <View style={styles.bookingInfo}>
                    <Icon name="calendar" size={12} color="#9B8B8F" />
                    <Text style={styles.bookingDate}>
                      {new Date(item.bookingDate).toLocaleDateString()} • {item.duration}min
                    </Text>
                  </View>
                )}
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteNotification(item.id);
                }}
                activeOpacity={0.7}
              >
                <Icon name="close" size={20} color="#D96073" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="bell-off-outline" size={64} color="#D4A5B3" />
            <Text style={styles.emptyText}>
              {t('notifications.noNotifications') || 'No notifications yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {t('notifications. emptySubtext') || 'Your booking updates will appear here'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE5DD',
  },
  centerContainer: {
    flex: 1,
    justifyContent:  'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B5B60',
  },
  header:  {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    paddingTop: Platform.OS === 'ios' ? 44 : 62,
    height: 129,
    shadowColor: '#D7B5BA',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems:  'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 28,
    color: '#6B4C5C',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A2C3A',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:  'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft:  12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize:  14,
    color: '#D96073',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EEEC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  notificationSuccess: {
    backgroundColor:  '#F5FFF5',
  },
  notificationPending: {
    backgroundColor: '#FFF9F0',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width:  4,
  },
  statusSuccess: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FF9800',
  },
  avatarContainer:  {
    marginLeft: 8,
    marginRight: 12,
  },
  avatar:  {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4A5B3',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0E5E9',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A2C32',
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B5B60',
    lineHeight: 18,
    marginBottom: 6,
  },
  bookingInfo: {
    flexDirection:  'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: '#9B8B8F',
  },
  timestamp: {
    fontSize: 12,
    color: '#9B8B8F',
    fontStyle: 'italic',
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color:  '#6B5B60',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9B8B8F',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NotificationsScreen;