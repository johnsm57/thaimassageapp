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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
// Import your existing BottomNav component
import BottomNav from '../component/BottomNav';

const MessagesScreen = ({ navigation }) => {
  const { currentLanguage, t, formatText, translateDynamic } = useLanguage();
  
  const [currentBooking, setCurrentBooking] = useState({
    id: '1',
    name: 'Zen Thai Studio',
    time: '3:00 PM',
    avatar: 'https://via.placeholder.com/60',
  });

  const [recentChats, setRecentChats] = useState([
    {
      id: '1',
      name: 'Zen Thai Studio',
      message: 'thank you for book.....',
      time: '6:30 A.M',
      avatar: 'https://via.placeholder.com/60',
    },
  ]);

  const [translatedCurrentBooking, setTranslatedCurrentBooking] = useState(currentBooking);
  const [translatedRecentChats, setTranslatedRecentChats] = useState(recentChats);

  // Translate current booking when language changes
  useEffect(() => {
    const translateBooking = async () => {
      if (currentLanguage === 'th') {
        const translatedName = await translateDynamic(currentBooking.name);
        const translatedTime = await translateTime(currentBooking.time);
        
        setTranslatedCurrentBooking({
          ...currentBooking,
          name: translatedName,
          time: translatedTime,
        });
      } else {
        setTranslatedCurrentBooking(currentBooking);
      }
    };

    translateBooking();
  }, [currentLanguage, currentBooking]);

  // Translate recent chats when language changes
  useEffect(() => {
    const translateChats = async () => {
      if (currentLanguage === 'th') {
        const translated = await Promise.all(
          recentChats.map(async (chat) => {
            const translatedName = await translateDynamic(chat.name);
            
            // Translate message
            let translatedMessage = chat.message;
            if (chat.message === 'thank you for book.....') {
              translatedMessage = t('messages.thankYouForBook');
            } else {
              translatedMessage = await translateDynamic(chat.message);
            }

            // Translate time
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
      } else {
        setTranslatedRecentChats(recentChats);
      }
    };

    translateChats();
  }, [currentLanguage, recentChats]);

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

  const handleChatPress = (chat) => {
    // Navigate to chat screen// add configuration according to your api
    navigation.navigate('chat', {
      conversationId: '60f7b3b3b3b3b3b3b3b3b3b3', // Or null for new conversation
      receiverId: '60f7b3b3b3b3b3b3b3b3b3b4', // User ID from MongoDB
      receiverName: chat.name,
      currentUserId: '60f7b3b3b3b3b3b3b3b3b3b5', // Current logged-in user ID
    });
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
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent Chats Section */}
        <View style={styles.recentChatsSection}>
          <Text style={styles.sectionTitle}>{t('messages.recentChats')}</Text>
          {translatedRecentChats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatItem}
              onPress={() => handleChatPress(chat)}
              activeOpacity={0.7}
            >
              <View style={styles.chatAvatarContainer}>
                <Image source={{ uri: chat.avatar }} style={styles.chatAvatar} />
              </View>
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <Text style={styles.chatMessage}>{chat.message}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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