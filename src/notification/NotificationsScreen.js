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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useLanguage } from '../context/LanguageContext';

const NotificationsScreen = ({ navigation }) => {
  const { currentLanguage, t, translateDynamic } = useLanguage();
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      name: 'Zen Thai Studio',
      message: 'your massage have been booked',
      avatar: 'https://via.placeholder.com/60',
      timestamp: '2h ago',
    },
    // Add more notifications as needed
  ]);

  const [translatedNotifications, setTranslatedNotifications] = useState([]);

  // Translate notifications when language changes
  useEffect(() => {
    const translateNotifications = async () => {
      if (currentLanguage === 'th') {
        const translated = await Promise.all(
          notifications.map(async (notification) => {
            // Translate studio name
            const translatedName = await translateDynamic(notification.name);
            
            // Translate message if it matches known strings
            let translatedMessage = notification.message;
            if (notification.message === 'your massage have been booked') {
              translatedMessage = t('notifications.yourMassageBooked');
            } else {
              // For custom messages, translate dynamically
              translatedMessage = await translateDynamic(notification.message);
            }

            // Translate timestamp
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

  const translateTimestamp = async (timestamp) => {
    if (currentLanguage === 'th') {
      // Simple timestamp translation
      if (timestamp.includes('h ago')) {
        const hours = timestamp.match(/\d+/)?.[0] || '0';
        return `${hours} ชั่วโมงที่แล้ว`;
      } else if (timestamp.includes('m ago')) {
        const minutes = timestamp.match(/\d+/)?.[0] || '0';
        return `${minutes} นาทีที่แล้ว`;
      } else if (timestamp.includes('d ago')) {
        const days = timestamp.match(/\d+/)?.[0] || '0';
        return `${days} วันที่แล้ว`;
      }
    }
    return timestamp;
  };

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const notificationsToRender = translatedNotifications.length > 0 
    ? translatedNotifications 
    : notifications;

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
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.header')}</Text>
      </LinearGradient>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notificationsToRender.length > 0 ? (
          notificationsToRender.map((item) => (
            <View key={item.id} style={styles.notificationItem}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationName}>{item.name}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteNotification(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
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
  header: {
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
    alignItems: 'center',
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
    marginRight: 52, // To center the title accounting for back button
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
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4A5B3',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A2C32',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B5B60',
    lineHeight: 18,
    marginBottom: 4,
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
  deleteIcon: {
    fontSize: 24,
    color: '#D96073',
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#9B8B8F',
    fontStyle: 'italic',
  },
});

export default NotificationsScreen;