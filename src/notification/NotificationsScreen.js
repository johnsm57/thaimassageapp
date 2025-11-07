import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const NotificationsScreen = ({ navigation }) => {
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

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const renderNotification = ({ item }) => (
    <View style={styles.notificationItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationName}>{item.name}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );

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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </LinearGradient>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <View key={item.id} style={styles.notificationItem}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationName}>{item.name}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
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
            <Text style={styles.emptyText}>No notifications</Text>
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